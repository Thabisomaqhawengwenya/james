import { AIProvider, AIMessage, AIResponse, ToolDefinition, StreamChunkHandler } from './types.js';

export class MockProvider implements AIProvider {
  readonly id = 'mock';
  readonly name = 'James Local Intelligence (Simulation)';

  async generateResponse(
    messages: AIMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const content = this.craftMockResponse(lastMessage, systemPrompt);
    return { content };
  }

  async streamResponse(
    messages: AIMessage[],
    systemPrompt: string,
    onChunk: StreamChunkHandler,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const fullText = this.craftMockResponse(lastMessage, systemPrompt);

    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const piece = (i === 0 ? '' : ' ') + words[i];
      onChunk({ text: piece, done: false });
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    onChunk({ done: true });
    return { content: fullText };
  }

  async generateTitle(firstUserMessage: string): Promise<string> {
    const clean = firstUserMessage.trim().replace(/[#*`]/g, '');
    if (clean.length <= 30) return clean;
    const words = clean.split(/\s+/).slice(0, 5).join(' ');
    return words ? `${words}...` : 'New Conversation';
  }

  private craftMockResponse(userMessage: string, systemPrompt: string): string {
    const msg = userMessage.toLowerCase().trim();

    // Check for memory queries: "what do you remember", "what is my preference", "what do you know about me"
    if (
      msg.includes('what do you remember') ||
      msg.includes('what do you know about me') ||
      msg.includes('my preferences') ||
      msg.includes('what are my memories')
    ) {
      const memorySectionMatch = systemPrompt.match(/### Long-Term Memories & Saved Preferences about [^:]+:\n([\s\S]*?)(?=\n###|\n\n|$)/);
      if (memorySectionMatch && memorySectionMatch[1].trim()) {
        return (
          "Here is what I have stored in your **Persistent Long-Term Memory**:\n\n" +
          memorySectionMatch[1].trim() +
          "\n\nI actively reference these preferences to personalize our work across all conversations."
        );
      } else {
        return "I do not currently have any long-term memories stored about you yet. You can tell me to *'Remember that...'*, or manage your memory anytime in the **Memory** panel.";
      }
    }

    if (msg.includes('hello') || msg.includes('hi') || msg === 'hey') {
      return (
        "Hello! I am **James**, your personal AI executive assistant and digital partner. " +
        "I'm here to help you manage tasks, preserve long-term context and memory, draft code, and answer questions. " +
        "How can I assist you right now?"
      );
    }

    if (msg.includes('who are you') || msg.includes('what can you do')) {
      return (
        "I am **James** — your personal AI operating system.\n\n" +
        "### Core Capabilities:\n" +
        "- **Context-Aware Dialogue**: Natural, direct, and focused conversations.\n" +
        "- **Task Management**: Creating, organizing, tracking, and prioritizing your work.\n" +
        "- **Persistent Memory**: Retaining key facts, project preferences, and communication style.\n" +
        "- **Extensible Tool Registry**: Built on a modular architecture ready for external integrations.\n\n" +
        "*Tip: You can connect your real Google Gemini or OpenAI API keys in settings or `.env` at any time!*"
      );
    }

    if (msg.startsWith('remember ') || msg.includes('remember that') || msg.includes('keep in mind')) {
      const item = userMessage.replace(/(?:please\s+)?(?:remember(?:\s+that|:)?|keep in mind(?:\s+that)?)\s+/i, '').trim();
      return (
        `Understood. I have recorded that into your persistent memory:\n\n` +
        `> **Stored Fact**: "${item}"\n\n` +
        `I will incorporate this context in our future conversations and tasks.`
      );
    }

    // Check if user asks about a specific topic where we have a memory (e.g. "what language do i use", "what framework", "my stack")
    if (msg.includes('what language') || msg.includes('what framework') || msg.includes('my stack') || msg.includes('what do i prefer')) {
      const memorySectionMatch = systemPrompt.match(/### Long-Term Memories & Saved Preferences about [^:]+:\n([\s\S]*?)(?=\n###|\n\n|$)/);
      if (memorySectionMatch && memorySectionMatch[1].trim()) {
        return (
          `Based on your persistent preferences, I remember:\n\n` +
          memorySectionMatch[1].trim() +
          `\n\nHow would you like to apply this to our current objective?`
        );
      }
    }

    if (msg.includes('task') || msg.includes('todo') || msg.includes('portfolio')) {
      return (
        `I have noted your task request. As we expand into Phase 3 & 4, my internal task tool runner ` +
        `will directly commit this to your SQLite task database with live execution badges.\n\n` +
        `For now, I have organized the following action item for you:\n` +
        `- **Title**: ${userMessage}\n` +
        `- **Status**: TODO\n` +
        `- **Priority**: HIGH\n\n` +
        `Would you like to assign a specific deadline or add sub-tasks?`
      );
    }

    if (msg.includes('code') || msg.includes('javascript') || msg.includes('python') || msg.includes('function') || msg.includes('typescript')) {
      return (
        "Here is a clean implementation following modern best practices:\n\n" +
        "```typescript\n" +
        "// Modular helper example\n" +
        "export function executeAgentAction<T>(action: string, payload: T): { success: boolean; data: T } {\n" +
        "  console.log(`[Agent Action] Executing: ${action}`);\n" +
        "  return { success: true, data: payload };\n" +
        "}\n" +
        "```\n\n" +
        "Let me know if you need to adapt this for your specific pipeline or database schema."
      );
    }

    // Default high-competence assistant answer
    return (
      `I've analyzed your request: "${userMessage}".\n\n` +
      `Here is a concise breakdown:\n` +
      `1. **Core Context**: Your instructions have been processed with current conversational and long-term context.\n` +
      `2. **Actionable Next Steps**: You can instruct me to plan tasks, document architecture, or manage persistent notes.\n\n` +
      `Is there a specific detail you would like to drill deeper into?`
    );
  }
}
