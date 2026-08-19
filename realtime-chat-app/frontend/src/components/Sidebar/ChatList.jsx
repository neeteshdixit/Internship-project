// src/components/sidebar/ChatList.jsx
import React from 'react';

export default function ChatList({ chats, activeChat, setActiveChat }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {chats.map(chat => (
        <div 
          key={chat.id} 
          onClick={() => setActiveChat(chat)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            gap: '12px', 
            cursor: 'pointer',
            backgroundColor: activeChat?.id === chat.id ? 'var(--hover-bg)' : 'transparent',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            {chat.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>{chat.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{chat.time}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {chat.lastMessage}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}