import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2, Edit2, Check, Search } from 'lucide-react';
import { Memory } from '../../types';
import { api } from '../../services/api';
import { useChat } from '../../context/ChatContext';

interface MemoriesModalProps {
  onClose: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({ onClose }) => {
  const { refreshMemoryStats } = useChat();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // New memory form
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('preference');
  const [newImportance, setNewImportance] = useState(4);

  // In-place editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImportance, setEditImportance] = useState(3);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadMemories = async () => {
    try {
      const res = await api.memories.list(
        selectedCategory !== 'all' ? selectedCategory : undefined,
        searchTerm.trim() || undefined
      );
      setMemories(res.memories);
    } catch (err) {
      console.warn('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [selectedCategory, searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const res = await api.memories.create({
        content: newContent.trim(),
        category: newCategory,
        importance: newImportance,
      });
      setMemories([res.memory, ...memories]);
      setNewContent('');
      refreshMemoryStats();
    } catch (err: any) {
      alert(err.message || 'Failed to save memory');
    }
  };

  const handleStartEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditCategory(m.category);
    setEditImportance(m.importance);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      const res = await api.memories.update(id, {
        content: editContent.trim(),
        category: editCategory,
        importance: editImportance,
      });
      setMemories(memories.map((m) => (m.id === id ? res.memory : m)));
      setEditingId(null);
      refreshMemoryStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update memory');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.memories.delete(id);
      setMemories(memories.filter((m) => m.id !== id));
      refreshMemoryStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete memory');
    }
  };

  const categories = ['all', 'preference', 'project', 'profile', 'instruction', 'general'];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={18} color="var(--accent-secondary)" />
            </div>
            <div>
              <h2 className="modal-title">Persistent Memory System</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {memories.length} long-term knowledge facts retained for future context
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Remember a new fact or preference..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <select
            className="form-input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ width: 130 }}
          >
            <option value="preference">Preference</option>
            <option value="project">Project</option>
            <option value="profile">Profile</option>
            <option value="instruction">Instruction</option>
            <option value="general">General</option>
          </select>
          <button type="submit" className="primary-btn" style={{ width: 'auto', padding: '0 16px' }}>
            <Plus size={18} />
          </button>
        </form>

        {/* Search & Category Filter Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 32, height: 34, fontSize: '0.82rem' }}
              placeholder="Filter memories by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Memories List */}
        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading memories...</div>
          ) : memories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No memories found. Tell James in chat <code className="inline-code">"Remember that..."</code> or add one above!
            </div>
          ) : (
            memories.map((m) => {
              const isEditing = editingId === m.id;

              return (
                <div
                  key={m.id}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        {m.category}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Priority ★{m.importance} • {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {!isEditing && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="action-btn" onClick={() => handleStartEdit(m)} title="Edit memory">
                          <Edit2 size={13} />
                        </button>
                        <button className="action-btn" onClick={() => handleDelete(m.id)} title="Delete memory">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit(m.id);
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}
                    >
                      <input
                        type="text"
                        className="form-input"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            className="form-input"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            style={{ width: 130, height: 32, fontSize: '0.8rem' }}
                          >
                            <option value="preference">Preference</option>
                            <option value="project">Project</option>
                            <option value="profile">Profile</option>
                            <option value="instruction">Instruction</option>
                            <option value="general">General</option>
                          </select>
                          <select
                            className="form-input"
                            value={editImportance}
                            onChange={(e) => setEditImportance(Number(e.target.value))}
                            style={{ width: 130, height: 32, fontSize: '0.8rem' }}
                          >
                            <option value={1}>★ 1 (Low)</option>
                            <option value={2}>★ 2 (Normal)</option>
                            <option value={3}>★ 3 (Medium)</option>
                            <option value={4}>★ 4 (High)</option>
                            <option value={5}>★ 5 (Vital)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="submit"
                            disabled={savingEdit}
                            style={{
                              background: 'var(--accent-primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Check size={13} />
                            <span>{savingEdit ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{
                              background: 'var(--bg-surface)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {m.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
