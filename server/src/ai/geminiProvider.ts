import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIMessage, AIResponse, ToolDefinition, StreamChunkHandler } from './types.js';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName = 'gemini-1.5-flash') {
    this.modelName = modelName;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  private ensureClient(): GoogleGenerativeAI {
    if (!this.client) {
      throw new Error(
        'Gemini API key is not configured. Please provide GEMINI_API_KEY in your environment or settings.'
      );
    }
    return this.client;
  }

  async generateResponse(
    messages: AIMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const ai = this.ensureClient();
    const model = ai.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1]?.content || '';
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return { content: text };
  }

  async streamResponse(
    messages: AIMessage[],
    systemPrompt: string,
    onChunk: StreamChunkHandler,
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const ai = this.ensureClient();
    const model = ai.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1]?.content || '';
    const chat = model.startChat({ history });
    const resultStream = await chat.sendMessageStream(lastMessage);

    let fullText = '';
    for await (const chunk of resultStream.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk({ text: chunkText, done: false });
    }

    onChunk({ done: true });
    return { content: fullText };
  }

  async generateTitle(firstUserMessage: string): Promise<string> {
    try {
      const ai = this.ensureClient();
      const model = ai.getGenerativeModel({ model: this.modelName });
      const prompt = `Generate a concise 3 to 5 word title summarizing this initial user message. Return ONLY the title, no quotes:\n\n"${firstUserMessage}"`;
      const res = await model.generateContent(prompt);
      const title = res.response.text().trim().replace(/^["']|["']$/g, '');
      return title || firstUserMessage.slice(0, 30);
    } catch {
      return firstUserMessage.slice(0, 30);
    }
  }
}
