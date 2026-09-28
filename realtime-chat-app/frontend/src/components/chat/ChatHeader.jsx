import React, { useState } from 'react';
import { Phone, Video, Search, Star, Clock, EyeOff, AlertOctagon, Image, Download, Sliders, Sparkles, ArrowLeft, Lock, Pin, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';
import useIsMobile from '../../hooks/useIsMobile';
import DisappearingMessagesModal from '../modals/DisappearingMessagesModal';
import ChatLockModal from '../modals/ChatLockModal';

export default function ChatHeader({ activeChat, onToggleSearch, isSearchOpen, onBack }) {
  const isMobile = useIsMobile();
  const { toggleModal } = useUI();
  const { currentUser } = useAuth();
  const { typingUsers, onlineUsers, toggleVanishMode, triggerPanicWipe, selectedContact, updateContactAttribute, contacts } = useChat();
  const [showNukeConfirm, setShowNukeConfirm] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  const chatId = activeChat?.id || activeChat?.username || activeChat?.name;
  const lockedList = JSON.parse(localStorage.getItem('setu_locked_chats') || '[]');
  const isChatLocked = lockedList.includes(chatId);
  const disappearingHours = parseInt(localStorage.getItem(`disappearing_${chatId}`)) || 0;

  const rawName = activeChat?.username || activeChat?.name || '';
  const isOnline = activeChat?.isGroup ? false : (onlineUsers.has(rawName.toLowerCase()) || activeChat?.online || activeChat?.isOnline);
  const isTyping = rawName && typingUsers[rawName.toLowerCase()];
  const isVanish = !!activeChat?.vanishMode;

  const handleCall = (type) => {
    if (activeChat?.isGroup) {
      const myUsername = (currentUser?.username || '').toLowerCase();
      let otherParticipants = [];

      // 1. Try from selectedContact.members
      if (Array.isArray(selectedContact?.members) && selectedContact.members.length > 0) {
        otherParticipants = selectedContact.members
          .map((m) => (typeof m === 'string' ? m : (m.username || m.name)))
          .filter((u) => u && u.toLowerCase() !== myUsername);
      }

      // 2. Fallback to contacts list if not directly on selectedContact
      if (otherParticipants.length === 0 && Array.isArray(contacts)) {
        otherParticipants = contacts
          .filter((c) => !c.isGroup && (c.username || c.name))
          .map((c) => c.username || c.name)
          .filter((u) => u && u.toLowerCase() !== myUsername);
      }

      if (otherParticipants.length === 0) {
        alert('Group call: No other participants found in this group to call.');
        return;
      }

      // Initiate call to group participants
      const targetUser = otherParticipants[0];
      window.dispatchEvent(new CustomEvent('start_call', {
        detail: {
          receiver: targetUser,
          callType: type,
          groupName: activeChat?.name || 'Group Call',
          isGroup: true,
          participants: otherParticipants,
        }
      }));
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
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0 }}
          onClick={() => {
            if (activeChat?.isGroup) {
              toggleModal('groupInfo', true);
            } else {
              toggleModal('conversationControl', true);
            }
          }}
          title={activeChat?.isGroup ? 'Click for Group Info & Participants' : 'Conversation details'}
        >
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
            {isChatLocked && (
              <span style={{ fontSize: '10px', backgroundColor: 'rgba(0,168,132,0.18)', color: '#00a884', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, border: '1px solid rgba(0,168,132,0.3)' }}>
                <Lock size={11} /> Locked
              </span>
            )}
            {isVanish && (
              <span style={{ fontSize: '10px', backgroundColor: '#4f46e5', color: '#fff', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <EyeOff size={11} /> Vanish Mode ON
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: isTyping ? '#00a884' : isOnline ? '#00a884' : '#8696a0', margin: 0, fontStyle: isTyping ? 'italic' : 'normal', fontWeight: isOnline ? 500 : 400 }}>
            {isTyping ? 'typing...' : isOnline ? '● Online' : activeChat?.isGroup ? 'Click for Group info & members' : 'Offline'}
          </p>
        </div>
        </div>
      </div>

      {/* Right: Actions (horizontally scrollable on mobile) */}
      <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aebac1', overflowX: isMobile ? 'auto' : 'visible', maxWidth: isMobile ? '46%' : 'none', flexShrink: 0 }}>
        {/* WhatsApp Group Add Members Button */}
        {activeChat?.isGroup && (
          <button
            onClick={() => toggleModal('groupInfo', true)}
            title="Group Info & Add Members"
            style={{
              background: 'rgba(0,168,132,0.18)',
              border: '1px solid #00a884',
              color: '#00a884',
              cursor: 'pointer',
              padding: isMobile ? '5px 8px' : '5px 10px',
              borderRadius: '16px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <UserPlus size={15} />
            {!isMobile && <span>Add Members</span>}
          </button>
        )}
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

        {/* Disappearing Messages Toggle */}
        <button
          onClick={() => setShowDisappearingModal(true)}
          title="Disappearing Messages"
          style={{
            background: disappearingHours > 0 ? 'rgba(0,168,132,0.18)' : 'transparent',
            border: disappearingHours > 0 ? '1px solid #00a884' : '1px solid transparent',
            color: disappearingHours > 0 ? '#00a884' : '#aebac1',
            cursor: 'pointer',
            padding: isMobile ? '5px' : '7px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <Clock size={17} />
        </button>

        {/* Chat Lock Button */}
        <button
          onClick={() => {
            if (isChatLocked) {
              // Unlock chat
              const next = lockedList.filter(id => id !== chatId);
              localStorage.setItem('setu_locked_chats', JSON.stringify(next));
              window.dispatchEvent(new Event('locked_chats_updated'));
            } else {
              setShowLockModal(true);
            }
          }}
          title={isChatLocked ? 'Unlock this chat' : 'Lock this chat with PIN'}
          style={{
            background: isChatLocked ? 'rgba(0,168,132,0.2)' : 'transparent',
            border: isChatLocked ? '1px solid #00a884' : '1px solid transparent',
            color: isChatLocked ? '#00a884' : '#aebac1',
            cursor: 'pointer',
            padding: isMobile ? '5px' : '7px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <Lock size={17} />
        </button>

        {/* Pin Chat */}
        <button
          onClick={() => {
            if (activeChat) {
              updateContactAttribute(activeChat.id || activeChat.username, 'isPinned', !activeChat.isPinned);
            }
          }}
          title={activeChat?.isPinned ? 'Unpin Chat' : 'Pin Chat to Top'}
          style={{
            background: activeChat?.isPinned ? 'rgba(0,168,132,0.2)' : 'transparent',
            border: activeChat?.isPinned ? '1px solid #00a884' : 'none',
            color: activeChat?.isPinned ? '#00a884' : '#aebac1',
            cursor: 'pointer',
            padding: isMobile ? '5px' : '7px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <Pin size={17} fill={activeChat?.isPinned ? '#00a884' : 'none'} />
        </button>

        {/* Favorite/Star Chat */}
        <button
          onClick={() => {
            if (activeChat) {
              updateContactAttribute(activeChat.id || activeChat.username, 'isFavorite', !activeChat.isFavorite);
            }
          }}
          title={activeChat?.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
          style={{
            background: activeChat?.isFavorite ? 'rgba(245,158,11,0.2)' : 'transparent',
            border: activeChat?.isFavorite ? '1px solid #f59e0b' : 'none',
            color: activeChat?.isFavorite ? '#f59e0b' : '#aebac1',
            cursor: 'pointer',
            padding: isMobile ? '5px' : '7px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <Star size={17} fill={activeChat?.isFavorite ? '#f59e0b' : 'none'} />
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

      {/* Disappearing Messages Modal */}
      <DisappearingMessagesModal
        isOpen={showDisappearingModal}
        onClose={() => setShowDisappearingModal(false)}
        currentDurationHours={disappearingHours}
        onSaveDuration={(hours) => {
          localStorage.setItem(`disappearing_${chatId}`, hours);
          if (selectedContact) {
            selectedContact.disappearingDurationHours = hours;
          }
          window.dispatchEvent(new Event('disappearing_updated'));
        }}
      />

      {/* Chat Lock PIN Modal */}
      <ChatLockModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        title="Lock Conversation"
        onUnlocked={() => {
          const next = [...lockedList, chatId];
          localStorage.setItem('setu_locked_chats', JSON.stringify(next));
          window.dispatchEvent(new Event('locked_chats_updated'));
        }}
      />
    </div>
  );
}
