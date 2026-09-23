import OpenAI from 'openai';
import { AIProvider, AIMessage, AIResponse, ToolDefinition, StreamChunkHandler } from './types.js';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName = 'gpt-4o-mini') {
    this.modelName = modelName;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error(
        'OpenAI API key is not configured. Please provide OPENAI_API_KEY in your environment or settings.'
      );
    }
    return this.client;
  }

  async generateResponse(
    messages: AIMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const openai = this.ensureClient();
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: this.modelName,
      messages: formattedMessages,
    });

    const content = response.choices[0]?.message?.content || '';
    return {
      content,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };
  }

  async streamResponse(
    messages: AIMessage[],
    systemPrompt: string,
    onChunk: StreamChunkHandler,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const openai = this.ensureClient();
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: this.modelName,
      messages: formattedMessages,
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        onChunk({ text: delta, done: false });
      }
    }

    onChunk({ done: true });
    return { content: fullText };
  }

  async generateTitle(firstUserMessage: string): Promise<string> {
    try {
      const openai = this.ensureClient();
      const response = await openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'Generate a short 3-5 word title summarizing the user message. Output ONLY the title, no quotes or markdown.',
          },
          { role: 'user', content: firstUserMessage },
        ],
        max_tokens: 20,
      });

      const title = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
      return title || firstUserMessage.slice(0, 30);
    } catch {
      return firstUserMessage.slice(0, 30);
    }
  }
}
