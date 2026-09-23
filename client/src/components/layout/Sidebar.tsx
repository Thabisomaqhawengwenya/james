import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  CheckSquare,
  Brain,
  Settings,
  Trash2,
  Edit2,
  LogOut,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTasks: () => void;
  onOpenMemories: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenTasks,
  onOpenMemories,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    searchQuery,
    setSearchQuery,
    createNewConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
  } = useChat();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-badge">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span>JAMES</span>
        </div>
        <button className="menu-toggle" onClick={onClose} style={{ display: isOpen ? 'flex' : 'none' }}>
          <X size={20} />
        </button>
      </div>

      {/* New Conversation Button */}
      <button
        className="new-chat-btn"
        onClick={() => {
          createNewConversation();
          if (window.innerWidth <= 768) onClose();
        }}
      >
        <Plus size={18} />
        <span>New Conversation</span>
      </button>

      {/* Search Conversations */}
      <div className="search-box">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  selectConversation(conv.id);
                  if (window.innerWidth <= 768) onClose();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
                  <MessageSquare size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-focus)',
                        color: 'var(--text-primary)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.85rem',
                        width: '100%',
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="conv-title">{conv.title}</span>
                  )}
                </div>

                <div className="conv-actions">
                  {isEditing ? (
                    <>
                      <button className="action-btn" onClick={(e) => handleSaveEdit(conv.id, e)} title="Save">
                        <Check size={13} color="#10b981" />
                      </button>
                      <button className="action-btn" onClick={handleCancelEdit} title="Cancel">
                        <X size={13} color="#f43f5e" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-btn"
                        onClick={(e) => handleStartEdit(conv.id, conv.title, e)}
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={(e) => handleDelete(conv.id, e)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Shortcuts */}
      <div className="sidebar-nav">
        <button className="nav-link" onClick={onOpenTasks}>
          <CheckSquare size={16} />
          <span>Tasks</span>
        </button>
        <button className="nav-link" onClick={onOpenMemories}>
          <Brain size={16} />
          <span>Memory</span>
        </button>
        <button className="nav-link" onClick={onOpenSettings}>
          <Settings size={16} />
          <span>Settings & Models</span>
        </button>
      </div>

      {/* User Bar */}
      {user && (
        <div className="user-profile-bar">
          <div className="user-info">
            <div className="user-avatar">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="user-meta">
              <span className="user-name">{user.name || 'Personal Agent User'}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button className="action-btn" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};
