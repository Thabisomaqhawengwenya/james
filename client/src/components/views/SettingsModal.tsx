import React, { useState } from 'react';
import { X, Settings, Cpu, User as UserIcon, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { provider, setProvider, apiKey, setApiKey, baseUrl, setBaseUrl, modelName, setModelName } = useChat();
  const { profile, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'model' | 'profile'>('model');
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [modelInput, setModelInput] = useState(modelName);

  // Profile form state
  const [preferredName, setPreferredName] = useState(profile?.preferredName || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [commStyle, setCommStyle] = useState(profile?.communicationStyle || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    setProvider(selectedProvider);
    setApiKey(keyInput.trim());
    setBaseUrl(urlInput.trim());
    setModelName(modelInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        preferredName: preferredName.trim(),
        profession: profession.trim(),
        communicationStyle: commStyle.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={20} color="var(--accent-primary)" />
            <h2 className="modal-title">Settings & Configuration</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          <button
            onClick={() => setActiveTab('model')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: activeTab === 'model' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'model' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <Cpu size={15} />
            <span>AI Model Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: activeTab === 'profile' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <UserIcon size={15} />
            <span>User Persona & Style</span>
          </button>
        </div>

        {activeTab === 'model' ? (
          <form onSubmit={handleSaveModel}>
            <div className="form-group">
              <label className="form-label">AI Engine Provider</label>
              <select
                className="form-input"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="ollama">Ollama / Local / Compatible Engine</option>
                <option value="mock">James Core Local Intelligence (Offline Simulation)</option>
                <option value="gemini">Google Gemini 1.5 Flash</option>
                <option value="openai">OpenAI GPT-4o-mini</option>
              </select>
            </div>

            {selectedProvider === 'ollama' && (
              <>
                <div className="form-group">
                  <label className="form-label">Ollama Base URL (OpenAI-Compatible)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="http://localhost:11434/v1 or remote URL"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Standard Ollama v1 compatibility endpoint or hosted gateway.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Model Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="llama3, mistral, qwen2.5, etc."
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="API key (if authenticated gateway)"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedProvider === 'gemini' && (
              <div className="form-group">
                <label className="form-label">Google Gemini API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Paste your Gemini API key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                />
              </div>
            )}

            {selectedProvider === 'openai' && (
              <div className="form-group">
                <label className="form-label">OpenAI API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="sk-..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="primary-btn" style={{ marginTop: 12 }}>
              {savedSuccess ? 'Settings Saved! ✓' : 'Apply AI Configuration'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Preferred Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="What should James call you?"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Profession / Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Software Engineer, Tech Lead, Designer"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Communication Style Preference</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Concise, direct, bullet points, technical rigor"
                value={commStyle}
                onChange={(e) => setCommStyle(e.target.value)}
              />
            </div>

            <button type="submit" className="primary-btn" style={{ marginTop: 12 }}>
              {savedSuccess ? 'Profile Updated! ✓' : 'Save Profile Preferences'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
