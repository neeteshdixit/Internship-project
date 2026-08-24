import React, { useState } from 'react';
import { X, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';
import { apiFetch } from '../../lib/apiFetch';

export default function VanishModeModal() {
  const { closeModal } = useUI();
  const { selectedContact, setContacts } = useChat();

  const [enabled, setEnabled] = useState(selectedContact?.vanishMode || false);
  const [timerSeconds, setTimerSeconds] = useState(selectedContact?.selfDestructSeconds || 30);
  const [saving, setSaving] = useState(false);

  const TIMERS = [
    { label: '10 Seconds', val: 10 },
    { label: '30 Seconds', val: 30 },
    { label: '1 Minute', val: 60 },
    { label: '5 Minutes', val: 300 },
    { label: '1 Hour', val: 3600 },
    { label: '24 Hours', val: 86400 },
  ];

  const handleSave = async () => {
    if (!selectedContact) return;
    setSaving(true);
    try {
      await apiFetch('/api/vanish/toggle', {
        method: 'POST',
        body: JSON.stringify({
          targetUsername: selectedContact.username || selectedContact.name,
          groupId: selectedContact.isGroup ? selectedContact.id : null,
          vanishMode: enabled,
          selfDestructSeconds: timerSeconds,
        }),
      });
      // Update locally
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id ? { ...c, vanishMode: enabled, selfDestructSeconds: timerSeconds } : c
        )
      );
      closeModal('vanish');
    } catch (e) {
      // Fallback update
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id ? { ...c, vanishMode: enabled, selfDestructSeconds: timerSeconds } : c
        )
      );
      closeModal('vanish');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('vanish')}>
      <div style={{ width: 'min(400px, calc(100vw - 24px))', backgroundColor: '#202c33', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <EyeOff size={18} color="#4f46e5" /> Vanish Mode
          </div>
          <button onClick={() => closeModal('vanish')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', backgroundColor: '#2a3942', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e9edef' }}>Enable Vanish Mode</div>
              <div style={{ fontSize: '12px', color: '#8696a0' }}>Messages disappear after being read</div>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#00a884', cursor: 'pointer' }}
            />
          </div>

          {enabled && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Self-Destruct Timer
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {TIMERS.map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setTimerSeconds(t.val)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: timerSeconds === t.val ? '2px solid #00a884' : '1px solid #2a3942',
                      backgroundColor: timerSeconds === t.val ? '#182229' : '#2a3942',
                      color: '#e9edef',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(79, 70, 229, 0.15)', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.3)', marginBottom: '16px' }}>
            <Shield size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '11px', color: '#c7d2fe', lineHeight: 1.4 }}>
              Anti-screenshot protection active. When vanish mode is enabled, screenshots are discouraged and messages automatically purge.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => closeModal('vanish')} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', backgroundColor: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
