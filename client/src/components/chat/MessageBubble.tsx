import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Bot,
  User as UserIcon,
  Wrench,
  Brain,
  CheckCircle2,
  FileText,
  FileCode,
  Download,
  ExternalLink,
} from 'lucide-react';
import { Message, Attachment } from '../../types';

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isCodeFile = (filename: string): boolean => {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.sql', '.sh', '.rs', '.go', '.c', '.cpp', '.java'];
    return codeExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  };

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
              backgroundColor: 'var(--accent-blue-surface)',
              border: '1px solid rgba(138, 180, 248, 0.3)',
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
                  <CheckCircle2 size={14} color="var(--accent-emerald)" />
                  <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {tc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render Attachments if present */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments-container">
            {message.attachments.map((att: Attachment) => {
              if (att.isImage) {
                return (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="message-attachment-image-card"
                    title={`View full image: ${att.originalName}`}
                  >
                    <img src={att.url} alt={att.originalName} className="message-attachment-img" />
                    <div className="message-attachment-overlay">
                      <span className="message-attachment-filename">{att.originalName}</span>
                      <ExternalLink size={13} />
                    </div>
                  </a>
                );
              }

              return (
                <a
                  key={att.id}
                  href={att.url}
                  download={att.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-attachment-file-card"
                  title={`Download ${att.originalName}`}
                >
                  <div className="message-attachment-file-icon">
                    {isCodeFile(att.originalName) ? (
                      <FileCode size={20} color="var(--accent-primary)" />
                    ) : (
                      <FileText size={20} color="var(--accent-secondary)" />
                    )}
                  </div>
                  <div className="message-attachment-file-meta">
                    <span className="file-card-title">{att.originalName}</span>
                    <span className="file-card-size">{formatFileSize(att.size)}</span>
                  </div>
                  <div className="message-attachment-action-icon">
                    <Download size={14} />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Message Bubble Content */}
        {message.content && (
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
        )}

        <span className="message-time">{formattedTime}</span>
      </div>
    </div>
  );
};
