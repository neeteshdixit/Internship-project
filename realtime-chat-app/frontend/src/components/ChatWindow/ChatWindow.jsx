import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Lock, Search, X, ShieldCheck, AlertTriangle, EyeOff } from 'lucide-react';
import ChatHeader from '../chat/ChatHeader';
import MessageList from '../chat/MessageList';
import ChatInput from '../chat/ChatInput';

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const { selectedContact, messages, sendMessage, getChatKey, sendScreenshotAlert, screenshotAlert } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('chat_wallpaper') || 'default');
  const [isBlurred, setIsBlurred] = useState(false);
  const [localScreenshotWarning, setLocalScreenshotWarning] = useState(false);

  const messagesEndRef = useRef(null);

  // Anti-Screenshot & Screen Capture Detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Detect PrintScreen or Snipping Tool key combos
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3')) ||
        (e.ctrlKey && (e.key === 'P' || e.key === 'p'))
      ) {
        setIsBlurred(true);
        setLocalScreenshotWarning(true);
        sendScreenshotAlert();

        setTimeout(() => {
          setIsBlurred(false);
          setLocalScreenshotWarning(false);
        }, 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendScreenshotAlert]);

  useEffect(() => {
    const handleWpChange = () => setWallpaper(localStorage.getItem('chat_wallpaper') || 'default');
    window.addEventListener('wallpaper_changed', handleWpChange);
    return () => window.removeEventListener('wallpaper_changed', handleWpChange);
  }, []);

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const rawChatMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  const chatMessages = searchQuery.trim()
    ? rawChatMessages.filter((m) => (m.content || m.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : rawChatMessages;

  const handleSendMessage = (text, options) => {
    sendMessage(text, options);
    setReplyMessage(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rawChatMessages]);

  const WALLPAPER_BG = {
    default: '#0b141a',
    teal: '#0d2824',
    blue: '#0a192f',
    purple: '#1a0b2e',
    sunset: '#2d1810',
    minimal: '#161b22',
  };

  // Welcome Screen
  if (!selectedContact) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111b21',
          borderLeft: '1px solid #222d34',
          textAlign: 'center',
          padding: '30px',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: '#202c33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <ShieldCheck size={48} color="#00a884" />
        </div>
        <h2 style={{ color: '#e9edef', fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          Setu Connect
        </h2>
        <p style={{ color: '#8696a0', fontSize: '14px', maxWidth: '440px', lineHeight: '1.6', marginBottom: '24px' }}>
          Send and receive end-to-end encrypted messages, voice & video calls, view-once photos, and vanish mode securely.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8696a0', fontSize: '12px' }}>
          <Lock size={14} color="#00a884" /> End-to-end encrypted with AES-GCM & Anti-Screenshot Protection
        </div>
      </div>
    );
  }

  // Active Chat Screen
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: WALLPAPER_BG[wallpaper] || '#0b141a',
        position: 'relative',
        filter: isBlurred ? 'blur(16px)' : 'none',
        transition: 'filter 0.15s ease',
      }}
    >
      {/* 1. Header */}
      <ChatHeader
        activeChat={{
          name: selectedContact.customName || selectedContact.name || selectedContact.username || 'Contact',
          username: selectedContact.username || selectedContact.name,
          avatar: selectedContact.avatar || selectedContact.profilePicUrl || selectedContact.profilePictureUrl,
          isGroup: selectedContact.isGroup,
          online: selectedContact.isOnline,
          vanishMode: selectedContact.vanishMode,
        }}
        onToggleSearch={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(''); }}
        isSearchOpen={isSearchOpen}
      />

      {/* Screenshot Alert Toast Banner (Received from other user or locally detected) */}
      {(screenshotAlert || localScreenshotWarning) && (
        <div
          style={{
            backgroundColor: '#ef4444',
            color: '#fff',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
            zIndex: 99,
          }}
        >
          <AlertTriangle size={18} />
          {screenshotAlert || '⚠️ Screenshot attempt detected and blocked! The other user has been notified.'}
        </div>
      )}

      {/* 2. In-Chat Search Bar */}
      {isSearchOpen && (
        <div style={{ padding: '8px 16px', backgroundColor: '#202c33', borderBottom: '1px solid #222d34', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} color="#8696a0" />
          <input
            type="text"
            placeholder="Search in this conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#e9edef', fontSize: '13px', outline: 'none' }}
          />
          {searchQuery && (
            <span style={{ fontSize: '11px', color: '#8696a0' }}>{chatMessages.length} matches</span>
          )}
          <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. Messages List Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <MessageList
          messages={chatMessages}
          currentUser={currentUser}
          onReply={(msg) => setReplyMessage(msg)}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        replyMessage={replyMessage}
        onCancelReply={() => setReplyMessage(null)}
      />
    </div>
  );
}
