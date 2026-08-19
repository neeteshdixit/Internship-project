import React from 'react';
import { ShieldCheck, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, currentUser }) {
  const isMe = message.sender === 'me';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '65%',
        padding: '10px 14px',
        borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
        backgroundColor: isMe ? 'var(--chat-sender, #005c4b)' : 'var(--chat-receiver, #202c33)',
        color: 'var(--text-main, #e9edef)',
        boxShadow: '0 1px 0.5px rgba(0,0,0,0.2)',
        position: 'relative',
        wordBreak: 'break-word'
      }}>
        <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.4' }}>{message.text}</p>
        
        {/* Footer inside bubble: Time, Encryption & Read Receipt */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '4px',
          marginTop: '4px'
        }}>
          <ShieldCheck size={10} color="var(--primary, #00a884)" title="End-to-End Encrypted" />
          <span style={{ fontSize: '10px', color: 'var(--text-muted, #8696a0)' }}>
            {message.time}
          </span>
          {isMe && <CheckCheck size={14} color="#53bdeb" title="Read" />}
        </div>
      </div>
    </div>
  );
}