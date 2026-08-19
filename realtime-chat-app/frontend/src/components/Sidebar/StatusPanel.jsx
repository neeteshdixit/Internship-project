import React from 'react';
import { PlusCircle } from 'lucide-react';

export default function StatusPanel() {
  const dummyStatuses = [
    { id: 1, name: 'Rahul Sharma', time: 'Today at 9:45 AM', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    { id: 2, name: 'Priya Singh', time: 'Yesterday at 8:12 PM', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--bg-darker)' }}>
      <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Status Updates</h3>
      
      {/* My Status Add Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', cursor: 'pointer' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            Me
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--bg-dark)', borderRadius: '50%' }}>
            <PlusCircle size={18} color="var(--primary)" />
          </div>
        </div>
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '600' }}>My Status</h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click to add status update</span>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Recent Updates
      </div>

      {/* Status List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dummyStatuses.map(status => (
          <div key={status.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--hover-bg)' }}>
            <img src={status.avatar} alt={status.name} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} />
            <div>
              <h4 style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>{status.name}</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{status.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}