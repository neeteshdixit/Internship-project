import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CallContext = createContext(null);

export const CallProvider = ({ children, stompClientRef, currentUser, contacts, activeContactId }) => {
  const [activeCall, setActiveCall] = useState(null); // 'audio' | 'video' | null
  const [callStatus, setCallStatus] = useState('idle');
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [incomingCallSignal, setIncomingCallSignal] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState([]);

  // Refs to avoid stale closures in WebSocket callbacks
  const activeCallRef = useRef(activeCall);
  const callStatusRef = useRef(callStatus);
  const incomingCallSignalRef = useRef(incomingCallSignal);
  const callTimeoutRef = useRef(null);
  const ringingAudioRef = useRef(null);

  // WebRTC refs
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => { incomingCallSignalRef.current = incomingCallSignal; }, [incomingCallSignal]);

  // Call duration counter
  useEffect(() => {
    let interval = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [callStatus]);

  // Mic mute tracking
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micMuted;
      });
    }
  }, [micMuted]);

  const playRingtone = () => {
    try {
      if (!ringingAudioRef.current) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playRingSequence = () => {
          const now = audioCtx.currentTime;
          const createPulse = (startTime, duration) => {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc1.type = 'sine'; osc1.frequency.value = 440;
            osc2.type = 'sine'; osc2.frequency.value = 480;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.04, startTime + 0.05);
            gainNode.gain.setValueAtTime(0.04, startTime + duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            osc1.connect(gainNode); osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc1.start(startTime); osc1.stop(startTime + duration);
            osc2.start(startTime); osc2.stop(startTime + duration);
          };
          createPulse(now, 0.8);
          createPulse(now + 1.2, 0.8);
        };
        playRingSequence();
        const ringInterval = setInterval(playRingSequence, 4000);
        ringingAudioRef.current = { audioCtx, ringInterval };
      }
    } catch (e) {
      console.warn('Could not start calling ringtone sound.', e);
    }
  };

  const stopRingtone = () => {
    if (ringingAudioRef.current) {
      try {
        clearInterval(ringingAudioRef.current.ringInterval);
        ringingAudioRef.current.audioCtx.close();
      } catch (e) {}
      ringingAudioRef.current = null;
    }
  };

  const saveCallLog = async (peerName, callType, status, duration) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8081/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverUsername: peerName, callType, status, durationSeconds: duration })
      });
    } catch (e) {
      console.error('Error saving call record:', e);
    }
  };

  const fetchCallHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/calls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data);
      }
    } catch (e) {
      console.error('Error fetching call history:', e);
    }
  };

  const cleanupCall = () => {
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    setActiveCall(null);
    setCallStatus('idle');
    setIncomingCallSignal(null);
    setCallDuration(0);
    fetchCallHistory();
  };

  const startCall = async (type) => {
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;
    if (activeContact.isAi) { alert('Ollama AI Assistant does not support calling.'); return; }
    if (!activeContact.isOnline) {
      alert("This user is currently offline.\nWe'll notify them that you tried to call when they come online.");
      saveCallLog(activeContact.username || activeContact.name, type, 'missed', 0);
      return;
    }

    setActiveCall(type);
    setCallStatus('calling');
    setMicMuted(false);

    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      if (callStatusRef.current === 'calling' || callStatusRef.current === 'ringing') {
        if (stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: activeContact.username || activeContact.name, type: 'end' })
          });
        }
        saveCallLog(activeContact.username || activeContact.name, type, 'missed', 0);
        alert('No Answer');
        cleanupCall();
      }
    }, 30000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected') setCallStatus('connecting');
        else if (pc.connectionState === 'failed') { alert('Call ended due to network connection.'); cleanupCall(); }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: activeContact.username || activeContact.name, type: 'candidate', candidate: event.candidate, callType: type })
          });
        }
      };

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) remoteVideo.srcObject = event.streams[0];
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) remoteAudio.srcObject = event.streams[0];
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: activeContact.username || activeContact.name, type: 'offer', sdp: offer.sdp, callType: type })
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      alert('Microphone/Camera permissions required for calling.');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCallSignal) return;
    stopRingtone();
    setCallStatus('connecting');
    try {
      const type = incomingCallSignal.callType;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: incomingCallSignal.senderUsername, type: 'candidate', candidate: event.candidate, callType: type })
          });
        }
      };

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) remoteVideo.srcObject = event.streams[0];
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) remoteAudio.srcObject = event.streams[0];
      };

      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: incomingCallSignal.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: incomingCallSignal.senderUsername, type: 'answer', sdp: answer.sdp, callType: type })
      });
      setCallStatus('connected');
    } catch (err) {
      console.error('Failed to accept call:', err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    stopRingtone();
    if (incomingCallSignal && stompClientRef.current) {
      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: incomingCallSignal.senderUsername, type: 'reject' })
      });
      saveCallLog(incomingCallSignal.senderUsername, incomingCallSignal.callType, 'rejected', 0);
    }
    cleanupCall();
  };

  const endCall = () => {
    stopRingtone();
    const remoteUser = incomingCallSignal
      ? incomingCallSignal.senderUsername
      : (contacts.find(c => c.id === activeContactId)?.username || contacts.find(c => c.id === activeContactId)?.name || null);

    if (remoteUser && stompClientRef.current) {
      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: remoteUser, type: 'end' })
      });
      if (!incomingCallSignal) saveCallLog(remoteUser, activeCall, 'connected', callDuration);
    }
    cleanupCall();
  };

  return (
    <CallContext.Provider value={{
      activeCall, setActiveCall,
      callStatus, setCallStatus,
      micMuted, setMicMuted,
      cameraOn, setCameraOn,
      incomingCallSignal, setIncomingCallSignal,
      callDuration,
      callHistory, setCallHistory,
      activeCallRef, callStatusRef, incomingCallSignalRef, callTimeoutRef,
      peerConnectionRef, localStreamRef, remoteStreamRef,
      playRingtone, stopRingtone,
      startCall, acceptCall, rejectCall, endCall, cleanupCall,
      saveCallLog, fetchCallHistory
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};
