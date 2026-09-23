import { User, Profile, Conversation, Message, Task, Memory, MemoryStats, SavedMemoryMeta } from '../types';

const TOKEN_KEY = 'james_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || `HTTP error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMe: () => request<{ user: User & { profile?: Profile } }>('/auth/me'),
  },

  // Conversations
  conversations: {
    list: (search?: string) =>
      request<{ conversations: Conversation[] }>(
        search ? `/conversations?search=${encodeURIComponent(search)}` : '/conversations'
      ),

    get: (id: string) => request<{ conversation: Conversation }>('/conversations/' + id),

    create: (title?: string) =>
      request<{ conversation: Conversation }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),

    rename: (id: string, title: string) =>
      request<{ conversation: Conversation }>(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/conversations/${id}`, {
        method: 'DELETE',
      }),
  },

  // Chat
  chat: {
    sendMessage: (data: {
      conversationId: string;
      content: string;
      provider?: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
    }) =>
      request<{
        userMessage: Message;
        assistantMessage: Message;
        provider: string;
        savedMemory?: SavedMemoryMeta;
      }>('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Tasks
  tasks: {
    list: (status?: string) =>
      request<{ tasks: Task[] }>(status ? `/tasks?status=${status}` : '/tasks'),

    create: (data: Partial<Task>) =>
      request<{ task: Task }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Task>) =>
      request<{ task: Task }>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/tasks/${id}`, {
        method: 'DELETE',
      }),
  },

  // Memories
  memories: {
    list: (category?: string, search?: string) => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return request<{ memories: Memory[] }>(`/memories${queryStr}`);
    },

    getStats: () => request<MemoryStats>('/memories/stats'),

    create: (data: { content: string; category?: string; importance?: number }) =>
      request<{ memory: Memory }>('/memories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Memory>) =>
      request<{ memory: Memory }>(`/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/memories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Profile
  profile: {
    get: () => request<{ profile: Profile }>('/profile'),
    update: (data: Partial<Profile>) =>
      request<{ profile: Profile }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
