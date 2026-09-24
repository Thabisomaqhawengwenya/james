import React, { createContext, useContext, useState, useEffect } from 'react';
import { Conversation, Message, Attachment } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  isSending: boolean;
  error: string | null;
  searchQuery: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
  memoryCount: number;
  refreshMemoryStats: () => Promise<void>;
  setSearchQuery: (q: string) => void;
  setProvider: (p: string) => void;
  setApiKey: (k: string) => void;
  setBaseUrl: (url: string) => void;
  setModelName: (m: string) => void;
  createNewConversation: () => Promise<string | null>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryCount, setMemoryCount] = useState<number>(0);
  
  // Model settings stored locally
  const [provider, setProviderState] = useState<string>(
    localStorage.getItem('james_ai_provider') || 'ollama'
  );
  const [apiKey, setApiKeyState] = useState<string>(
    localStorage.getItem('james_api_key') || '18db265093554033a762abc6af2cd65e.W-UdIS4U-AtpIrXpKGaWPFyP'
  );
  const [baseUrl, setBaseUrlState] = useState<string>(
    localStorage.getItem('james_base_url') || 'http://localhost:11434/v1'
  );
  const [modelName, setModelNameState] = useState<string>(
    localStorage.getItem('james_model_name') || 'llama3'
  );

  const setProvider = (p: string) => {
    setProviderState(p);
    localStorage.setItem('james_ai_provider', p);
  };

  const setApiKey = (k: string) => {
    setApiKeyState(k);
    localStorage.setItem('james_api_key', k);
  };

  const setBaseUrl = (url: string) => {
    setBaseUrlState(url);
    localStorage.setItem('james_base_url', url);
  };

  const setModelName = (m: string) => {
    setModelNameState(m);
    localStorage.setItem('james_model_name', m);
  };

  const refreshMemoryStats = async () => {
    if (!isAuthenticated) return;
    try {
      const stats = await api.memories.getStats();
      setMemoryCount(stats.total);
    } catch {
      // ignore
    }
  };

  // Load conversations when user is authenticated
  const loadConversations = async (search?: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.conversations.list(search);
      setConversations(res.conversations);
      
      if (!activeConversationId && res.conversations.length > 0) {
        selectConversation(res.conversations[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations(searchQuery);
      refreshMemoryStats();
    } else {
      setConversations([]);
      setActiveConversationId(null);
      setActiveConversation(null);
      setMessages([]);
      setMemoryCount(0);
    }
  }, [isAuthenticated, searchQuery]);

  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      const res = await api.conversations.get(id);
      setActiveConversation(res.conversation);
      setMessages(res.conversation.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    }
  };

  const createNewConversation = async (): Promise<string | null> => {
    setError(null);
    try {
      const res = await api.conversations.create('New Conversation');
      const newConv = res.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveConversation(newConv);
      setMessages([]);
      return newConv.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create new conversation');
      return null;
    }
  };

  const sendMessage = async (content: string, attachments?: Attachment[]) => {
    const trimmedContent = (content || '').trim();
    if ((!trimmedContent && (!attachments || attachments.length === 0)) || isSending) return;
    setError(null);

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      targetConvId = await createNewConversation();
      if (!targetConvId) return;
    }

    // Optimistic user message in UI
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: targetConvId,
      role: 'user',
      content: trimmedContent,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setIsSending(true);

    try {
      const res = await api.chat.sendMessage({
        conversationId: targetConvId,
        content: trimmedContent,
        attachments,
        provider: provider !== 'default' ? provider : undefined,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
        model: modelName || undefined,
      });

      const assistantMsg: Message = {
        ...res.assistantMessage,
        savedMemory: res.savedMemory,
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        res.userMessage,
        assistantMsg,
      ]);

      if (res.savedMemory) {
        refreshMemoryStats();
      }

      loadConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      await api.conversations.rename(id, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
      if (activeConversation?.id === id) {
        setActiveConversation((prev) => (prev ? { ...prev, title } : null));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to rename conversation');
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.conversations.delete(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isSending,
        error,
        searchQuery,
        provider,
        apiKey,
        baseUrl,
        modelName,
        memoryCount,
        refreshMemoryStats,
        setSearchQuery,
        setProvider,
        setApiKey,
        setBaseUrl,
        setModelName,
        createNewConversation,
        selectConversation,
        sendMessage,
        renameConversation,
        deleteConversation,
        clearError: () => setError(null),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
