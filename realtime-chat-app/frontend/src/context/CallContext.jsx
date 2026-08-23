import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { apiFetch } from '../lib/apiFetch';

const CallContext = createContext(null);

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

// Web Audio API Ringtone / Dialtone Synthesizer (No external mp3 files required)
class CallAudioTone {
  constructor() {
    this.audioCtx = null;
    this.timer = null;
  }

  _initCtx() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.audioCtx = new AudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playOutgoingDialTone() {
    this.stop();
    this._initCtx();
    if (!this.audioCtx) return;

    const playBeep = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      try {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = 440; // A4
        osc2.type = 'sine';
        osc2.frequency.value = 480; // Standard ring tone

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 1.2);
        osc2.stop(this.audioCtx.currentTime + 1.2);
      } catch (e) {}
    };

    playBeep();
    this.timer = setInterval(playBeep, 2500);
  }

  playIncomingRingtone() {
    this.stop();
    this._initCtx();
    if (!this.audioCtx) return;

    const playChime = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.value = freq;

          const start = this.audioCtx.currentTime + idx * 0.18;
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(start);
          osc.stop(start + 0.4);
        });
      } catch (e) {}
    };

    playChime();
    this.timer = setInterval(playChime, 2200);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const toneGenerator = new CallAudioTone();

