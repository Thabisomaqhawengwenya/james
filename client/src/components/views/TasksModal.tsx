import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Kanban,
  List,
} from 'lucide-react';
import { Task } from '../../types';
import { api } from '../../services/api';

interface TasksModalProps {
  onClose: () => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({ onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');

  const loadTasks = async () => {
    try {
      const res = await api.tasks.list();
      setTasks(res.tasks);
    } catch (err) {
      console.warn('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await api.tasks.create({
        title: newTitle.trim(),
        priority: newPriority,
        status: 'TODO',
        dueDate: newDueDate || undefined,
      });
      setTasks([res.task, ...tasks]);
      setNewTitle('');
      setNewDueDate('');
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId: string, nextStatus: Task['status']) => {
    try {
      const res = await api.tasks.update(taskId, { status: nextStatus });
      setTasks(tasks.map((t) => (t.id === taskId ? res.task : t)));
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.tasks.delete(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'var(--accent-rose)';
      case 'HIGH': return 'var(--accent-amber)';
      case 'MEDIUM': return 'var(--accent-secondary)';
      case 'LOW':
      default: return 'var(--text-muted)';
    }
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 840, width: '92vw' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-blue-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckSquare size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 className="modal-title">Task Management System</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {todoTasks.length + inProgressTasks.length} active tasks • {completedTasks.length} completed
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                style={{
                  background: viewMode === 'board' ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'board' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                }}
              >
                <Kanban size={13} />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                }}
              >
                <List size={13} />
                <span>List</span>
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Add Task Form */}
        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Plan or create a new task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            className="form-input"
            value={newPriority}
            onChange={(e: any) => setNewPriority(e.target.value)}
            style={{ width: 110 }}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <input
            type="date"
            className="form-input"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            style={{ width: 140 }}
          />
          <button type="submit" className="primary-btn" style={{ width: 'auto', padding: '0 16px' }}>
            <Plus size={18} />
          </button>
        </form>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading tasks...</div>
        ) : viewMode === 'board' ? (
          /* Kanban Column View */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              maxHeight: 420,
              overflowY: 'auto',
            }}
          >
            {/* Column 1: TODO */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TO DO</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 10, color: 'var(--text-muted)' }}>
                  {todoTasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todoTasks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: 20 }}>No items</div>
                ) : (
                  todoTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 10,
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                        <button className="action-btn" onClick={() => handleDelete(t.id)} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: getPriorityColor(t.priority) }}>
                          {t.priority}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-secondary)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>Start</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>IN PROGRESS</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 10, color: 'var(--text-muted)' }}>
                  {inProgressTasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inProgressTasks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: 20 }}>No items</div>
                ) : (
                  inProgressTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 10,
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                        <button className="action-btn" onClick={() => handleDelete(t.id)} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: getPriorityColor(t.priority) }}>
                          {t.priority}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                          style={{
                            background: 'var(--accent-emerald)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={11} />
                          <span>Done</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: COMPLETED */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>COMPLETED</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 10, color: 'var(--text-muted)' }}>
                  {completedTasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedTasks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: 20 }}>No items</div>
                ) : (
                  completedTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 10,
                        border: '1px solid var(--border-subtle)',
                        opacity: 0.7,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{t.title}</span>
                        <button className="action-btn" onClick={() => handleDelete(t.id)} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>COMPLETED</span>
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'TODO')}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          Reopen
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <button
                    onClick={() => handleUpdateStatus(t.id, t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {t.status === 'COMPLETED' ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : (
                      <Circle size={18} color="var(--text-muted)" />
                    )}
                  </button>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none',
                      color: t.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)',
                    }}
                  >
                    {t.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: getPriorityColor(t.priority) }}>
                    {t.priority}
                  </span>
                  <button className="action-btn" onClick={() => handleDelete(t.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
