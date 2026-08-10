import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Phone, Video, Search, X, Lock, Shield,
  Star, Pin, Trash2, Share2, Reply, MoreVertical, MapPin, AlertTriangle,
  Zap, Bot, CheckCheck, Check, Clock, Smile
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useChat, isExpiredMessage, getConversationVanishConfig, buildGroupChatKey, buildDirectChatKey } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

const ChatWindow = () => {
  const { currentUser } = useAuth();
  const {
    showChatSearch, setShowChatSearch,
    chatSearchQuery, setChatSearchQuery,
    replyToMsg, setReplyToMsg,
    forwardingMsg, setForwardingMsg,
    showForwardModal, setShowForwardModal,
    showCreateGroupModal, setShowCreateGroupModal,
    showAiPanel, setShowAiPanel,
    getWallpaperBackground,
  } = useUI();
  const {
    contacts, activeContactId, setActiveContactId,
    messageClock, typingStates,
    messageInput, setMessageInput,
    disappearingModes, disappearingTimers, disappearingModeOwners,
    isScreenBlurred,
    stompClientRef, messageEndRef,
    handleSendMessage, handleMessageChange,
    handleDeleteMessage, handleToggleStarMsg, handleTogglePinMsg,
    handleReactMsg, submitForwardMessage,
    handleToggleVanishMode,
  } = useChat();
  const { startCall, activeCall } = useCall();

  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // msgId
  const [showMsgMenu, setShowMsgMenu] = useState(null); // msgId
  const fileInputRef = useRef(null);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const vanishConfig = getConversationVanishConfig(activeContact, currentUser?.username);
  const activeVanishKey = vanishConfig?.conversationKey || '';
  const isVanishActive = Boolean(activeVanishKey && disappearingModes[activeVanishKey]);
  const vanishOwner = disappearingModeOwners?.[activeVanishKey] || null;
  const isVanishOwner = !vanishOwner || (currentUser?.username && vanishOwner.toLowerCase() === currentUser.username.toLowerCase());

  const peerTyping = activeContact ? typingStates[activeContact.username || activeContact.name] : null;

  // Filter + display messages
  const activeChatMessages = (activeContact && Array.isArray(activeContact.messages))
    ? activeContact.messages.filter(m => {
        if (!m) return false;
        if (isExpiredMessage(m, messageClock)) return false;
        if (!chatSearchQuery) return true;
        const q = chatSearchQuery.toLowerCase();
        return m.text && String(m.text).toLowerCase().includes(q);
      })
    : [];

  const getStatusIcon = (msg) => {
    if (msg.sender !== 'me') return null;
    if (msg.status === 'read') return <CheckCheck size={14} style={{ color: 'var(--accent)' }} />;
    if (msg.status === 'delivered') return <CheckCheck size={14} style={{ color: 'var(--text-secondary)' }} />;
    return <Check size={14} style={{ color: 'var(--text-secondary)' }} />;
  };

  // No contact selected
  if (!activeContact) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--chat-bg)', color: 'var(--text-secondary)', gap: '16px' }}>
        <img src="/image.png" alt="logo" style={{ width: '80px', opacity: 0.3 }} />
        <p style={{ fontSize: '18px', fontWeight: 500 }}>Select a chat to start messaging</p>
        <p style={{ fontSize: '13px', maxWidth: '300px', textAlign: 'center' }}>End-to-end encrypted with Vanish Mode & AI features</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--chat-bg)', filter: isScreenBlurred ? 'blur(20px)' : 'none', transition: 'filter 0.3s' }}>

      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--sidebar-bg)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <img src={activeContact.avatar || '/image.png'} alt={activeContact.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{activeContact.name}</p>
          <p style={{ margin: 0, fontSize: '12px', color: peerTyping === 'typing' ? 'var(--accent)' : 'var(--text-secondary)' }}>
            {peerTyping === 'typing' ? 'typing...' : activeContact.isOnline ? 'Online' : activeContact.statusText}
          </p>
        </div>

        {/* Header actions */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isVanishActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(var(--accent-rgb), 0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              <Lock size={13} /> Vanish Mode
            </div>
          )}
          <button onClick={() => setShowChatSearch(s => !s)} title="Search" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px' }}>
            <Search size={18} />
          </button>
          {!activeContact.isGroup && !activeContact.isAi && !activeContact.isNotes && (
            <>
              <button onClick={() => startCall('audio')} disabled={Boolean(activeCall)} title="Audio Call" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px' }}>
                <Phone size={18} />
              </button>
              <button onClick={() => startCall('video')} disabled={Boolean(activeCall)} title="Video Call" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px' }}>
                <Video size={18} />
              </button>
            </>
          )}
          <button onClick={() => setShowAiPanel(s => !s)} title="AI Assistant" style={{ background: 'none', border: 'none', cursor: 'pointer', color: showAiPanel ? 'var(--accent)' : 'var(--text-secondary)', padding: '8px', borderRadius: '8px' }}>
            <Bot size={18} />
          </button>
          {!activeContact.isAi && !activeContact.isNotes && isVanishOwner && (
            <button onClick={() => handleToggleVanishMode(activeContact)} title={isVanishActive ? 'Disable Vanish Mode' : 'Enable Vanish Mode'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isVanishActive ? 'var(--accent)' : 'var(--text-secondary)', padding: '8px', borderRadius: '8px' }}>
              <Shield size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── SEARCH BAR ─── */}
      {showChatSearch && (
        <div style={{ padding: '8px 16px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)} placeholder="Search in chat..." autoFocus
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px' }} />
          <button onClick={() => { setShowChatSearch(false); setChatSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── MESSAGES ─── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: getWallpaperBackground() }}
        onClick={() => { setShowMsgMenu(null); setShowEmojiPicker(null); }}>

        {activeChatMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
            <p style={{ fontSize: '14px' }}>No messages yet. Say hello! 👋</p>
          </div>
        )}

        {activeChatMessages.map(msg => {
          const isMe = msg.sender === 'me';
          const isDeleted = msg.text === 'DELETED';
          const showExpiry = msg.selfDestructSeconds && msg.expiresAt;

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '2px', position: 'relative' }}>
              <div className={`message-bubble ${isMe ? 'msg-sent' : 'msg-received'}`}
                style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'var(--msg-sent-bg)' : 'var(--msg-received-bg)', color: 'var(--text-primary)', position: 'relative', cursor: 'pointer', opacity: isDeleted ? 0.5 : 1 }}
                onContextMenu={e => { e.preventDefault(); setShowMsgMenu(msg.id); }}>

                {/* Group sender name */}
                {activeContact.isGroup && !isMe && (
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>{msg.senderUsername}</p>
                )}

                {/* Reply preview */}
                {msg.parentMessageText && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '6px 8px', marginBottom: '6px', borderLeft: '3px solid var(--accent)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700 }}>{msg.parentMessageSender}</span>
                    <p style={{ margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{msg.parentMessageText}</p>
                  </div>
                )}

                {/* Message content */}
                {isDeleted ? (
                  <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '13px' }}>🚫 This message was deleted</span>
                ) : msg.isMedia ? (
                  <div>
                    {msg.mediaType === 'IMAGE' && <img src={msg.mediaUrl} alt="media" style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }} />}
                    {msg.mediaType !== 'IMAGE' && <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '13px' }}>📎 {msg.fileName}</a>}
                  </div>
                ) : msg.messageType === 'LOCATION' ? (
                  <a href={`https://maps.google.com/?q=${msg.latitude},${msg.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '13px' }}>
                    <MapPin size={14} style={{ marginRight: '4px' }} /> View Location
                  </a>
                ) : (
                  <span style={{ fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.text}</span>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  {msg.isForwarded && <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Forwarded</span>}
                  {msg.isStarred && <Star size={10} style={{ color: '#f5a623' }} />}
                  {msg.isPinned && <Pin size={10} style={{ color: 'var(--accent)' }} />}
                  {showExpiry && <Clock size={10} style={{ color: 'var(--text-secondary)' }} />}
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{msg.timestamp}</span>
                  {getStatusIcon(msg)}
                </div>

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <span key={emoji} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '2px 6px', fontSize: '12px' }}>{emoji} {count}</span>
                    ))}
                  </div>
                )}

                {/* Message context menu */}
                {showMsgMenu === msg.id && (
                  <div style={{ position: 'absolute', zIndex: 100, background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', top: '100%', right: isMe ? 0 : 'auto', left: isMe ? 'auto' : 0, minWidth: '160px' }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setReplyToMsg(msg); setShowMsgMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', borderRadius: '6px' }}>
                      <Reply size={14} /> Reply
                    </button>
                    <button onClick={() => { setForwardingMsg(msg); setShowForwardModal(true); setShowMsgMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', borderRadius: '6px' }}>
                      <Share2 size={14} /> Forward
                    </button>
                    <button onClick={() => { handleToggleStarMsg(msg.id); setShowMsgMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', borderRadius: '6px' }}>
                      <Star size={14} /> {msg.isStarred ? 'Unstar' : 'Star'}
                    </button>
                    <button onClick={() => { handleTogglePinMsg(msg.id); setShowMsgMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', borderRadius: '6px' }}>
                      <Pin size={14} /> {msg.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => { setShowEmojiPicker(msg.id); setShowMsgMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', borderRadius: '6px' }}>
                      <Smile size={14} /> React
                    </button>
                    {isMe && (
                      <button onClick={() => { handleDeleteMessage(msg.id); setShowMsgMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '13px', borderRadius: '6px' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                )}

                {/* Emoji picker */}
                {showEmojiPicker === msg.id && (
                  <div style={{ position: 'absolute', zIndex: 100, background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', top: '100%', right: isMe ? 0 : 'auto', left: isMe ? 'auto' : 0, display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '200px' }}
                    onClick={e => e.stopPropagation()}>
                    {EMOJI_LIST.map(emoji => (
                      <button key={emoji} onClick={() => { handleReactMsg(msg.id, emoji); setShowEmojiPicker(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>{emoji}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {peerTyping === 'typing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', padding: '4px 0' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <span>{activeContact.name} is typing...</span>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* ─── REPLY PREVIEW ─── */}
      {replyToMsg && (
        <div style={{ padding: '8px 16px', background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, borderLeft: '3px solid var(--accent)', paddingLeft: '8px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>{replyToMsg.senderUsername || (replyToMsg.sender === 'me' ? currentUser?.username : activeContact.name)}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyToMsg.text}</p>
          </div>
          <button onClick={() => setReplyToMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── INPUT BAR ─── */}
      <div style={{ padding: '12px 16px', background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <button title="Attach" onClick={() => fileInputRef.current?.click()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
          <Paperclip size={20} />
        </button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} />

        <textarea
          value={messageInput}
          onChange={e => handleMessageChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(replyToMsg, setReplyToMsg); } }}
          placeholder={isVanishActive ? '🔒 Vanish Mode — message will self-destruct' : `Message ${activeContact.name}...`}
          rows={1}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '22px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', outline: 'none', lineHeight: '1.5', maxHeight: '120px', overflow: 'auto' }}
        />

        <button onClick={() => handleSendMessage(replyToMsg, setReplyToMsg)}
          disabled={!messageInput.trim()}
          style={{ background: messageInput.trim() ? 'var(--accent)' : 'var(--input-bg)', border: 'none', cursor: messageInput.trim() ? 'pointer' : 'default', color: messageInput.trim() ? '#fff' : 'var(--text-secondary)', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
