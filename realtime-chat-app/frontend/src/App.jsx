import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';

import AuthContainer from './components/Auth/AuthContainer';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';

import ProfileModal from './components/modals/ProfileModal';
import GroupModal from './components/modals/GroupModal';
import ScheduledModal from './components/modals/ScheduledModal';
import StarredModal from './components/modals/StarredModal';
import VanishModeModal from './components/modals/VanishModeModal';
import MediaGalleryModal from './components/modals/MediaGalleryModal';
import ExportChatModal from './components/modals/ExportChatModal';
import ConversationControlModal from './components/modals/ConversationControlModal';
import UniversalSearchModal from './components/modals/UniversalSearchModal';
import DeviceSyncModal from './components/modals/DeviceSyncModal';
import MessageRecoveryModal from './components/modals/MessageRecoveryModal';
import StorageManagerModal from './components/modals/StorageManagerModal';
import ChatLockModal from './components/modals/ChatLockModal';
import ChatTimelineModal from './components/modals/ChatTimelineModal';

import IncomingCallOverlay from './components/calls/IncomingCallOverlay';
import ActiveCallWindow from './components/calls/ActiveCallWindow';

const MainContent = () => {
  const { isAuthenticated, loading, login, register } = useAuth();
  const { modals } = useUI();

  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const res = await login(usernameInput, passwordInput);
        if (!res.success) setErrorMsg(res.message || 'Login failed. Please check your credentials.');
      } else {
        const res = await register({
          username: usernameInput,
          email: emailInput,
          phoneNumber: phoneInput,
          password: passwordInput,
        });
        if (!res.success) setErrorMsg(res.message || 'Registration failed. Please check your inputs.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117' }}>
        <div style={{ color: '#00a884', fontSize: '18px', fontWeight: 600 }}>Loading Setu Connect...</div>
      </div>
    );
  }

  // If user is not logged in, render Auth screen
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0d1117',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: '20px',
        boxSizing: 'border-box',
      }}>
        <AuthContainer
          authMode={authMode}
          setAuthMode={setAuthMode}
          errorMsg={errorMsg}
          handleAuthSubmit={handleAuthSubmit}
          usernameInput={usernameInput}
          setUsernameInput={setUsernameInput}
          emailInput={emailInput}
          setEmailInput={setEmailInput}
          phoneInput={phoneInput}
          setPhoneInput={setPhoneInput}
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Main Dashboard layout
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#0b141a' }}>
      <Sidebar />
      <ChatWindow />

      {/* Voice & Video Call Overlays */}
      <IncomingCallOverlay />
      <ActiveCallWindow />

      {/* Dynamic Modals */}
      {modals?.profile && <ProfileModal />}
      {modals?.group && <GroupModal />}
      {modals?.scheduled && <ScheduledModal />}
      {modals?.starred && <StarredModal />}
      {modals?.vanish && <VanishModeModal />}
      {modals?.mediaGallery && <MediaGalleryModal />}
      {modals?.exportChat && <ExportChatModal />}
      {modals?.conversationControl && <ConversationControlModal />}
      {modals?.universalSearch && <UniversalSearchModal />}
      {modals?.deviceSync && <DeviceSyncModal />}
      {modals?.messageRecovery && <MessageRecoveryModal />}
      {modals?.storageManager && <StorageManagerModal />}
      {modals?.chatLock && <ChatLockModal />}
      {modals?.chatTimeline && <ChatTimelineModal />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <ChatProvider>
          <CallProvider>
            <MainContent />
          </CallProvider>
        </ChatProvider>
      </UIProvider>
    </AuthProvider>
  );
}
