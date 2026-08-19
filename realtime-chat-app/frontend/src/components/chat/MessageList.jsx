import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUser, onReply }) {
  return (
    <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {messages.map((msg, idx) => (
        <MessageBubble key={msg.id || msg._localId || idx} message={msg} currentUser={currentUser} onReply={onReply} />
      ))}
    </div>
  );
}
