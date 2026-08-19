import React from 'react';
import { PhoneOutgoing, PhoneIncoming, Video, Phone } from 'lucide-react';

export default function CallsPanel() {
  const dummyCalls = [
    { id: 1, name: 'Rahul Sharma', type: 'outgoing', mode: 'video', time: 'Today, 11:30 AM', status: 'Connected' },
    { id: 2, name: 'Amit Verma', type: 'incoming', mode: 'audio', time: 'Yesterday, 4:15 PM', status: 'Missed' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--bg-darker)' }}>
      <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Call History</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dummyCalls.map(call => (
          <div key={call.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '12px', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                {call.mode === 'video' ? <Video size={20} /> : <Phone size={20} />}
              </div>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>{call.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {call.type === 'outgoing' ? <PhoneOutgoing size={12} color="var(--primary)" /> : <PhoneIncoming size={12} color="#ef4444" />}
                  <span>{call.time}</span>
                </div>
              </div>
            </div>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '8px' }}>
              <Phone size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}