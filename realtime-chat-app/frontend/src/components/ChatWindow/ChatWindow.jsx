import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useUI } from '../../context/UIContext';
import { Lock, Search, X, Shield, ShieldCheck, AlertTriangle, EyeOff, ShieldAlert, Pin, Users, UserPlus } from 'lucide-react';
import ChatHeader from '../chat/ChatHeader';
import MessageList from '../chat/MessageList';
import ChatInput from '../chat/ChatInput';
import useIsMobile from '../../hooks/useIsMobile';

export default function ChatWindow() {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const { toggleModal } = useUI();
  const { selectedContact, clearSelectedContact, messages, sendMessage, getChatKey, sendScreenshotAlert, screenshotAlert, pinMessage } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('chat_wallpaper') || 'default');
  const [isBlurred, setIsBlurred] = useState(false);
  const [localScreenshotWarning, setLocalScreenshotWarning] = useState(false);

  const messagesEndRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  // Vanish Mode is active for this conversation?
  const isVanishActive = !!selectedContact?.vanishMode;

  // Keep `vanish-active` class on <body> so @media print (App.css) hides content
  useEffect(() => {
    const body = document.body;
    if (isVanishActive) body.classList.add('vanish-active');
    else {
      body.classList.remove('vanish-active');
      body.classList.remove('window-inactive');
    }
    return () => {
      body.classList.remove('vanish-active');
      body.classList.remove('window-inactive');
    };
  }, [isVanishActive]);

  // Anti-Screenshot & Screen Capture Protection — enforced ONLY when Vanish Mode is ON
  useEffect(() => {
    if (!isVanishActive) {
      setIsBlurred(false);
      setLocalScreenshotWarning(false);
      return;
    }

    const triggerScreenshotBlock = () => {
      const now = Date.now();
      // 7-second cooldown: prevent spamming or repeating popups
      if (now - lastAlertTimeRef.current < 7000) {
        return;
      }
      lastAlertTimeRef.current = now;
      setIsBlurred(true);
      setLocalScreenshotWarning(true);
      if (sendScreenshotAlert) sendScreenshotAlert();

      setTimeout(() => {
        setLocalScreenshotWarning(false);
        if (document.hasFocus()) {
          setIsBlurred(false);
        }
      }, 3500);
    };

    const handleKeyDown = (e) => {
      // Block PrintScreen, Snipping Tool, screen-record & print key combos
      if (
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'I' || e.key === 'i')) ||
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3' || e.key === '5')) ||
        (e.ctrlKey && (e.key === 'P' || e.key === 'p' || e.key === 'S' || e.key === 's')) ||
        (e.altKey && (e.key === 'PrintScreen' || e.code === 'PrintScreen'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerScreenshotBlock();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerScreenshotBlock();
      }
    };

    // Right-click / text-copy / long-press save not allowed while vanish mode is active
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();
    const handleCut = (e) => e.preventDefault();
    const handleDragStart = (e) => e.preventDefault();

    // Conceal content silently when window loses focus (e.g. Snipping tool, Alt-Tab)
    let focusTimer = null;
    const handleWindowBlur = () => {
      document.body.classList.add('window-inactive');
      setIsBlurred(true);
    };
    const handleWindowFocus = () => {
      document.body.classList.remove('window-inactive');
      clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        setIsBlurred(false);
      }, 250);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add('window-inactive');
        setIsBlurred(true);
      } else {
        document.body.classList.remove('window-inactive');
        clearTimeout(focusTimer);
        focusTimer = setTimeout(() => {
          setIsBlurred(false);
        }, 250);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('cut', handleCut, true);
    window.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('cut', handleCut, true);
      window.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVanishActive, sendScreenshotAlert]);


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
        width: isMobile ? '100%' : 'auto',
        minWidth: 0,
        backgroundColor: WALLPAPER_BG[wallpaper] || '#0b141a',
        position: 'relative',
        borderLeft: isMobile ? 'none' : '1px solid #222d34',
        userSelect: isVanishActive ? 'none' : 'auto',
        WebkitUserSelect: isVanishActive ? 'none' : 'auto',
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
        onBack={isMobile ? clearSelectedContact : null}
      />

      {/* Screenshot Alert Toast Banner (Triggered only when screenshot hotkey pressed) */}
      {(screenshotAlert || localScreenshotWarning) && (
        <div
          style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(220,38,38,0.5)',
            zIndex: 99,
          }}
        >
          <AlertTriangle size={18} />
          {screenshotAlert || '⚠️ Screenshot attempt detected! Screenshots are blocked in Vanish Mode.'}
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
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Subtle Watermark in Vanish Mode */}
        {isVanishActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              opacity: 0.035,
              userSelect: 'none',
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '5px',
              transform: 'rotate(-25deg)',
              color: '#ffffff',
              whiteSpace: 'nowrap',
            }}
          >
            SETU CONNECT • VANISH MODE • @{currentUser?.username || 'user'}
          </div>
        )}

        {/* Strict Screenshot Restriction Veil when window is blurred (Snipping tool active, Win+Shift+S, Alt-Tab) */}
        {isVanishActive && isBlurred && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0b141a',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#8696a0',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={36} color="#ef4444" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              SCREENSHOT RESTRICTED
            </span>
            <span style={{ fontSize: '13px', color: '#8696a0', maxWidth: '320px', textAlign: 'center', lineHeight: 1.4 }}>
              Can't capture screen due to security policy. Vanish Mode messages are strictly protected.
            </span>
          </div>
        )}

        {/* WhatsApp-style Pinned Message Banner */}
        {(() => {
          const pinnedMsg = Array.isArray(chatMessages) ? chatMessages.find((m) => m.isPinned) : null;
          if (!pinnedMsg) return null;
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                backgroundColor: '#1f2c34',
                borderBottom: '1px solid #2a3942',
                zIndex: 10,
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,168,132,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Pin size={15} color="#00a884" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#00a884', fontWeight: 600 }}>Pinned Message</div>
                  <div style={{ fontSize: '13px', color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pinnedMsg.viewOnce ? 'Photo (View Once)' : (pinnedMsg.content || pinnedMsg.text || 'Attachment')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => pinMessage(pinnedMsg.id, false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a3942',
                  borderRadius: '6px',
                  color: '#8696a0',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '3px 8px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8696a0';
                  e.currentTarget.style.borderColor = '#2a3942';
                }}
                title="Unpin message"
              >
                Unpin
              </button>
            </div>
          );
        })()}

        {/* WhatsApp-style Group Intro Banner & Add Participants Action */}
        {selectedContact?.isGroup && (
          <div
            style={{
              margin: '14px auto',
              maxWidth: '420px',
              backgroundColor: '#182229',
              borderRadius: '10px',
              padding: '12px 18px',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              border: '1px solid rgba(0, 168, 132, 0.25)',
              zIndex: 2,
            }}
          >
            <div style={{ color: '#00a884', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <Users size={16} /> {selectedContact?.name || 'Group Chat'}
            </div>
            <div style={{ color: '#8696a0', fontSize: '12px', lineHeight: 1.4 }}>
              Messages in this group are end-to-end encrypted. Tap below to view participants or add new members.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => toggleModal('groupInfo', true)}
                style={{
                  backgroundColor: '#00a884',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(0,168,132,0.3)',
                }}
              >
                <UserPlus size={14} /> Add Members
              </button>
              <button
                type="button"
                onClick={() => toggleModal('groupInfo', true)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#8696a0',
                  border: '1px solid #2a3942',
                  padding: '6px 12px',
                  borderRadius: '18px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Group Info
              </button>
            </div>
          </div>
        )}

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
