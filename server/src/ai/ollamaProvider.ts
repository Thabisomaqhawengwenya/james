import OpenAI from 'openai';
import { AIProvider, AIMessage, AIResponse, ToolDefinition, StreamChunkHandler } from './types.js';

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama / Local / Compatible Engine';
  private client: OpenAI;
  private modelName: string;

  constructor(
    apiKey = 'ollama',
    baseUrl = 'http://localhost:11434/v1',
    modelName = 'llama3'
  ) {
    this.modelName = modelName;
    this.client = new OpenAI({
      apiKey: apiKey || 'ollama',
      baseURL: baseUrl || 'http://localhost:11434/v1',
    });
  }

  async generateResponse(
    messages: AIMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    try {
      const response = await this.client.chat.completions.create({
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
    } catch (err: any) {
      console.error('Ollama provider invocation error:', err);
      throw new Error(`Ollama request failed: ${err.message || err}`);
    }
  }

  async streamResponse(
    messages: AIMessage[],
    systemPrompt: string,
    onChunk: StreamChunkHandler,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    try {
      const stream = await this.client.chat.completions.create({
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
    } catch (err: any) {
      console.error('Ollama stream error:', err);
      throw new Error(`Ollama stream failed: ${err.message || err}`);
    }
  }

  async generateTitle(firstUserMessage: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'Generate a short 3-5 word title summarizing the user message. Output ONLY the title, no quotes.',
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
