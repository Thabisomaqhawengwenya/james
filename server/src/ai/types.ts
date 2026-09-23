export type Role = 'user' | 'assistant' | 'system';

export interface AIMessage {
  role: Role;
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCallRequest[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export type StreamChunkHandler = (chunk: { text?: string; toolCall?: ToolCallRequest; done?: boolean }) => void;

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  generateResponse(
    messages: AIMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<AIResponse>;
  streamResponse(
    messages: AIMessage[],
    systemPrompt: string,
    onChunk: StreamChunkHandler,
    tools?: ToolDefinition[]
  ): Promise<AIResponse>;
  generateTitle(firstUserMessage: string): Promise<string>;
}
