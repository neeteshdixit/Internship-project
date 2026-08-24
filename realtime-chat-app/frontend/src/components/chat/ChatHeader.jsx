import React, { useState } from 'react';
import { Phone, Video, Search, Star, Clock, EyeOff, AlertOctagon, Image, Download, Sliders, Sparkles, ArrowLeft } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';
import useIsMobile from '../../hooks/useIsMobile';

export default function ChatHeader({ activeChat, onToggleSearch, isSearchOpen, onBack }) {
  const isMobile = useIsMobile();
  const { toggleModal } = useUI();
  const { typingUsers, onlineUsers, toggleVanishMode, triggerPanicWipe, selectedContact } = useChat();
  const [showNukeConfirm, setShowNukeConfirm] = useState(false);

  const rawName = activeChat?.username || activeChat?.name || '';
  const isOnline = activeChat?.isGroup ? false : (onlineUsers.has(rawName.toLowerCase()) || activeChat?.online || activeChat?.isOnline);
  const isTyping = rawName && typingUsers[rawName.toLowerCase()];
  const isVanish = !!activeChat?.vanishMode;

  const handleCall = (type) => {
    if (activeChat?.isGroup) {
      alert('Group calls are not supported yet.');
      return;
    }
    const receiver = activeChat?.username || activeChat?.name;
    if (!receiver) return;
    window.dispatchEvent(new CustomEvent('start_call', {
      detail: {
        receiver,
        callType: type,
      }
    }));
  };

  const handleToggleVanish = () => {
    if (selectedContact) {
      toggleVanishMode(selectedContact, !isVanish);
    }
  };

  const handleNuke = async () => {
    await triggerPanicWipe();
    setShowNukeConfirm(false);
  };

  return (
    <div
      style={{
        padding: '10px 16px',
        backgroundColor: '#202c33',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #222d34',
        height: '60px',
        boxSizing: 'border-box',
        zIndex: 5,
        position: 'relative',
      }}
    >
      {/* Left: Back (mobile) + Avatar & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        {onBack && (
          <button
            onClick={onBack}
            title="Back to chats"
            style={{ background: 'transparent', border: 'none', color: '#e9edef', cursor: 'pointer', padding: '4px', marginLeft: '-6px', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0 }} onClick={() => toggleModal('conversationControl', true)}>
        <div style={{ position: 'relative' }}>
          <img
            src={activeChat?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat?.name || 'C')}&background=2a3942&color=aebac1&size=40`}
            alt={activeChat?.name}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          {isOnline && (
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#00a884', borderRadius: '50%', border: '2px solid #202c33' }} />
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e9edef', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '38vw' : '220px' }}>
              {activeChat?.name}
            </h3>
            {isVanish && (
              <span style={{ fontSize: '10px', backgroundColor: '#4f46e5', color: '#fff', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <EyeOff size={11} /> Vanish Mode ON
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: isTyping ? '#00a884' : isOnline ? '#00a884' : '#8696a0', margin: 0, fontStyle: isTyping ? 'italic' : 'normal', fontWeight: isOnline ? 500 : 400 }}>
            {isTyping ? 'typing...' : isOnline ? '● Online' : activeChat?.isGroup ? 'Group Conversation' : 'Offline'}
          </p>
        </div>
        </div>
      </div>

      {/* Right: Actions (horizontally scrollable on mobile) */}
      <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aebac1', overflowX: isMobile ? 'auto' : 'visible', maxWidth: isMobile ? '46%' : 'none', flexShrink: 0 }}>
        {/* 🥇 Conversation Control Center */}
        <button
          onClick={() => toggleModal('conversationControl', true)}
          title="Conversation Control Center"
          style={{ background: 'transparent', border: 'none', color: '#00a884', cursor: 'pointer', padding: isMobile ? '5px' : '7px', borderRadius: '50%', flexShrink: 0 }}
        >
          <Sliders size={18} />
        </button>

        {/* 8️⃣ Chat Memory Timeline */}
        <button
          onClick={() => toggleModal('chatTimeline', true)}
          title="Chat Memory Timeline"
          style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: isMobile ? '5px' : '7px', borderRadius: '50%', flexShrink: 0 }}
        >
          <Sparkles size={18} />
        </button>

        {/* Vanish Mode Quick Toggle Button */}
        <button
          onClick={handleToggleVanish}
          title={isVanish ? 'Disable Vanish Mode' : 'Enable Vanish Mode (Syncs to both)'}
          style={{
            background: isVanish ? 'rgba(79, 70, 229, 0.25)' : 'transparent',
            border: isVanish ? '1px solid #4f46e5' : '1px solid transparent',
            color: isVanish ? '#818cf8' : '#aebac1',
            cursor: 'pointer',
            padding: isMobile ? '6px' : '5px 8px',
            borderRadius: '14px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <EyeOff size={14} />
          {!isMobile && <span>{isVanish ? 'Vanish ON' : 'Vanish'}</span>}
        </button>

        {/* Media Gallery */}
        <button
          onClick={() => toggleModal('mediaGallery', true)}
          title="Media, Docs & Links Gallery"
          style={{ background: 'transparent', border: 'none', color: '#aebac1', cursor: 'pointer', padding: isMobile ? '5px' : '7px', borderRadius: '50%', flexShrink: 0 }}
        >
          <Image size={17} />
        </button>

        {/* Video Call */}
        <button
          onClick={() => handleCall('VIDEO')}
          title="Video Call"
          style={{ background: 'transparent', border: 'none', color: '#aebac1', cursor: 'pointer', padding: isMobile ? '5px' : '7px', borderRadius: '50%', flexShrink: 0 }}
        >
          <Video size={17} />
        </button>

        {/* Audio Call */}
        <button
          onClick={() => handleCall('AUDIO')}
          title="Voice Call"
          style={{ background: 'transparent', border: 'none', color: '#aebac1', cursor: 'pointer', padding: isMobile ? '5px' : '7px', borderRadius: '50%', flexShrink: 0 }}
        >
          <Phone size={17} />
        </button>

        {/* 🥈 Universal Search 2.0 */}
        <button
          onClick={() => toggleModal('universalSearch', true)}
          title="Universal Search 2.0"
          style={{ background: 'transparent', border: 'none', color: '#aebac1', cursor: 'pointer', padding: isMobile ? '5px' : '7px', borderRadius: '50%', flexShrink: 0 }}
        >
          <Search size={17} />
        </button>

        {/* Emergency Panic Wipe Button */}
        <button
          onClick={() => setShowNukeConfirm(true)}
          title="Emergency Delete All Messages (Nuke Chat)"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            cursor: 'pointer',
            padding: isMobile ? '6px' : '5px 8px',
            borderRadius: '14px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <AlertOctagon size={13} />
          {!isMobile && <span>Nuke</span>}
        </button>
      </div>

      {/* Emergency Nuke Confirmation Modal */}
      {showNukeConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#202c33', borderRadius: '12px', padding: '24px', width: 'min(360px, calc(100vw - 32px))', textAlign: 'center', border: '1px solid #ef4444', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <AlertOctagon size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: '#e9edef', fontSize: '18px', margin: '0 0 8px 0' }}>Emergency Panic Wipe</h3>
            <p style={{ color: '#8696a0', fontSize: '13px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete all chat messages? This action cannot be undone and will purge data immediately.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowNukeConfirm(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleNuke} style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Yes, Nuke All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
