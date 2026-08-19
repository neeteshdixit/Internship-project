import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export default function ActiveCallWindow() {
  const { activeCall, endCall, isMicMuted, toggleMic, isCameraOff, toggleCamera, callDuration, localStream } = useCall();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  if (!activeCall) return null;

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isVideo = activeCall.callType === 'VIDEO';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#111b21', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div>
          <h3 style={{ color: '#e9edef', fontSize: '18px', margin: '0 0 2px 0' }}>@{activeCall.otherUser}</h3>
          <span style={{ color: activeCall.status === 'CONNECTED' ? '#00a884' : '#f59e0b', fontSize: '13px' }}>
            {activeCall.status === 'CONNECTED' ? formatDuration(callDuration) : 'Ringing...'}
          </span>
        </div>
        <span style={{ color: '#8696a0', fontSize: '12px', border: '1px solid #2a3942', padding: '4px 10px', borderRadius: '12px' }}>
          🔒 End-to-end encrypted
        </span>
      </div>

      {/* Main Video / Avatar Center Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {isVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeCall.otherUser || 'U')}&background=00a884&color=fff&size=120`}
              alt=""
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #00a884', marginBottom: '16px' }}
            />
            <h2 style={{ color: '#e9edef', fontSize: '22px', margin: '0 0 6px 0' }}>@{activeCall.otherUser}</h2>
            <div style={{ color: '#8696a0', fontSize: '14px' }}>Setu Connect Voice Call</div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div style={{ padding: '24px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <button
          onClick={toggleMic}
          style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: isMicMuted ? '#ef4444' : '#2a3942', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isMicMuted ? 'Unmute' : 'Mute'}
        >
          {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: isCameraOff ? '#ef4444' : '#2a3942', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        <button
          onClick={() => endCall('USER_ENDED')}
          style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(239,68,68,0.5)' }}
          title="End Call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
