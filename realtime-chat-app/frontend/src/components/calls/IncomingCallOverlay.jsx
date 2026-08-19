import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#202c33', borderRadius: '16px', padding: '32px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', width: '320px' }}>
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.caller || 'U')}&background=00a884&color=fff&size=80`}
          alt=""
          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00a884', marginBottom: '16px' }}
        />
        <h3 style={{ color: '#e9edef', fontSize: '18px', margin: '0 0 4px 0' }}>@{incomingCall.caller}</h3>
        <p style={{ color: '#00a884', fontSize: '13px', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {incomingCall.callType === 'VIDEO' ? <Video size={16} /> : <Phone size={16} />}
          Incoming {incomingCall.callType === 'VIDEO' ? 'Video' : 'Voice'} Call...
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <button onClick={rejectCall} style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }} title="Decline">
            <PhoneOff size={22} />
          </button>
          <button onClick={acceptCall} style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#00a884', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,168,132,0.4)' }} title="Accept">
            <Phone size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
