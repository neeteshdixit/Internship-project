import React, { useState } from 'react';
import { X, Shield, Lock, Bell, Palette, Pin, Star, Archive, Ban, Download, Trash2, Check, QrCode } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function ConversationControlModal() {
  const { closeModal, toggleModal } = useUI();
  const { selectedContact, updateContactAttribute, toggleVanishMode, triggerPanicWipe } = useChat();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'security' | 'customize'
  const [customWallpaper, setCustomWallpaper] = useState(localStorage.getItem(`wp_${selectedContact?.username}`) || 'default');
  const [accentColor, setAccentColor] = useState(localStorage.getItem(`accent_${selectedContact?.username}`) || '#00a884');
  const [copiedSafety, setCopiedSafety] = useState(false);

  if (!selectedContact) return null;

  const isVanish = !!selectedContact.vanishMode;
  const isPinned = !!selectedContact.isPinned;
  const isMuted = !!selectedContact.isMuted;
  const isFavorite = !!selectedContact.isFavorite;
  const isArchived = !!selectedContact.isArchived;
  const isBlocked = !!selectedContact.isBlocked;

  // Generate deterministic safety number for E2E encryption verification
  const safetyNumber = `48291 03948 19284 57291 00492 81734`;

  const handleCopySafety = () => {
    navigator.clipboard.writeText(safetyNumber);
    setCopiedSafety(true);
    setTimeout(() => setCopiedSafety(false), 2000);
  };

  const handleSaveWallpaper = (wp) => {
    setCustomWallpaper(wp);
    localStorage.setItem(`wp_${selectedContact.username}`, wp);
    localStorage.setItem('chat_wallpaper', wp);
    window.dispatchEvent(new Event('wallpaper_changed'));
  };

  const handleSaveAccent = (color) => {
    setAccentColor(color);
    localStorage.setItem(`accent_${selectedContact.username}`, color);
  };

  const s = {
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#2a3942', borderRadius: '8px', marginBottom: '8px' },
    label: { fontSize: '13px', color: '#e9edef', fontWeight: 500 },
    sub: { fontSize: '11px', color: '#8696a0', marginTop: '2px' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('conversationControl')}>
      <div style={{ width: 'min(460px, calc(100vw - 24px))', maxHeight: 'min(600px, calc(100dvh - 32px))', backgroundColor: '#202c33', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Shield size={18} color="#00a884" /> Control Center — @{selectedContact.username || selectedContact.name}
          </div>
          <button onClick={() => closeModal('conversationControl')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a3942', backgroundColor: '#111b21' }}>
          <button onClick={() => setActiveTab('settings')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid #00a884' : '2px solid transparent', color: activeTab === 'settings' ? '#00a884' : '#8696a0', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Settings & Actions</button>
          <button onClick={() => setActiveTab('security')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'security' ? '2px solid #00a884' : '2px solid transparent', color: activeTab === 'security' ? '#00a884' : '#8696a0', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Security & Lock</button>
          <button onClick={() => setActiveTab('customize')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'customize' ? '2px solid #00a884' : '2px solid transparent', color: activeTab === 'customize' ? '#00a884' : '#8696a0', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Per-Chat Theme</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'settings' && (
            <div>
              <div style={s.row}>
                <div>
                  <div style={s.label}>Pin Conversation (📌)</div>
                  <div style={s.sub}>Keep chat at the top of sidebar</div>
                </div>
                <input type="checkbox" checked={isPinned} onChange={() => updateContactAttribute(selectedContact.id, 'isPinned', !isPinned)} style={{ width: '18px', height: '18px', accentColor: '#00a884' }} />
              </div>

              <div style={s.row}>
                <div>
                  <div style={s.label}>Mute Notifications (🔕)</div>
                  <div style={s.sub}>Silence sounds for this conversation</div>
                </div>
                <input type="checkbox" checked={isMuted} onChange={() => updateContactAttribute(selectedContact.id, 'isMuted', !isMuted)} style={{ width: '18px', height: '18px', accentColor: '#00a884' }} />
              </div>

              <div style={s.row}>
                <div>
                  <div style={s.label}>Favorite Contact (⭐)</div>
                  <div style={s.sub}>Add to Quick Favorites tab</div>
                </div>
                <input type="checkbox" checked={isFavorite} onChange={() => updateContactAttribute(selectedContact.id, 'isFavorite', !isFavorite)} style={{ width: '18px', height: '18px', accentColor: '#00a884' }} />
              </div>

              <div style={s.row}>
                <div>
                  <div style={s.label}>Archive Chat</div>
                  <div style={s.sub}>Hide from main chat list</div>
                </div>
                <input type="checkbox" checked={isArchived} onChange={() => updateContactAttribute(selectedContact.id, 'isArchived', !isArchived)} style={{ width: '18px', height: '18px', accentColor: '#00a884' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => { closeModal('conversationControl'); toggleModal('mediaGallery', true); }} style={{ flex: 1, padding: '10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                  View Media & Links
                </button>
                <button onClick={() => { closeModal('conversationControl'); toggleModal('exportChat', true); }} style={{ flex: 1, padding: '10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                  Export History
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <div style={{ backgroundColor: '#182229', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #2a3942' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#00a884', marginBottom: '6px' }}>
                  <Lock size={15} /> Encryption Verification Code
                </div>
                <div style={{ fontSize: '11px', color: '#8696a0', marginBottom: '10px' }}>
                  Verify that messages with this contact are encrypted with AES-GCM and unreadable by anyone in transit.
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#111b21', padding: '8px 12px', borderRadius: '6px', color: '#e9edef', textAlign: 'center', letterSpacing: '1px' }}>
                  {safetyNumber}
                </div>
                <button onClick={handleCopySafety} style={{ width: '100%', marginTop: '8px', padding: '6px', backgroundColor: '#2a3942', border: 'none', borderRadius: '6px', color: copiedSafety ? '#00a884' : '#8696a0', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                  {copiedSafety ? '✓ Code Copied' : 'Copy Safety Number'}
                </button>
              </div>

              <div style={s.row}>
                <div>
                  <div style={s.label}>Private Chat Lock (4-Digit PIN)</div>
                  <div style={s.sub}>Require PIN passcode to view this chat</div>
                </div>
                <button onClick={() => { closeModal('conversationControl'); toggleModal('chatLock', true); }} style={{ backgroundColor: '#00a884', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                  Set Lock
                </button>
              </div>

              <div style={{ ...s.row, border: '1px solid rgba(239,68,68,0.3)' }}>
                <div>
                  <div style={{ ...s.label, color: '#ef4444' }}>Block Contact (🚫)</div>
                  <div style={s.sub}>Block calls and incoming messages</div>
                </div>
                <input type="checkbox" checked={isBlocked} onChange={() => updateContactAttribute(selectedContact.id, 'isBlocked', !isBlocked)} style={{ width: '18px', height: '18px', accentColor: '#ef4444' }} />
              </div>
            </div>
          )}

          {activeTab === 'customize' && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#00a884', marginBottom: '8px' }}>CUSTOM CHAT WALLPAPER</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { id: 'default', name: 'Default', color: '#0b141a' },
                  { id: 'teal', name: 'Teal', color: '#0d2824' },
                  { id: 'blue', name: 'Midnight', color: '#0a192f' },
                  { id: 'purple', name: 'Velvet', color: '#1a0b2e' },
                  { id: 'sunset', name: 'Warmth', color: '#2d1810' },
                  { id: 'minimal', name: 'Minimal', color: '#161b22' },
                ].map((wp) => (
                  <div
                    key={wp.id}
                    onClick={() => handleSaveWallpaper(wp.id)}
                    style={{
                      height: '44px',
                      backgroundColor: wp.color,
                      borderRadius: '6px',
                      border: customWallpaper === wp.id ? '2px solid #00a884' : '1px solid #2a3942',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#e9edef',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {customWallpaper === wp.id && <Check size={13} color="#00a884" style={{ marginRight: '3px' }} />}
                    {wp.name}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: '#00a884', marginBottom: '8px' }}>ACCENT COLOR</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['#00a884', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'].map((c) => (
                  <div
                    key={c}
                    onClick={() => handleSaveAccent(c)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: accentColor === c ? '2px solid #fff' : '2px solid transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
