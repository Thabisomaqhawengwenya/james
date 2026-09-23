import React from 'react';
import { Menu, Cpu, CheckSquare, Brain, Settings } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenTasks: () => void;
  onOpenMemories: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenTasks,
  onOpenMemories,
  onOpenSettings,
}) => {
  const { activeConversation, provider, memoryCount } = useChat();

  const providerLabels: Record<string, string> = {
    mock: 'James Core (Local)',
    gemini: 'Google Gemini 1.5 Flash',
    openai: 'OpenAI GPT-4o-mini',
    anthropic: 'Claude 3.5 Sonnet',
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar} title="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <span className="header-title">
          {activeConversation?.title || 'James AI Workspace'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Model Indicator Pill */}
        <div className="model-pill" title="Active AI Model Engine">
          <div className="status-dot" />
          <Cpu size={13} />
          <span>{providerLabels[provider] || provider}</span>
        </div>

        {/* Quick Drawer Shortcuts */}
        <button className="action-btn" onClick={onOpenTasks} title="Tasks">
          <CheckSquare size={17} />
        </button>
        <button
          className="action-btn"
          onClick={onOpenMemories}
          title="Personal Memories"
          style={{ position: 'relative' }}
        >
          <Brain size={17} />
          {memoryCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -4,
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                padding: '1px 5px',
                lineHeight: 1,
              }}
            >
              {memoryCount}
            </span>
          )}
        </button>
        <button className="action-btn" onClick={onOpenSettings} title="Settings">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};
