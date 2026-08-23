import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'VIDEO';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#1f2c34',
          borderRadius: '24px',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          width: '100%',
          maxWidth: '360px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Pulsing Avatar Container */}
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 20px' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              border: '2px solid #00a884',
              opacity: 0.6,
              animation: 'pulse 1.8s infinite',
            }}
          />
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.caller || 'U')}&background=00a884&color=fff&size=100`}
            alt={incomingCall.caller}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #00a884',
              display: 'block',
            }}
          />
        </div>

        <h3 style={{ color: '#e9edef', fontSize: '20px', margin: '0 0 6px 0', fontWeight: 600 }}>
          @{incomingCall.caller}
        </h3>

        <div
          style={{
            color: '#00a884',
            fontSize: '14px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 500,
          }}
        >
          {isVideo ? <Video size={18} /> : <Phone size={18} />}
          <span>Incoming {isVideo ? 'Video' : 'Voice'} Call...</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '36px' }}>
          {/* Decline Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={rejectCall}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(239, 68, 68, 0.45)',
                transition: 'transform 0.15s ease',
              }}
              title="Decline"
            >
              <PhoneOff size={24} />
            </button>
            <span style={{ color: '#8696a0', fontSize: '12px' }}>Decline</span>
          </div>

          {/* Accept Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={acceptCall}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#00a884',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(0, 168, 132, 0.45)',
                transition: 'transform 0.15s ease',
              }}
              title="Accept"
            >
              <Phone size={24} />
            </button>
            <span style={{ color: '#00a884', fontSize: '12px', fontWeight: 500 }}>Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
