import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { apiFetch } from '../../lib/apiFetch';
import { Moon, Sun, Lock, Eye, Check, Palette, Laptop, HardDrive, RotateCcw } from 'lucide-react';

export default function SettingsPanel() {
  const { currentUser } = useAuth();
  const { toggleModal } = useUI();
  const [privacy, setPrivacy] = useState({
    lastSeen: 'EVERYONE',
    onlineStatus: 'EVERYONE',
    profilePhoto: 'EVERYONE',
    readReceipts: true,
  });
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('chat_wallpaper') || 'default');
  const [fontSize, setFontSize] = useState(localStorage.getItem('chat_fontsize') || 'medium');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const WALLPAPERS = [
    { id: 'default', name: 'Default Dark', color: '#0b141a' },
    { id: 'teal', name: 'Teal Forest', color: '#0d2824' },
    { id: 'blue', name: 'Deep Midnight', color: '#0a192f' },
    { id: 'purple', name: 'Velvet Purple', color: '#1a0b2e' },
    { id: 'sunset', name: 'Sunset Warmth', color: '#2d1810' },
    { id: 'minimal', name: 'Charcoal Minimal', color: '#161b22' },
  ];

  useEffect(() => {
    if (!currentUser) return;
    const fetchPrivacy = async () => {
      try {
        const data = await apiFetch(`/api/users/privacy/${currentUser.username}`);
        if (data) setPrivacy(data);
      } catch (e) {}
    };
    fetchPrivacy();
  }, [currentUser]);

  const updatePrivacy = async (key, val) => {
    const next = { ...privacy, [key]: val };
    setPrivacy(next);
    setSaving(true);
    try {
      await apiFetch(`/api/users/privacy/${currentUser.username}`, {
        method: 'PUT',
        body: JSON.stringify(next),
      });
      setSavedMsg('Privacy updated');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (e) {}
    setSaving(false);
  };

  const handleWallpaperChange = (id) => {
    setWallpaper(id);
    localStorage.setItem('chat_wallpaper', id);
    window.dispatchEvent(new Event('wallpaper_changed'));
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('chat_fontsize', size);
    window.dispatchEvent(new Event('fontsize_changed'));
  };

  const s = {
    wrap: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111b21', color: '#e9edef' },
    header: { padding: '16px', backgroundColor: '#202c33', borderBottom: '1px solid #222d34', fontSize: '16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    section: { padding: '16px', borderBottom: '1px solid #1e2d35' },
    secTitle: { fontSize: '12px', fontWeight: 700, color: '#00a884', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
    label: { fontSize: '14px', color: '#e9edef' },
    desc: { fontSize: '11px', color: '#8696a0', marginTop: '2px' },
    select: { backgroundColor: '#2a3942', color: '#e9edef', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none' },
    toggle: (active) => ({
      width: '40px', height: '22px', borderRadius: '11px', backgroundColor: active ? '#00a884' : '#2a3942',
      position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.2s',
    }),
    toggleBall: (active) => ({
      width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
      position: 'absolute', top: '3px', left: active ? '21px' : '3px', transition: 'left 0.2s',
    }),
    hubBtn: { width: '100%', padding: '12px 14px', backgroundColor: '#2a3942', borderRadius: '8px', border: 'none', color: '#e9edef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '8px' },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span>Settings & Hubs</span>
        {savedMsg && <span style={{ fontSize: '12px', color: '#00a884' }}>✓ {savedMsg}</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Management & Sync Hubs */}
        <div style={s.section}>
          <div style={s.secTitle}>Device & Storage Hubs</div>
          <button onClick={() => toggleModal('deviceSync', true)} style={s.hubBtn}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Laptop size={18} color="#00a884" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Device Sync Center</div>
                <div style={{ fontSize: '11px', color: '#8696a0' }}>Manage logged-in devices & sessions</div>
              </div>
            </div>
            <span style={{ color: '#8696a0' }}>→</span>
          </button>

          <button onClick={() => toggleModal('storageManager', true)} style={s.hubBtn}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={18} color="#53bdeb" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Chat Storage Manager</div>
                <div style={{ fontSize: '11px', color: '#8696a0' }}>Breakdown & clean storage usage</div>
              </div>
            </div>
            <span style={{ color: '#8696a0' }}>→</span>
          </button>

          <button onClick={() => toggleModal('messageRecovery', true)} style={s.hubBtn}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RotateCcw size={18} color="#f59e0b" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Message Recovery Center</div>
                <div style={{ fontSize: '11px', color: '#8696a0' }}>Restore recently deleted messages</div>
              </div>
            </div>
            <span style={{ color: '#8696a0' }}>→</span>
          </button>
        </div>

        {/* Privacy Settings */}
        <div style={s.section}>
          <div style={s.secTitle}>Privacy & Security</div>
          
          <div style={s.row}>
            <div>
              <div style={s.label}>Last Seen Visibility</div>
              <div style={s.desc}>Control who sees your last seen time</div>
            </div>
            <select style={s.select} value={privacy.lastSeen || 'EVERYONE'} onChange={(e) => updatePrivacy('lastSeen', e.target.value)}>
              <option value="EVERYONE">Everyone</option>
              <option value="CONTACTS">Contacts Only</option>
              <option value="NOBODY">Nobody</option>
            </select>
          </div>

          <div style={s.row}>
            <div>
              <div style={s.label}>Online Status Visibility</div>
              <div style={s.desc}>Show green indicator when active</div>
            </div>
            <select style={s.select} value={privacy.onlineStatus || 'EVERYONE'} onChange={(e) => updatePrivacy('onlineStatus', e.target.value)}>
              <option value="EVERYONE">Everyone</option>
              <option value="CONTACTS">Contacts Only</option>
              <option value="NOBODY">Nobody</option>
            </select>
          </div>

          <div style={s.row}>
            <div>
              <div style={s.label}>Profile Photo</div>
              <div style={s.desc}>Who can view your profile picture</div>
            </div>
            <select style={s.select} value={privacy.profilePhoto || 'EVERYONE'} onChange={(e) => updatePrivacy('profilePhoto', e.target.value)}>
              <option value="EVERYONE">Everyone</option>
              <option value="CONTACTS">Contacts Only</option>
              <option value="NOBODY">Nobody</option>
            </select>
          </div>

          <div style={s.row}>
            <div>
              <div style={s.label}>Read Receipts</div>
              <div style={s.desc}>Send blue ticks (✓✓) when messages are read</div>
            </div>
            <button style={s.toggle(privacy.readReceipts)} onClick={() => updatePrivacy('readReceipts', !privacy.readReceipts)}>
              <span style={s.toggleBall(privacy.readReceipts)} />
            </button>
          </div>
        </div>

        {/* Chat Appearance & Wallpaper */}
        <div style={s.section}>
          <div style={s.secTitle}>Chat Wallpaper</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {WALLPAPERS.map((wp) => (
              <div
                key={wp.id}
                onClick={() => handleWallpaperChange(wp.id)}
                style={{
                  height: '46px',
                  backgroundColor: wp.color,
                  borderRadius: '6px',
                  border: wallpaper === wp.id ? '2px solid #00a884' : '1px solid #2a3942',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#e9edef',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {wallpaper === wp.id && <Check size={13} color="#00a884" style={{ marginRight: '3px' }} />}
                {wp.name.split(' ')[0]}
              </div>
            ))}
          </div>

          <div style={s.secTitle}>Font Size</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                onClick={() => handleFontSizeChange(size)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: fontSize === size ? '2px solid #00a884' : '1px solid #2a3942',
                  backgroundColor: fontSize === size ? '#202c33' : 'transparent',
                  color: '#e9edef',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
