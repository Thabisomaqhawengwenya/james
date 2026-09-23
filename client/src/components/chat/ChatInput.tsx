import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Ask James anything, plan tasks, or store memories...',
}) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const handleSubmit = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="input-box-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />

        <div className="input-controls">
          <span className="input-hints">
            Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: 4 }}>Enter ↵</kbd> to send, <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: 4 }}>Shift + Enter</kbd> for new line
          </span>

          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            title="Send Message"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
