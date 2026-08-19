// src/components/chat/MessageList.jsx
import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUser }) {
  return (
    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} currentUser={currentUser} />
      ))}
    </div>
  );
}