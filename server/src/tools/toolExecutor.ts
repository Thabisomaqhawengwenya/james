import { prisma } from '../db/client.js';
import {
  TASK_TOOLS,
  executeCreateTask,
  executeGetTasks,
  executeCompleteTask,
  executeUpdateTask,
  executeDeleteTask,
} from './taskTools.js';

export interface ToolExecutionResult {
  toolName: string;
  args: Record<string, any>;
  result: any;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  toolCallId?: string;
}

export async function executeToolCall(
  userId: string,
  toolName: string,
  args: Record<string, any>,
  messageId?: string
): Promise<ToolExecutionResult> {
  let result: any = null;
  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let errorMessage: string | undefined;

  try {
    switch (toolName) {
      case 'create_task':
        result = await executeCreateTask(userId, args);
        break;
      case 'get_tasks':
        result = await executeGetTasks(userId, args);
        break;
      case 'complete_task':
        result = await executeCompleteTask(userId, args);
        break;
      case 'update_task':
        result = await executeUpdateTask(userId, args);
        break;
      case 'delete_task':
        result = await executeDeleteTask(userId, args);
        break;
      default:
        throw new Error(`Unrecognized tool: ${toolName}`);
    }
  } catch (err: any) {
    status = 'FAILED';
    errorMessage = err.message || 'Tool execution failed';
    result = { error: errorMessage };
  }

  // Audit record in ToolCall database table if messageId is available
  let toolCallId: string | undefined;
  if (messageId) {
    try {
      const recorded = await prisma.toolCall.create({
        data: {
          messageId,
          toolName,
          inputArgs: JSON.stringify(args),
          outputResult: JSON.stringify(result),
          status,
        },
      });
      toolCallId = recorded.id;
    } catch (auditErr) {
      console.warn('Tool audit logging error:', auditErr);
    }
  }

  return {
    toolName,
    args,
    result,
    status,
    error: errorMessage,
    toolCallId,
  };
}

/**
 * Natural Language Task Intent Detector
 * Allows users to trigger real task database tools directly via conversation.
 */
export function detectTaskIntent(userMessage: string): { toolName: string; args: Record<string, any> } | null {
  const text = userMessage.trim();
  const lower = text.toLowerCase();

  // 1. Create task: "create a task to...", "add a task...", "new task:..."
  const createMatch = text.match(/(?:create|add|schedule|set up)(?:\s+a)?\s+task(?:\s+to|:)?\s+(.+)/i);
  if (createMatch && createMatch[1]) {
    let taskPart = createMatch[1].trim();

    // Check priority
    let priority = 'MEDIUM';
    if (lower.includes('urgent') || lower.includes('asap')) priority = 'URGENT';
    else if (lower.includes('high priority') || lower.includes('important')) priority = 'HIGH';
    else if (lower.includes('low priority')) priority = 'LOW';

    // Check due date
    let dueDate: string | undefined;
    if (lower.includes('tomorrow')) dueDate = 'tomorrow';
    else if (lower.includes('today')) dueDate = 'today';

    // Clean task title
    taskPart = taskPart
      .replace(/\s+with\s+(?:high|urgent|low|medium)\s+priority/i, '')
      .replace(/\s+for\s+(?:tomorrow|today)/i, '')
      .trim();

    return {
      toolName: 'create_task',
      args: {
        title: taskPart,
        priority,
        dueDate,
      },
    };
  }

  // 2. Complete task: "mark ... as completed", "complete task ...", "finish task ..."
  const completeMatch = text.match(/(?:mark|set)(?:\s+the)?\s+(.+?)\s+task\s+(?:as\s+)?(?:completed|done)/i) ||
                        text.match(/(?:complete|finish)(?:\s+the)?\s+task\s+(.+)/i);
  if (completeMatch && completeMatch[1]) {
    return {
      toolName: 'complete_task',
      args: {
        title: completeMatch[1].trim(),
      },
    };
  }

  // 3. Delete task: "delete the ... task", "remove task ..."
  const deleteMatch = text.match(/(?:delete|remove)(?:\s+the)?\s+(?:task\s+)?(.+?)(?:\s+task)?$/i);
  if (deleteMatch && deleteMatch[1] && (lower.includes('task') || lower.startsWith('delete '))) {
    return {
      toolName: 'delete_task',
      args: {
        title: deleteMatch[1].replace(/task/i, '').trim(),
      },
    };
  }

  // 4. View tasks: "what are my tasks", "show my tasks", "list my tasks"
  if (
    lower.includes('show my tasks') ||
    lower.includes('what are my tasks') ||
    lower.includes('list my tasks') ||
    lower.includes('what do i need to do')
  ) {
    return {
      toolName: 'get_tasks',
      args: {},
    };
  }

  return null;
}
