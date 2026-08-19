import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Star, Pin, Trash2, Reply, MapPin, Download, FileText, CornerUpRight, Lock, Copy, Edit2, Play, Pause, ChevronDown } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🙏','🔥','👏','😍','🎉','💯','😎'];

export default function MessageBubble({ message, currentUser, onReply }) {
  const { starMessage, pinMessage, deleteMessage, reactToMessage, markViewOnceOpened } = useChat();

  // Hover/pin state — separate from showToolbar
  const [hovered, setHovered] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false); // stays visible after click
  const hoverTimer = useRef(null);

  const [isViewingOnce, setIsViewingOnce] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || message.text || '');
  const [copied, setCopied] = useState(false);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  const isMe = (message.senderUsername?.toLowerCase() === currentUser?.username?.toLowerCase()) ||
               (message.sender?.username?.toLowerCase() === currentUser?.username?.toLowerCase()) ||
               (message.sender === 'me');
  const isDeleted = message.deleted || message.content === '🚫 This message was deleted' || message.content === 'This message was deleted';
  const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const isStarred = message.isStarred;
  const isPinned = message.isPinned;
  const reactions = message.reactions || {};
  const isViewOnce = message.isViewOnce || message.messageType === 'VIEW_ONCE';
  const isViewOnceOpened = message.isViewOnceOpened;
  const isVoice = message.mediaType === 'VOICE' || message.messageType === 'VOICE';
  const isGif = message.mediaType === 'GIF' || message.messageType === 'GIF';
  const isSticker = message.mediaType === 'STICKER' || message.messageType === 'STICKER';

  // Toolbar: show on hover, hide after short grace period when mouse leaves
  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setHovered(false);
      setShowToolbar(false);
    }, 350); // 350ms grace so user can move to toolbar
  };
  const handleToolbarEnter = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  const handleToolbarLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setHovered(false);
      setShowToolbar(false);
    }, 350);
  };

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  const showActions = (hovered || showToolbar) && !isDeleted;

  const handleReact = (emoji) => {
    if (message.id) reactToMessage(message.id, emoji);
    setHovered(false);
    setShowToolbar(false);
  };

  const handleCopy = () => {
    const t = message.content || message.text || '';
    if (t) { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  };

  const handleSaveEdit = () => {
    if (editText.trim()) { message.content = editText.trim(); message.isEdited = true; setIsEditing(false); }
  };

  const toggleSpeed = () => {
    const next = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) { audioRef.current.pause(); setIsPlayingAudio(false); }
    else { audioRef.current.play(); setIsPlayingAudio(true); }
  };

  const renderStatus = () => {
    if (!isMe) return null;
    if (message.status === 'read') return <CheckCheck size={14} color="#53bdeb" />;
    if (message.status === 'delivered') return <CheckCheck size={14} color="#8696a0" />;
    return <Check size={14} color="#8696a0" />;
  };

  const renderLinkedText = (text) => {
    if (!text) return null;
    const reg = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    return text.split(reg).map((p, i) =>
      p.match(reg)
        ? <a key={i} href={p.startsWith('http') ? p : `https://${p}`} target="_blank" rel="noreferrer"
             style={{ color: '#53bdeb', textDecoration: 'underline', wordBreak: 'break-all' }}
             onClick={e => e.stopPropagation()}>{p}</a>
        : p
    );
  };

  const renderMedia = () => {
    // STICKER — transparent, no bubble bg
    if (isSticker) {
      return (
        <div style={{ padding: '2px' }}>
          <img src={message.mediaUrl} alt="Sticker" style={{ width: '120px', height: '120px', objectFit: 'contain', display: 'block' }} />
        </div>
      );
    }

    // GIF
    if (isGif) {
      return (
        <div style={{ marginBottom: '4px', borderRadius: '8px', overflow: 'hidden', maxWidth: '240px' }}>
          <img src={message.mediaUrl} alt="GIF" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
        </div>
      );
    }

    // Voice Note
    if (isVoice) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '10px', margin: '4px 0', minWidth: '220px' }}>
          {message.mediaUrl && (
            <audio ref={audioRef} src={message.mediaUrl} onEnded={() => setIsPlayingAudio(false)} style={{ display: 'none' }} />
          )}
          <button type="button" onClick={toggleAudio} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#00a884', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {isPlayingAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ height: '4px', backgroundColor: '#2a3942', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: isPlayingAudio ? '100%' : '30%', height: '100%', backgroundColor: '#00a884', transition: isPlayingAudio ? 'width 10s linear' : 'none' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Voice Note</span><span>0:12</span>
            </div>
          </div>
          <button type="button" onClick={toggleSpeed} style={{ background: '#2a3942', border: 'none', color: '#00a884', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
            {playbackSpeed}x
          </button>
        </div>
      );
    }

    if (!message.mediaUrl) return null;

    // View Once
    if (isViewOnce) {
      if (isViewOnceOpened) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', margin: '4px 0', color: '#8696a0', fontSize: '13px' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>①</span>
            <span>Opened</span>
          </div>
        );
      }
      return (
        <div onClick={() => !isViewOnceOpened && setIsViewingOnce(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: isMe ? '#004a3c' : '#182229', borderRadius: '8px', margin: '4px 0', cursor: 'pointer', border: '1px solid #00a884' }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#00a884', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>①</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e9edef' }}>{message.mediaType === 'VIDEO' ? 'Video' : 'Photo'} (View Once)</span>
        </div>
      );
    }

    const type = (message.mediaType || message.messageType || '').toUpperCase();
    if (type === 'IMAGE' || message.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
      return <div style={{ marginTop: '4px', marginBottom: '6px', borderRadius: '8px', overflow: 'hidden' }}><img src={message.mediaUrl} alt="Attached" style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block', borderRadius: '8px' }} /></div>;
    }
    if (type === 'VIDEO' || message.mediaUrl.match(/\.(mp4|webm|mov)/i)) {
      return <div style={{ marginTop: '4px', marginBottom: '6px', borderRadius: '8px', overflow: 'hidden' }}><video src={message.mediaUrl} controls style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', display: 'block' }} /></div>;
    }
    if (type === 'LOCATION' || (message.latitude && message.longitude)) {
      return <a href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#53bdeb', textDecoration: 'none', margin: '4px 0', fontSize: '13px' }}><MapPin size={16} /> Shared Location</a>;
    }
    if (type === 'DOCUMENT' || type === 'FILE') {
      return (
        <a href={message.mediaUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '6px', color: '#e9edef', textDecoration: 'none', margin: '4px 0', fontSize: '13px' }}>
          <FileText size={18} color="#00a884" />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.fileName || 'Download'}</span>
          <Download size={16} color="#8696a0" />
        </a>
      );
    }
    return null;
  };

  // Sticker: no bubble background, transparent
  const noBackground = isSticker;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px', width: '100%', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {message.isForwarded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#8696a0', fontStyle: 'italic', marginBottom: '2px', paddingLeft: isMe ? '0' : '8px', paddingRight: isMe ? '8px' : '0' }}>
          <CornerUpRight size={12} /> Forwarded
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: '65%', minWidth: noBackground ? '0' : '120px' }}>

        {/* ── Floating Action Toolbar ── */}
        {showActions && (
          <div
            onMouseEnter={handleToolbarEnter}
            onMouseLeave={handleToolbarLeave}
            style={{
              position: 'absolute',
              top: '-42px',
              [isMe ? 'right' : 'left']: '0',
              backgroundColor: '#182229',
              borderRadius: '24px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              zIndex: 20,
              border: '1px solid #2a3942',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Quick Emoji reactions */}
            {QUICK_EMOJIS.slice(0, 6).map((em) => (
              <button key={em} onClick={() => handleReact(em)}
                style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '2px 4px', lineHeight: 1, borderRadius: '4px', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                {em}
              </button>
            ))}
            {/* Divider */}
            <span style={{ width: '1px', height: '18px', backgroundColor: '#2a3942', margin: '0 2px' }} />
            {/* Reply */}
            <button onClick={() => { onReply && onReply(message); setShowToolbar(false); }} title="Reply"
              style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
              <Reply size={14} />
            </button>
            {/* Copy */}
            {!isVoice && !isGif && !isSticker && (
              <button onClick={handleCopy} title="Copy"
                style={{ background: 'transparent', border: 'none', color: copied ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
            {/* Edit (own text msgs) */}
            {isMe && !isVoice && !isGif && !isSticker && !isViewOnce && (
              <button onClick={() => { setIsEditing(!isEditing); setShowToolbar(true); }} title="Edit"
                style={{ background: 'transparent', border: 'none', color: isEditing ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                <Edit2 size={13} />
              </button>
            )}
            {/* Star */}
            <button onClick={() => starMessage(message.id, !isStarred)} title={isStarred ? 'Unstar' : 'Star'}
              style={{ background: 'transparent', border: 'none', color: isStarred ? '#f59e0b' : '#8696a0', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
              <Star size={14} fill={isStarred ? '#f59e0b' : 'none'} />
            </button>
            {/* Pin */}
            <button onClick={() => pinMessage(message.id, !isPinned)} title={isPinned ? 'Unpin' : 'Pin'}
              style={{ background: 'transparent', border: 'none', color: isPinned ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
              <Pin size={14} />
            </button>
            {/* Delete */}
            {isMe && (
              <button onClick={() => { deleteMessage(message.id); setShowToolbar(false); }} title="Delete"
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Message Bubble Card ── */}
        <div style={{
          padding: noBackground ? '0' : '8px 12px',
          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          backgroundColor: noBackground ? 'transparent' : isMe ? '#005c4b' : '#202c33',
          color: '#e9edef',
          boxShadow: noBackground ? 'none' : '0 1px 1px rgba(0,0,0,0.25)',
          position: 'relative',
          wordBreak: 'break-word',
        }}>
          {/* Sender name in groups */}
          {!isMe && message.senderUsername && message.groupId && (
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00a884', marginBottom: '2px' }}>~{message.senderUsername}</div>
          )}

          {/* Quoted reply */}
          {message.parentMessageText && (
            <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderLeft: '3px solid #00a884', borderRadius: '4px', padding: '4px 8px', marginBottom: '6px', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: '#00a884', fontSize: '11px' }}>~{message.parentMessageSender || 'Message'}</div>
              <div style={{ color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.parentMessageText}</div>
            </div>
          )}

          {/* Media */}
          {renderMedia()}

          {/* Inline Edit Input */}
          {isEditing ? (
            <div style={{ margin: '4px 0' }}>
              <input type="text" value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                style={{ width: '100%', padding: '6px 8px', backgroundColor: '#182229', border: '1px solid #00a884', borderRadius: '6px', color: '#e9edef', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: '#8696a0', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveEdit} style={{ background: '#00a884', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </div>
          ) : (
            !noBackground && !isViewOnce && (message.content || message.text) && (
              <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.4', fontStyle: isDeleted ? 'italic' : 'normal', color: isDeleted ? '#8696a0' : '#e9edef' }}>
                {renderLinkedText(message.content || message.text)}
              </p>
            )
          )}

          {/* Timestamp row */}
          {!noBackground && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#8696a0' }}>
              {message.isEdited && <span style={{ fontSize: '10px', fontStyle: 'italic' }}>Edited</span>}
              {isPinned && <Pin size={11} color="#00a884" />}
              {isStarred && <Star size={11} color="#f59e0b" fill="#f59e0b" />}
              <span>{time}</span>
              {renderStatus()}
            </div>
          )}
        </div>

        {/* Reaction Bubbles */}
        {Object.keys(reactions).length > 0 && (
          <div style={{ position: 'absolute', bottom: '-12px', [isMe ? 'right' : 'left']: '8px', backgroundColor: '#182229', borderRadius: '14px', padding: '2px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', border: '1px solid #2a3942', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', zIndex: 5 }}>
            {Object.entries(reactions).map(([emoji, count]) => (
              <span key={emoji}>{emoji}{count > 1 ? ` ${count}` : ''}</span>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen View Once Viewer */}
      {isViewingOnce && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
          <div style={{ position: 'absolute', top: '20px', left: '24px', color: '#00a884', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} /> View Once Protected Media
          </div>
          <button onClick={() => { setIsViewingOnce(false); markViewOnceOpened(message.id); }}
            style={{ position: 'absolute', top: '20px', right: '24px', padding: '8px 16px', backgroundColor: '#00a884', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}>
            Close (Permanently vanishes)
          </button>
          {message.mediaType === 'VIDEO'
            ? <video src={message.mediaUrl} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
            : <img src={message.mediaUrl} alt="View Once" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />}
        </div>
      )}
    </div>
  );
}