export function CallProvider({ children }) {
  const { currentUser } = useAuth();
  const { sendCallSignal, registerCallSignalListener, setCallHistory, onlineUsers } = useChat();

  const [activeCall, setActiveCall] = useState(null); // { otherUser, callType, direction: 'OUTGOING'|'INCOMING', status: 'CALLING'|'RINGING'|'CONNECTED'|'ENDED', startedAt }
  const [incomingCall, setIncomingCall] = useState(null); // { caller, callType, sdp }
  const [callStatusMessage, setCallStatusMessage] = useState('');
  const [offlineNotice, setOfflineNotice] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const durationTimerRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);

  // Keep refs in sync with state for callbacks
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // Clean peer connection and local media
  const cleanupMediaAndPeer = useCallback(() => {
    toneGenerator.stop();

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      localStreamRef.current = null;
      setLocalStream(null);
    }

    remoteStreamRef.current = null;
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
  }, []);

  // Save Call Record to Backend
  const persistCallRecord = useCallback(async (otherUser, callType, status, duration) => {
    if (!otherUser) return;
    try {
      await apiFetch('/api/calls', {
        method: 'POST',
        body: JSON.stringify({
          receiverUsername: otherUser,
          callType: (callType || 'AUDIO').toLowerCase(),
          status: status.toLowerCase(),
          durationSeconds: duration || 0,
        }),
      });
    } catch (e) {
      console.warn('Failed to save call record to backend:', e);
    }
  }, []);

  // End Call Handler
  const endCall = useCallback((reason = 'COMPLETED') => {
    const currentActive = activeCallRef.current;
    const currentIncoming = incomingCallRef.current;
    const peer = currentActive?.otherUser || currentIncoming?.caller;
    const type = currentActive?.callType || currentIncoming?.callType || 'AUDIO';
    const dur = callDuration;

    // Notify peer via WebSocket
    if (peer && currentUser?.username) {
      sendCallSignal({
        senderUsername: currentUser.username,
        receiverUsername: peer,
        type: 'end',
      });
    }

    // Persist to server
    if (currentActive) {
      const normalizedStatus =
        reason === 'NO_ANSWER' ? 'MISSED' :
        reason === 'USER_ENDED' ? (currentActive.status === 'CONNECTED' ? 'COMPLETED' : 'CANCELLED') :
        reason;

      persistCallRecord(peer, type, normalizedStatus, dur);

      setCallHistory((prev) => [
        {
          otherUser: peer,
          callType: type,
          direction: currentActive.direction,
          status: normalizedStatus,
          duration: dur,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    cleanupMediaAndPeer();
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatusMessage('');
    setIsMicMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, [callDuration, currentUser, sendCallSignal, persistCallRecord, cleanupMediaAndPeer, setCallHistory]);

  // Reject Incoming Call
  const rejectCall = useCallback(() => {
    const inc = incomingCallRef.current;
    if (inc && currentUser?.username) {
      sendCallSignal({
        senderUsername: currentUser.username,
        receiverUsername: inc.caller,
        type: 'reject',
      });
      persistCallRecord(inc.caller, inc.callType, 'REJECTED', 0);
      setCallHistory((prev) => [
        {
          otherUser: inc.caller,
          callType: inc.callType,
          direction: 'INCOMING',
          status: 'REJECTED',
          duration: 0,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    cleanupMediaAndPeer();
    setIncomingCall(null);
  }, [currentUser, sendCallSignal, persistCallRecord, cleanupMediaAndPeer, setCallHistory]);

  // Create & Setup RTCPeerConnection
  const createPeerConnection = useCallback((peerUsername) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && currentUser?.username) {
        sendCallSignal({
          senderUsername: currentUser.username,
          receiverUsername: peerUsername,
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        // Connection dropped
        setCallStatusMessage('Connection lost');
      }
    };

    pcRef.current = pc;
    return pc;
  }, [currentUser, sendCallSignal]);

  // Acquire local camera/microphone
  const getMediaStream = async (callType) => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'VIDEO' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('getUserMedia failed with ideal constraints, trying fallback:', err);
      try {
        // Fallback to basic audio only
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = fallbackStream;
        setLocalStream(fallbackStream);
        return fallbackStream;
      } catch (fallbackErr) {
        console.error('All media devices unavailable:', fallbackErr);
        alert('Could not access microphone/camera. Please ensure camera/microphone permissions are granted.');
        return null;
      }
    }
  };

  // Initiate Outgoing Call (Caller)
  const initiateCall = useCallback(async (receiverUsername, callType = 'AUDIO') => {
    if (!receiverUsername || !currentUser) return;
    cleanupMediaAndPeer();

    const normalizedCallType = callType.toUpperCase();

    // Check if target user is online
    const isTargetOnline = onlineUsers && (
      onlineUsers.has(receiverUsername.toLowerCase()) ||
      onlineUsers.has(receiverUsername)
    );

    if (!isTargetOnline) {
      // Receiver is offline: show notification & persist missed/offline call record
      setOfflineNotice(`@${receiverUsername} is currently offline. We will notify them when they connect.`);

      persistCallRecord(receiverUsername, normalizedCallType, 'OFFLINE', 0);

      setCallHistory((prev) => [
        {
          otherUser: receiverUsername,
          callType: normalizedCallType,
          direction: 'OUTGOING',
          status: 'MISSED',
          duration: 0,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setOfflineNotice('');
      }, 5000);

      return;
    }

    const callObj = {
      otherUser: receiverUsername,
      callType: normalizedCallType,
      direction: 'OUTGOING',
      status: 'CALLING',
      startedAt: new Date().toISOString(),
    };
    setActiveCall(callObj);
    setCallStatusMessage(`Calling @${receiverUsername}...`);

    toneGenerator.playOutgoingDialTone();

    // 1. Get user media
    const stream = await getMediaStream(normalizedCallType);
    if (!stream) {
      cleanupMediaAndPeer();
      setActiveCall(null);
      return;
    }

    // 2. Setup PeerConnection
    const pc = createPeerConnection(receiverUsername);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // 3. Create Offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: normalizedCallType === 'VIDEO',
      });
      await pc.setLocalDescription(offer);

      // 4. Send Offer Signal via WebSocket
      sendCallSignal({
        senderUsername: currentUser.username,
        receiverUsername: receiverUsername,
        type: 'offer',
        callType: normalizedCallType,
        sdp: offer.sdp,
      });

      // 5. Timeout after 35s if no answer
      ringTimeoutRef.current = setTimeout(() => {
        setCallStatusMessage('No answer');
        setTimeout(() => endCall('NO_ANSWER'), 1500);
      }, 35000);

    } catch (err) {
      console.error('Failed to initiate WebRTC call:', err);
      cleanupMediaAndPeer();
      setActiveCall(null);
    }
  }, [currentUser, cleanupMediaAndPeer, createPeerConnection, sendCallSignal, endCall]);

  // Accept Incoming Call (Receiver)
  const acceptCall = useCallback(async () => {
    const inc = incomingCallRef.current;
    if (!inc || !currentUser) return;

    toneGenerator.stop();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    const caller = inc.caller;
    const callType = (inc.callType || 'AUDIO').toUpperCase();

    setActiveCall({
      otherUser: caller,
      callType,
      direction: 'INCOMING',
      status: 'CONNECTED',
      startedAt: new Date().toISOString(),
    });
    setIncomingCall(null);
    setCallStatusMessage('Connected');

    // 1. Get user media
    const stream = await getMediaStream(callType);

    // 2. Setup PeerConnection
    const pc = createPeerConnection(caller);
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    try {
      // 3. Set Remote Description (Offer)
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: inc.sdp }));

      // 4. Add any queued ICE candidates
      if (pendingCandidatesRef.current.length > 0) {
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        }
        pendingCandidatesRef.current = [];
      }

      // 5. Create Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 6. Send Answer Signal
      sendCallSignal({
        senderUsername: currentUser.username,
        receiverUsername: caller,
        type: 'answer',
        callType,
        sdp: answer.sdp,
      });

    } catch (err) {
      console.error('Failed to accept call:', err);
      endCall('FAILED');
    }
  }, [currentUser, createPeerConnection, sendCallSignal, endCall]);

  // Process Incoming WebSocket Call Signals
  useEffect(() => {
    if (!registerCallSignalListener || !currentUser) return;

    const handleSignal = async (signal) => {
      if (!signal || !signal.type) return;
      const sender = signal.senderUsername;
      if (!sender || sender.toLowerCase() === currentUser.username.toLowerCase()) return;

      switch (signal.type) {
        case 'offer': {
          // If already in a call, notify sender that user is busy
          if (activeCallRef.current) {
            sendCallSignal({
              senderUsername: currentUser.username,
              receiverUsername: sender,
              type: 'busy',
            });
            return;
          }

          // Incoming call prompt
          setIncomingCall({
            caller: sender,
            callType: (signal.callType || 'AUDIO').toUpperCase(),
            sdp: signal.sdp,
          });

          toneGenerator.playIncomingRingtone();

          // Auto-cancel if caller gives up or 35s timeout
          if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
          ringTimeoutRef.current = setTimeout(() => {
            toneGenerator.stop();
            setIncomingCall(null);
          }, 35000);
          break;
        }

        case 'answer': {
          toneGenerator.stop();
          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
          }

          if (pcRef.current && signal.sdp) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
              setActiveCall((prev) => prev ? { ...prev, status: 'CONNECTED' } : null);
              setCallStatusMessage('Connected');

              // Flush pending candidates
              if (pendingCandidatesRef.current.length > 0) {
                for (const candidate of pendingCandidatesRef.current) {
                  try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                  } catch (e) {}
                }
                pendingCandidatesRef.current = [];
              }
            } catch (err) {
              console.error('Failed to set remote description answer:', err);
            }
          }
          break;
        }

        case 'candidate': {
          if (signal.candidate) {
            if (pcRef.current && pcRef.current.remoteDescription) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } catch (e) {}
            } else {
              pendingCandidatesRef.current.push(signal.candidate);
            }
          }
          break;
        }

        case 'reject': {
          toneGenerator.stop();
          setCallStatusMessage('Call declined');
          setTimeout(() => {
            cleanupMediaAndPeer();
            setActiveCall(null);
            setCallStatusMessage('');
          }, 1800);
          break;
        }

        case 'busy': {
          toneGenerator.stop();
          setCallStatusMessage('User is busy on another call');
          setTimeout(() => {
            cleanupMediaAndPeer();
            setActiveCall(null);
            setCallStatusMessage('');
          }, 2000);
          break;
        }

        case 'end': {
          toneGenerator.stop();
          setCallStatusMessage('Call ended');
          setTimeout(() => {
            cleanupMediaAndPeer();
            setActiveCall(null);
            setIncomingCall(null);
            setCallStatusMessage('');
          }, 1200);
          break;
        }

        default:
          break;
      }
    };

    const unregister = registerCallSignalListener(handleSignal);
    return () => unregister();
  }, [currentUser, registerCallSignalListener, sendCallSignal, cleanupMediaAndPeer]);

  // Listen for 'start_call' global event dispatched by ChatHeader
  useEffect(() => {
    const handleStartCallEvent = (e) => {
      const { receiver, callType } = e.detail || {};
      if (!receiver) return;
      initiateCall(receiver, callType || 'AUDIO');
    };

    window.addEventListener('start_call', handleStartCallEvent);
    return () => window.removeEventListener('start_call', handleStartCallEvent);
  }, [initiateCall]);

  // Call Duration Timer
  useEffect(() => {
    if (activeCall?.status === 'CONNECTED') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (!activeCall) {
        setCallDuration(0);
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [activeCall?.status, activeCall]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    } else {
      setIsMicMuted((prev) => !prev);
    }
  }, []);

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    } else {
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callStatusMessage,
        offlineNotice,
        setOfflineNotice,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        isMicMuted,
        toggleMic,
        isCameraOff,
        toggleCamera,
        callDuration,
        localStream,
        remoteStream,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
