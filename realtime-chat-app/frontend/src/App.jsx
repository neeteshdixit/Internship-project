import React, { useRef, useEffect } from 'react';
import './App.css';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { CallProvider, useCall } from './context/CallContext';

// UI Components
import Auth from './components/Auth/Auth';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Modals from './components/Modals/Modals';

// ─────────────────────────────────────────────
// INNER APP — uses all contexts via hooks
// ─────────────────────────────────────────────
function InnerApp() {
  const auth = useAuth();
  const chat = useChat();
  const call = useCall();

  // Shared ref so CallProvider can receive stompClient from ChatContext
  const callContextRef = useRef(null);
  useEffect(() => {
    callContextRef.current = {
      handleCallSignal: (signal, client, currentUser) => {
        if (signal.type === 'offer') {
          if (call.activeCallRef.current || ['ringing','calling','connecting','connected'].includes(call.callStatusRef.current)) {
            client.publish({ destination: '/app/call/signal', body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: signal.senderUsername, type: 'busy', callType: signal.callType }) });
            return;
          }
          call.setActiveCall(signal.callType);
          call.setCallStatus('ringing');
          call.setIncomingCallSignal(signal);
          call.playRingtone();
          if (call.callTimeoutRef.current) clearTimeout(call.callTimeoutRef.current);
          call.callTimeoutRef.current = setTimeout(() => {
            if (call.callStatusRef.current === 'ringing') {
              client.publish({ destination: '/app/call/signal', body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: signal.senderUsername, type: 'reject' }) });
              call.saveCallLog(signal.senderUsername, signal.callType, 'missed', 0);
              call.cleanupCall();
            }
          }, 30000);
          client.publish({ destination: '/app/call/signal', body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: signal.senderUsername, type: 'ringing', callType: signal.callType }) });
        } else if (signal.type === 'ringing') {
          call.setCallStatus('ringing');
          call.playRingtone();
        } else if (signal.type === 'answer') {
          call.stopRingtone();
          if (call.callTimeoutRef.current) { clearTimeout(call.callTimeoutRef.current); call.callTimeoutRef.current = null; }
          if (call.peerConnectionRef.current) {
            call.peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })).then(() => call.setCallStatus('connected'));
          }
        } else if (signal.type === 'candidate') {
          if (call.peerConnectionRef.current && signal.candidate) {
            call.peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(e => console.error('Error adding ICE candidate:', e));
          }
        } else if (signal.type === 'reject') {
          call.stopRingtone(); if (call.callTimeoutRef.current) { clearTimeout(call.callTimeoutRef.current); call.callTimeoutRef.current = null; }
          call.setCallStatus('ended'); call.cleanupCall(); alert('Call Declined');
        } else if (signal.type === 'busy') {
          call.stopRingtone(); if (call.callTimeoutRef.current) { clearTimeout(call.callTimeoutRef.current); call.callTimeoutRef.current = null; }
          call.setCallStatus('ended'); call.cleanupCall(); alert('User is currently on another call.');
        } else if (signal.type === 'end') {
          call.stopRingtone(); if (call.callTimeoutRef.current) { clearTimeout(call.callTimeoutRef.current); call.callTimeoutRef.current = null; }
          if (call.callStatusRef.current === 'ringing') call.saveCallLog(signal.senderUsername, signal.callType || 'audio', 'missed', 0);
          call.setCallStatus('ended'); call.cleanupCall();
        }
      },
      addCallHistoryEntry: (entry) => {
        call.setCallHistory(prev => prev.some(e => e.id === entry.id) ? prev : [entry, ...prev]);
      }
    };
  }, [call]);

  if (!auth.isAuthenticated) {
    return (
      <div className="app-container">
        <Auth
          authMode={auth.authMode} setAuthMode={auth.setAuthMode}
          errorMsg={auth.errorMsg} handleAuthSubmit={auth.handleAuthSubmit}
          usernameInput={auth.usernameInput} setUsernameInput={auth.setUsernameInput}
          emailInput={auth.emailInput} setEmailInput={auth.setEmailInput}
          phoneInput={auth.phoneInput} setPhoneInput={auth.setPhoneInput}
          profilePicInput={auth.profilePicInput} setProfilePicInput={auth.setProfilePicInput}
          passwordInput={auth.passwordInput} setPasswordInput={auth.setPasswordInput}
          isLoading={auth.isLoading}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="dashboard-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '70px 360px minmax(0, 1fr)', width: '100vw', height: '100vh' }}>
        <Sidebar />
        <ChatWindow />
        <Modals />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP — wraps everything in Context Providers
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <ChatProvider>
          <CallProvider>
            <InnerApp />
          </CallProvider>
        </ChatProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
