import React from 'react';
import { User, Shield, Bell, Moon, Sliders, Globe } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function SettingsPanel() {
  const { openModal } = useUI();

  const settingsOptions = [
    { id: 'profile', icon: <User size={20} />, title: 'Account & Profile', desc: 'Update profile info, security keys, bio', modal: 'profile' },
    { id: 'privacy', icon: <Shield size={20} />, title: 'Privacy & Encryption', desc: 'Manage E2EE keys, vanish mode settings', modal: null },
    { id: 'ai', icon: <Sliders size={20} />, title: 'AI Assistant Config', desc: 'Smart reply models, token usage', modal: 'ai' },
    { id: 'notifications', icon: <Bell size={20} />, title: 'Notifications & Sounds', desc: 'Desktop alerts, message tones', modal: null },
    { id: 'appearance', icon: <Moon size={20} />, title: 'Theme & Appearance', desc: 'Dark/Light mode, custom wallpapers', modal: null },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--bg-darker)' }}>
      <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Settings</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {settingsOptions.map(opt => (
          <div 
            key={opt.id} 
            onClick={() => opt.modal && openModal(opt.modal)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '14px', 
              padding: '14px', 
              backgroundColor: 'var(--bg-dark)', 
              borderRadius: '10px', 
              border: '1px solid var(--border-color)',
              cursor: opt.modal ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ color: 'var(--primary)' }}>
              {opt.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{opt.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{opt.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}