import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MessageBubble } from './components/chat/MessageBubble';
import { ChatInput } from './components/chat/ChatInput';
import { AuthModal } from './components/auth/AuthModal';
import { TasksModal } from './components/views/TasksModal';
import { MemoriesModal } from './components/views/MemoriesModal';
import { SettingsModal } from './components/views/SettingsModal';
import { Sparkles, Bot, AlertCircle, ArrowRight } from 'lucide-react';

function Workspace() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const {
    messages,
    isSending,
    error,
    sendMessage,
    clearError,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [memoriesModalOpen, setMemoriesModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-on-accent)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Sparkles size={24} />
        </div>
        <span>Initializing James AI Operating System...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  const quickStarters = [
    'Remember that my main language is TypeScript and I prefer concise explanations.',
    'Create a task to build out the portfolio release tomorrow.',
    'How is James architected as an agent rather than just a chatbot?',
    'What tasks do I have scheduled on my board?',
  ];

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenTasks={() => setTasksModalOpen(true)}
        onOpenMemories={() => setMemoriesModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Chat Interface */}
      <main className="main-content">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenTasks={() => setTasksModalOpen(true)}
          onOpenMemories={() => setMemoriesModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              borderBottom: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Thread */}
        <div className="chat-scroll-container">
          {messages.length === 0 ? (
            <div
              style={{
                maxWidth: 720,
                margin: 'auto',
                textAlign: 'center',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-on-accent)',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <Bot size={28} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Good day, {user?.name || 'Sir'}. I am James.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 520, lineHeight: 1.6 }}>
                Your personal AI executive partner, digital operating system, and persistent task manager.
                How can I assist you right now?
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 12,
                  width: '100%',
                  marginTop: 20,
                }}
              >
                {quickStarters.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-focus)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {/* Typing Animation */}
          {isSending && (
            <div className="message-wrapper assistant">
              <div className="message-avatar assistant">
                <Bot size={18} />
              </div>
              <div className="message-body">
                <div className="message-bubble assistant">
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </main>

      {/* Auxiliary Modals */}
      {tasksModalOpen && <TasksModal onClose={() => setTasksModalOpen(false)} />}
      {memoriesModalOpen && <MemoriesModal onClose={() => setMemoriesModalOpen(false)} />}
      {settingsModalOpen && <SettingsModal onClose={() => setSettingsModalOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Workspace />
      </ChatProvider>
    </AuthProvider>
  );
}
