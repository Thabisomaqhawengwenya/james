export interface User {
  id: string;
  email: string;
  name: string;
  preferredName?: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  preferredName?: string;
  location?: string;
  timezone: string;
  profession?: string;
  interests?: string;
  preferences?: string;
  communicationStyle?: string;
  aiPreferences?: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  inputArgs: string;
  outputResult?: string;
  status: 'CALLING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface SavedMemoryMeta {
  id: string;
  content: string;
  category: string;
  isUpdate: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  isImage: boolean;
  textContent?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  toolCalls?: ToolCall[];
  savedMemory?: SavedMemoryMeta;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messages?: Message[];
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  category: string;
  content: string;
  importance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MemoryStats {
  total: number;
  byCategory: Record<string, number>;
}
