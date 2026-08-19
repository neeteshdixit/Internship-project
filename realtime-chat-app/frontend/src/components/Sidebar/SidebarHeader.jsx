// src/components/sidebar/SidebarHeader.jsx
import React from 'react';
import { Shield, LogOut, Users, Plus } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function SidebarHeader({ currentUser, handleLogout }) {
  const { openModal } = useUI();

  return (
    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src={currentUser.profilePic} 
          alt="Profile" 
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
          onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}}
        />
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', margin: 0 }}>{currentUser.username}</h4>
          <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Shield size={10} /> Secure
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
        <button onClick={() => openModal('group')} title="New Group" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}>
          <Users size={18} />
        </button>
        <button onClick={handleLogout} title="Logout" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}