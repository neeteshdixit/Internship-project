import React, { useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOff } from 'lucide-react';

export default function CallsPanel() {
  const { callHistory } = useChat();

  const getIcon = (call) => {
    if (call.status === 'MISSED') return <PhoneMissed size={16} color="#ef4444" />;
    if (call.status === 'REJECTED') return <PhoneOff size={16} color="#ef4444" />;
    if (call.direction === 'INCOMING') return <PhoneIncoming size={16} color="#00a884" />;
    return call.callType === 'VIDEO' ? <Video size={16} color="#00a884" /> : <Phone size={16} color="#00a884" />;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111b21', color: '#e9edef' }}>
      <div style={{ padding: '16px', backgroundColor: '#202c33', borderBottom: '1px solid #222d34', fontSize: '16px', fontWeight: 600 }}>Calls</div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {callHistory.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>
            <Phone size={40} color="#2a3942" style={{ marginBottom: '12px' }} />
            <div>No call history yet.</div>
            <div style={{ marginTop: '6px', fontSize: '12px' }}>Start a call from any chat.</div>
          </div>
        ) : callHistory.map((call, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #1e2d35' }}>
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(call.otherUser || 'U')}&background=2a3942&color=aebac1&size=44`} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>@{call.otherUser || 'Unknown'}</div>
              <div style={{ fontSize: '12px', color: call.status === 'MISSED' ? '#ef4444' : '#8696a0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {getIcon(call)}
                {call.direction === 'INCOMING' ? 'Incoming' : 'Outgoing'} {call.callType === 'VIDEO' ? 'Video' : 'Audio'} Call
                {call.duration && ` · ${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}`}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#8696a0' }}>{call.timestamp ? new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
