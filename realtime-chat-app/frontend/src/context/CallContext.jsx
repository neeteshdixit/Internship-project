// src/context/CallContext.jsx
import React, { createContext, useContext, useState } from 'react';

const CallContext = createContext();

export function CallProvider({ children }) {
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' | 'video'

  const startCall = (type) => {
    setCallType(type);
    setInCall(true);
  };

  const endCall = () => {
    setInCall(false);
    setCallType(null);
  };

  return (
    <CallContext.Provider value={{ inCall, callType, startCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);