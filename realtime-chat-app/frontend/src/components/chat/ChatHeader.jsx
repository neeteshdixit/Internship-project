import React from 'react';
import { Phone, Video, ShieldCheck, MoreVertical } from 'lucide-react';

export default function ChatHeader({ activeChat }) {
  if (!activeChat) return null;

  return (
    <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
      {/* Contact Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
          {activeChat.name ? activeChat.name.charAt(0) : 'U'}
        </div>
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '600', margin: 0 }}>{activeChat.name}</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} color="var(--primary)" /> End-to-End Encrypted
          </span>
        </div>
      </div>

      {/* Action Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--text-muted)' }}>
        <Phone size={20} style={{ cursor: 'pointer' }} title="Voice Call" />
        <Video size={20} style={{ cursor: 'pointer' }} title="Video Call" />
        <MoreVertical size={20} style={{ cursor: 'pointer' }} title="More Options" />
      </div>
    </div>
  );
}