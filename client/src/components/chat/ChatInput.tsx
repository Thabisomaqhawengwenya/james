import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, X, FileText, FileCode, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Attachment } from '../../types';
import { api } from '../../services/api';

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Ask James anything, drop files/images, plan tasks, or store memories...',
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Check size limit: 15MB each
    const tooLarge = fileArray.some((f) => f.size > 15 * 1024 * 1024);
    if (tooLarge) {
      setUploadError('Some files exceed the 15MB size limit.');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await api.upload.files(fileArray);
      setAttachments((prev) => [...prev, ...res.attachments]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachments.');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if ((!trimmed && attachments.length === 0) || disabled || isUploading) return;

    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);
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

  // Clipboard paste support (for screenshots or files)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleUploadFiles(e.clipboardData.files);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !disabled && !isUploading;

  return (
    <div
      className="chat-input-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`input-box-wrapper ${isDragging ? 'drag-over' : ''}`}>
        {/* Upload error banner if any */}
        {uploadError && (
          <div className="attachment-error-banner">
            <span>{uploadError}</span>
          </div>
        )}

        {/* Attachment preview pills */}
        {(attachments.length > 0 || isUploading) && (
          <div className="attachment-previews-container">
            {attachments.map((att) => (
              <div key={att.id} className="attachment-pill">
                {att.isImage ? (
                  <div className="attachment-thumb-wrap">
                    <img src={att.url} alt={att.originalName} className="attachment-thumb" />
                  </div>
                ) : att.originalName.endsWith('.ts') || att.originalName.endsWith('.tsx') || att.originalName.endsWith('.js') || att.originalName.endsWith('.py') ? (
                  <FileCode size={14} className="attachment-pill-icon" />
                ) : (
                  <FileText size={14} className="attachment-pill-icon" />
                )}

                <div className="attachment-pill-info">
                  <span className="attachment-pill-name" title={att.originalName}>
                    {att.originalName}
                  </span>
                  <span className="attachment-pill-size">{formatFileSize(att.size)}</span>
                </div>

                <button
                  type="button"
                  className="attachment-pill-remove"
                  onClick={() => removeAttachment(att.id)}
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {isUploading && (
              <div className="attachment-pill uploading">
                <Loader2 size={13} className="spin-icon" />
                <span className="attachment-pill-name">Uploading...</span>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          onChange={(e) => {
            if (e.target.files) handleUploadFiles(e.target.files);
          }}
          accept="image/*,.txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css,.scss,.yaml,.yml,.xml,.sql,.sh,.env,.log,.pdf"
        />

        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isDragging ? 'Drop files here to attach...' : placeholder}
          disabled={disabled}
          rows={1}
        />

        <div className="input-controls">
          <div className="input-left-controls">
            <button
              type="button"
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              title="Attach files or images"
            >
              <Paperclip size={16} />
              <span className="attach-label">Attach</span>
            </button>

            <span className="input-hints">
              Press <kbd>Enter ↵</kbd> to send, <kbd>Shift + Enter</kbd> for new line
            </span>
          </div>

          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!canSend}
            title="Send Message"
          >
            {isUploading ? <Loader2 size={16} className="spin-icon" /> : <ArrowUp size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
