import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Bot, User as UserIcon, Wrench, Brain, CheckCircle2 } from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message-wrapper ${message.role}`}>
      <div className={`message-avatar ${message.role}`}>
        {isAssistant ? <Bot size={18} /> : <UserIcon size={18} />}
      </div>

      <div className="message-body">
        {/* Render Saved Memory Event */}
        {message.savedMemory && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--accent-secondary)',
              marginBottom: 4,
            }}
          >
            <Brain size={14} color="var(--accent-secondary)" />
            <span>
              <strong>{message.savedMemory.isUpdate ? 'Memory Updated' : 'Stored in Long-Term Memory'}</strong>: [{message.savedMemory.category.toUpperCase()}] "{message.savedMemory.content}"
            </span>
          </div>
        )}

        {/* Render Verified Tool Call Executions (Section 17 Action Visibility) */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
            {message.toolCalls.map((tc) => (
              <div
                key={tc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wrench size={14} color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    Action Executed: <code className="inline-code">{tc.toolName}</code>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                    {tc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`message-bubble ${message.role}`}>
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : 'code';
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline) {
                    const codeId = Math.floor(Math.random() * 10000);
                    return (
                      <div className="code-block-container">
                        <div className="code-header">
                          <span>{language}</span>
                          <button
                            className="copy-btn"
                            onClick={() => handleCopy(codeString, codeId)}
                            title="Copy Code"
                          >
                            {copiedCodeIndex === codeId ? (
                              <>
                                <Check size={13} color="#10b981" />
                                <span style={{ color: '#10b981' }}>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        <span className="message-time">{formattedTime}</span>
      </div>
    </div>
  );
};
