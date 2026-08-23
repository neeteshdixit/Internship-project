import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export default function ActiveCallWindow() {
  const {
    activeCall,
    callStatusMessage,
    endCall,
    isMicMuted,
    toggleMic,
    isCameraOff,
    toggleCamera,
    callDuration,
    localStream,
    remoteStream,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  // Attach remote audio/video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  if (!activeCall) return null;

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isVideo = activeCall.callType === 'VIDEO';
  const isConnected = activeCall.status === 'CONNECTED';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b141a',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Hidden audio element for voice output */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header Bar */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(11, 20, 26, 0.75)',
          backdropFilter: 'blur(10px)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
      >
        <div>
          <h3 style={{ color: '#e9edef', fontSize: '18px', margin: '0 0 2px 0', fontWeight: 600 }}>
            @{activeCall.otherUser}
          </h3>
          <span
            style={{
              color: isConnected ? '#00a884' : '#f59e0b',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {isConnected ? formatDuration(callDuration) : (callStatusMessage || 'Calling...')}
          </span>
        </div>
        <span
          style={{
            color: '#8696a0',
            fontSize: '12px',
            border: '1px solid #2a3942',
            padding: '5px 12px',
            borderRadius: '16px',
            backgroundColor: 'rgba(32, 44, 51, 0.6)',
          }}
        >
          🔒 End-to-end encrypted
        </span>
      </div>

      {/* Main Call View Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#111b21',
        }}
      >
        {isVideo ? (
          <>
            {/* Remote Video (Main background/stage) */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: '#202c33',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '4px solid #00a884',
                    boxShadow: '0 0 30px rgba(0, 168, 132, 0.3)',
                    animation: isConnected ? 'none' : 'pulse 2s infinite ease-in-out',
                  }}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeCall.otherUser || 'U')}&background=00a884&color=fff&size=120`}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <h2 style={{ color: '#e9edef', fontSize: '22px', margin: '0 0 8px 0' }}>
                  @{activeCall.otherUser}
                </h2>
                <div style={{ color: '#8696a0', fontSize: '14px' }}>
                  {isConnected ? 'Connecting video stream...' : (callStatusMessage || 'Ringing...')}
                </div>
              </div>
            )}

            {/* Local Video (Picture-in-Picture Floating Window) */}
            {localStream && !isCameraOff && (
              <div
                style={{
                  position: 'absolute',
                  right: '24px',
                  bottom: '100px',
                  width: '180px',
                  height: '240px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                  border: '2px solid rgba(255,255,255,0.15)',
                  backgroundColor: '#000',
                  zIndex: 30,
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Mirror local camera view
                  }}
                />
              </div>
            )}
          </>
        ) : (
          /* Voice Call Center UI */
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                backgroundColor: '#202c33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '4px solid #00a884',
                boxShadow: isConnected
                  ? '0 0 40px rgba(0, 168, 132, 0.4)'
                  : '0 0 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeCall.otherUser || 'U')}&background=00a884&color=fff&size=130`}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <h2 style={{ color: '#e9edef', fontSize: '24px', margin: '0 0 8px 0', fontWeight: 600 }}>
              @{activeCall.otherUser}
            </h2>
            <div style={{ color: isConnected ? '#00a884' : '#8696a0', fontSize: '15px' }}>
              {isConnected ? `In Call · ${formatDuration(callDuration)}` : (callStatusMessage || 'Calling...')}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        style={{
          padding: '24px',
          backgroundColor: 'rgba(11, 20, 26, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
      >
        {/* Toggle Microphone */}
        <button
          onClick={toggleMic}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: isMicMuted ? '#ef4444' : '#2a3942',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Toggle Camera (If video call) */}
        {isVideo && (
          <button
            onClick={toggleCamera}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: isCameraOff ? '#ef4444' : '#2a3942',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={() => endCall('USER_ENDED')}
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(239,68,68,0.5)',
            transition: 'transform 0.15s ease',
          }}
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}
