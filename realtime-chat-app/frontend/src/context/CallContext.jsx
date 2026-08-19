import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { currentUser } = useAuth();
  const { setCallHistory } = useChat();

  const [activeCall, setActiveCall] = useState(null); // { otherUser, callType, direction: 'OUTGOING'|'INCOMING', status: 'RINGING'|'CONNECTED'|'ENDED' }
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const durationTimerRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  // Listen for call trigger from ChatHeader
  useEffect(() => {
    const handleStartCall = (e) => {
      const { receiver, callType } = e.detail;
      if (!receiver) return;
      initiateCall(receiver, callType);
    };

    window.addEventListener('start_call', handleStartCall);
    return () => window.removeEventListener('start_call', handleStartCall);
  }, [currentUser]);

  // Duration Timer
  useEffect(() => {
    if (activeCall?.status === 'CONNECTED') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationTimerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(durationTimerRef.current);
  }, [activeCall?.status]);

  const initiateCall = async (receiverUsername, callType = 'AUDIO') => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'VIDEO',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() => null);
      localStreamRef.current = stream;

      const callObj = {
        otherUser: receiverUsername,
        callType,
        direction: 'OUTGOING',
        status: 'RINGING',
        startedAt: new Date().toISOString(),
      };
      setActiveCall(callObj);

      // Auto-cancel after 30 seconds if unanswered
      ringTimeoutRef.current = setTimeout(() => {
        endCall('NO_ANSWER');
      }, 30000);

      // Simulate connected after 2.5s for demo/local pair
      setTimeout(() => {
        clearTimeout(ringTimeoutRef.current);
        setActiveCall((prev) => prev ? { ...prev, status: 'CONNECTED' } : null);
      }, 2500);

    } catch (e) {
      console.error('Call media error:', e);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    clearTimeout(ringTimeoutRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'VIDEO',
      }).catch(() => null);
      localStreamRef.current = stream;

      setActiveCall({
        otherUser: incomingCall.caller,
        callType: incomingCall.callType,
        direction: 'INCOMING',
        status: 'CONNECTED',
        startedAt: new Date().toISOString(),
      });
      setIncomingCall(null);
    } catch (e) {
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      clearTimeout(ringTimeoutRef.current);
      setCallHistory((prev) => [
        { otherUser: incomingCall.caller, callType: incomingCall.callType, direction: 'INCOMING', status: 'REJECTED', timestamp: new Date().toISOString() },
        ...prev,
      ]);
      setIncomingCall(null);
    }
  };

  const endCall = (endReason = 'COMPLETED') => {
    clearTimeout(ringTimeoutRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (activeCall) {
      setCallHistory((prev) => [
        {
          otherUser: activeCall.otherUser,
          callType: activeCall.callType,
          direction: activeCall.direction,
          status: endReason === 'NO_ANSWER' ? 'MISSED' : 'COMPLETED',
          duration: callDuration,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    setActiveCall(null);
    setIncomingCall(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    } else {
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    } else {
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        isMicMuted,
        toggleMic,
        isCameraOff,
        toggleCamera,
        callDuration,
        localStream: localStreamRef.current,
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
