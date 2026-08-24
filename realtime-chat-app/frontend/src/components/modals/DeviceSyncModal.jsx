import React, { useState } from 'react';
import { X, Laptop, Smartphone, ShieldCheck, LogOut, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

export default function DeviceSyncModal() {
  const { closeModal } = useUI();
  const { currentUser, logout } = useAuth();
  const [loggedOutOthers, setLoggedOutOthers] = useState(false);

  const SESSIONS = [
    { id: 1, device: 'Chrome on Windows 11 (This Device)', location: 'New Delhi, India', ip: '103.21.244.12', active: 'Active Now', isCurrent: true },
    { id: 2, device: 'Setu Connect Web (PWA)', location: 'Mumbai, India', ip: '122.161.49.88', active: 'Active 2 hours ago', isCurrent: false },
    { id: 3, device: 'Mobile Safari on iPhone 15', location: 'Bengaluru, India', ip: '49.36.120.15', active: 'Active yesterday', isCurrent: false },
  ];

  const handleLogoutAllOthers = () => {
    setLoggedOutOthers(true);
    setTimeout(() => setLoggedOutOthers(false), 3000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('deviceSync')}>
      <div style={{ width: 'min(460px, calc(100vw - 24px))', backgroundColor: '#202c33', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Laptop size={18} color="#00a884" /> Device Sync Center
          </div>
          <button onClick={() => closeModal('deviceSync')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0', marginBottom: '12px', textTransform: 'uppercase' }}>
            Active Logged-In Sessions
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {SESSIONS.map((ses) => (
              <div key={ses.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: ses.isCurrent ? 'rgba(0,168,132,0.1)' : '#2a3942', borderRadius: '8px', border: ses.isCurrent ? '1px solid #00a884' : '1px solid transparent' }}>
                {ses.device.includes('iPhone') ? <Smartphone size={24} color="#00a884" /> : <Laptop size={24} color="#00a884" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e9edef' }}>
                    {ses.device} {ses.isCurrent && <span style={{ fontSize: '10px', color: '#00a884', fontWeight: 700 }}>(CURRENT)</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '2px' }}>
                    {ses.location} · {ses.ip} · <span style={{ color: ses.isCurrent ? '#00a884' : '#8696a0' }}>{ses.active}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loggedOutOthers && (
            <div style={{ color: '#00a884', fontSize: '12px', textAlign: 'center', marginBottom: '12px', fontWeight: 600 }}>
              ✓ Logged out from all other devices successfully!
            </div>
          )}

          <button
            onClick={handleLogoutAllOthers}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#ef4444',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={16} /> Log Out From All Other Devices
          </button>
        </div>
      </div>
    </div>
  );
}
