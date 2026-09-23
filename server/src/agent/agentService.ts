import { prisma } from '../db/client.js';
import { getAIProvider } from '../ai/providerFactory.js';
import { AIMessage } from '../ai/types.js';
import { buildSystemPrompt } from './promptBuilder.js';
import { evaluateMessageForMemory, persistOrUpdateMemory } from '../memory/memoryExtractor.js';
import { retrieveRelevantMemories } from '../memory/memoryRetrieval.js';
import { detectTaskIntent, executeToolCall, ToolExecutionResult } from '../tools/toolExecutor.js';
import { TASK_TOOLS } from '../tools/taskTools.js';

export interface ProcessChatParams {
  userId: string;
  conversationId: string;
  content: string;
  providerOverride?: string;
  apiKeyOverride?: string;
  baseUrlOverride?: string;
  modelOverride?: string;
}

export async function processChatMessage(params: ProcessChatParams) {
  const {
    userId,
    conversationId,
    content,
    providerOverride,
    apiKeyOverride,
    baseUrlOverride,
    modelOverride,
  } = params;

  // 1. Verify user ownership of conversation
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 30, // context window
      },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found or unauthorized');
  }

  // 2. Intelligent Memory Extraction & Persistence
  let savedMemoryInfo: { id: string; content: string; category: string; isUpdate: boolean } | null = null;
  const memoryCandidate = evaluateMessageForMemory(content);
  if (memoryCandidate) {
    try {
      const { memory, isUpdate } = await persistOrUpdateMemory(userId, memoryCandidate);
      savedMemoryInfo = {
        id: memory.id,
        content: memory.content,
        category: memory.category,
        isUpdate,
      };
    } catch (memErr) {
      console.warn('Memory persistence warning:', memErr);
    }
  }

  // 3. Persist the User's Message in DB
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content,
    },
  });

  // 4. Check for Task Action Tool Intent
  const toolExecutions: ToolExecutionResult[] = [];
  const taskIntent = detectTaskIntent(content);
  if (taskIntent) {
    const executed = await executeToolCall(userId, taskIntent.toolName, taskIntent.args);
    toolExecutions.push(executed);
  }

  // 5. Fetch user profile, active tasks, and relevant memories
  const [profile, relevantMemories, activeTasks] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    retrieveRelevantMemories(userId, content, 10),
    prisma.task.findMany({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    }),
  ]);

  const tasksSummary = activeTasks.map(
    (t) => `[${t.priority}] ${t.title} (Status: ${t.status}${t.dueDate ? `, Due: ${t.dueDate.toISOString().split('T')[0]}` : ''})`
  );

  // 6. Build prompt context with relevant memories, active tasks, and available tools
  const systemPrompt = buildSystemPrompt({
    profile: profile
      ? {
          name: profile.name,
          preferredName: profile.preferredName || undefined,
          timezone: profile.timezone,
          profession: profile.profession || undefined,
          communicationStyle: profile.communicationStyle || undefined,
          aiPreferences: profile.aiPreferences || undefined,
        }
      : null,
    memories: relevantMemories,
    tasksSummary,
    availableTools: TASK_TOOLS.map((t) => t.name),
  });

  // 7. Prepare message history for AI Provider
  const history: AIMessage[] = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));
  history.push({ role: 'user', content });

  // 8. If tool was executed, pass context to AI or generate transparent response
  const aiProvider = getAIProvider(providerOverride, apiKeyOverride, baseUrlOverride, modelOverride);
  let assistantText = '';

  if (toolExecutions.length > 0) {
    const exec = toolExecutions[0];
    if (exec.status === 'SUCCESS') {
      if (exec.toolName === 'create_task') {
        assistantText = `I have created the task in your database:\n\n` +
          `- **Title**: ${exec.result.task.title}\n` +
          `- **Priority**: ${exec.result.task.priority}\n` +
          `- **Status**: ${exec.result.task.status}` +
          (exec.result.task.dueDate ? `\n- **Due**: ${new Date(exec.result.task.dueDate).toLocaleDateString()}` : '');
      } else if (exec.toolName === 'complete_task') {
        assistantText = `Task marked as **COMPLETED**:\n\n- **${exec.result.task.title}** ✓`;
      } else if (exec.toolName === 'delete_task') {
        assistantText = `Task has been deleted from your database:\n\n- **${exec.result.deletedTitle}**`;
      } else if (exec.toolName === 'get_tasks') {
        if (exec.result.tasks.length === 0) {
          assistantText = "You currently have no tasks on your board. You can ask me to *'Create a task...'* at any time.";
        } else {
          assistantText = `Here are your current tasks:\n\n` +
            exec.result.tasks.map((t: any, idx: number) => `${idx + 1}. **[${t.priority}]** ${t.title} — *${t.status}*`).join('\n');
        }
      }
    } else {
      assistantText = `I attempted to execute the action **${exec.toolName}**, but encountered an error: ${exec.error}`;
    }
  } else {
    // Normal AI conversation
    const aiResponse = await aiProvider.generateResponse(history, systemPrompt);
    assistantText = aiResponse.content;
  }

  // 9. Persist Assistant Message in DB
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: assistantText,
    },
  });

  // 10. Audit log ToolCalls in DB linked to assistantMessage
  const persistedToolCalls = [];
  for (const exec of toolExecutions) {
    try {
      const tc = await prisma.toolCall.create({
        data: {
          messageId: assistantMessage.id,
          toolName: exec.toolName,
          inputArgs: JSON.stringify(exec.args),
          outputResult: JSON.stringify(exec.result),
          status: exec.status,
        },
      });
      persistedToolCalls.push({
        id: tc.id,
        toolName: tc.toolName,
        inputArgs: tc.inputArgs,
        outputResult: tc.outputResult || undefined,
        status: tc.status as 'CALLING' | 'SUCCESS' | 'FAILED',
        createdAt: tc.createdAt.toISOString(),
      });
    } catch (auditErr) {
      console.warn('Audit recording error:', auditErr);
    }
  }

  // 11. Auto-generate title if this is the first turn
  if (conversation.messages.length === 0 || conversation.title === 'New Conversation') {
    try {
      const generatedTitle = await aiProvider.generateTitle(content);
      if (generatedTitle && generatedTitle.trim()) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: generatedTitle.trim() },
        });
      }
    } catch (e) {
      console.warn('Could not auto-generate conversation title:', e);
    }
  }

  return {
    userMessage,
    assistantMessage: {
      ...assistantMessage,
      toolCalls: persistedToolCalls,
    },
    provider: aiProvider.name,
    savedMemory: savedMemoryInfo,
    toolCalls: persistedToolCalls,
  };
}
