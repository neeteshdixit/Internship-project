import React from 'react';
import { MessageSquare, Phone, Activity, Settings, CircleDashed } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function NavRail() {
  const { activeTab, setActiveTab, openModal } = useUI();

  const navItems = [
    { id: 'chats', icon: <MessageSquare size={20} />, label: 'Chats' },
    { id: 'status', icon: <CircleDashed size={20} />, label: 'Status' },
    { id: 'calls', icon: <Phone size={20} />, label: 'Calls' },
    { id: 'analytics', icon: <Activity size={20} />, label: 'Analytics' },
  ];

  return (
    <div style={{ width: '70px', height: '100%', backgroundColor: 'var(--bg-dark)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
      {/* Top Navigation Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', marginBottom: '10px' }}>
          SC
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            style={{
              background: activeTab === item.id ? 'var(--hover-bg)' : 'transparent',
              border: 'none',
              color: activeTab === item.id ? 'var(--primary)' : 'var(--text-muted)',
              width: '45px',
              height: '45px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Bottom Settings Icon */}
      <div>
        <button
          onClick={() => setActiveTab('settings')}
          title="Settings"
          style={{
            background: activeTab === 'settings' ? 'var(--hover-bg)' : 'transparent',
            border: 'none',
            color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
            width: '45px',
            height: '45px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}