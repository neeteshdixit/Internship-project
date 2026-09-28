import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Star, Pin, Trash2, Reply, MapPin, Download, FileText, CornerUpRight, Lock, Copy, Edit2, Play, Pause, ChevronDown, Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, PhoneOff, Video, Flame, ShieldAlert, BarChart2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { apiFetch } from '../../lib/apiFetch';
import { decryptPayload } from '../../crypto/cryptoEngine';
import ViewOnceModal from './ViewOnceModal';
import ForwardModal from './ForwardModal';

const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🙏','🔥','👏','😍','🎉','💯','😎'];

export default function MessageBubble({ message, currentUser, onReply }) {
  const { starMessage, pinMessage, deleteMessage, reactToMessage, markViewOnceOpened, selectedContact, contacts, sendMessage, getChatKey } = useChat();

  // Hover/pin state — separate from showToolbar
  const [hovered, setHovered] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false); // stays visible after click
  const hoverTimer = useRef(null);

  const [isViewingOnce, setIsViewingOnce] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const rawInitialText = message.content || message.text || '';
  const [displayText, setDisplayText] = useState(rawInitialText);
  const [editText, setEditText] = useState(rawInitialText);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const raw = message.content || message.text || '';
    const isBase64Cipher = typeof raw === 'string' &&
      raw.length >= 16 &&
      /^[A-Za-z0-9+/=]+$/.test(raw.trim());

    if (isBase64Cipher && message.iv) {
      const candidates = [
        selectedContact?.isGroup ? `group:${selectedContact.id}` : null,
        message.groupId ? `group:${message.groupId}` : null,
        selectedContact?.isGroup ? String(selectedContact.id) : null,
        message.groupId ? String(message.groupId) : null,
        'group:1',
        '1',
        getChatKey ? getChatKey(selectedContact) : null,
      ].filter(Boolean);

      decryptPayload(raw.trim(), message.iv, candidates).then((dec) => {
        if (active && dec && dec !== raw) {
          setDisplayText(dec);
          message.content = dec;
        }
      }).catch(() => {});
    } else {
      setDisplayText(raw);
    }
    return () => { active = false; };
  }, [message.content, message.text, message.iv, selectedContact, message.groupId, getChatKey]);

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

  const isVanishMode = (message.isPinned || isPinned) ? false : (!!selectedContact?.vanishMode || (message.selfDestructSeconds != null && message.selfDestructSeconds > 0));
  const isSeen = message.status === 'read' || !!message.readAt;

  const [vanishCountdown, setVanishCountdown] = useState(() => {
    if (!isVanishMode || !isSeen) return null;
    const vanishLimitSec = message.selfDestructSeconds || 20;
    const startTime = message.readAt ? new Date(message.readAt).getTime() : Date.now();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, vanishLimitSec - elapsed);
  });

  useEffect(() => {
    if (!isVanishMode || !isSeen) {
      setVanishCountdown(null);
      return;
    }
    const vanishLimitSec = message.selfDestructSeconds || 20;
    const startTime = message.readAt ? new Date(message.readAt).getTime() : Date.now();

    const checkTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, vanishLimitSec - elapsed);
      setVanishCountdown(remaining);
      return remaining;
    };

    checkTimer();
    const interval = setInterval(() => {
      const remaining = checkTimer();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVanishMode, isSeen, message.readAt, message.selfDestructSeconds]);

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
    const t = displayText || message.content || message.text || '';
    if (t) { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      message.content = editText.trim();
      setDisplayText(editText.trim());
      message.isEdited = true;
      setIsEditing(false);
    }
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

    // Poll Card (does not require mediaUrl)
    if (message.messageType === 'POLL') {
      let pollData = null;
      try {
        pollData = typeof message.content === 'object' ? message.content : JSON.parse(message.content);
      } catch (e) {
        pollData = null;
      }

      if (!pollData) return <div>{message.content}</div>;

      const totalVotes = (pollData.options || []).reduce((acc, opt) => acc + (opt.voters ? opt.voters.length : 0), 0);

      const handleVote = async (optionId) => {
        const myName = currentUser?.username;
        if (!myName) return;

        const updatedOptions = pollData.options.map(opt => {
          const hasVoted = opt.voters && opt.voters.includes(myName);
          if (opt.id === optionId) {
            return {
              ...opt,
              voters: hasVoted ? opt.voters.filter(u => u !== myName) : [...(opt.voters || []), myName]
            };
          } else {
            return pollData.allowMultiple ? opt : {
              ...opt,
              voters: (opt.voters || []).filter(u => u !== myName)
            };
          }
        });

        const newPollData = { ...pollData, options: updatedOptions };
        if (message.id) {
          apiFetch(`/api/messages/poll-vote/${message.id}`, {
            method: 'POST',
            body: JSON.stringify({ pollContent: JSON.stringify(newPollData) })
          }).catch(console.error);
        }
      };

      return (
        <div style={{ minWidth: '240px', maxWidth: '320px', padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart2 size={18} color="#00a884" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#e9edef' }}>{pollData.question}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8696a0', marginBottom: '12px' }}>
            {pollData.allowMultiple ? 'Select one or more' : 'Select one'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pollData.options.map(opt => {
              const count = opt.voters ? opt.voters.length : 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const hasVoted = opt.voters && opt.voters.includes(currentUser?.username);

              return (
                <div
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  style={{
                    position: 'relative',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: hasVoted ? '1.5px solid #00a884' : '1px solid #2a3942',
                    backgroundColor: hasVoted ? 'rgba(0,168,132,0.1)' : '#182229',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${pct}%`,
                      backgroundColor: 'rgba(0, 168, 132, 0.25)',
                      zIndex: 1,
                      transition: 'width 0.3s ease',
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: pollData.allowMultiple ? '4px' : '50%',
                          border: hasVoted ? 'none' : '2px solid #8696a0',
                          backgroundColor: hasVoted ? '#00a884' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        {hasVoted && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#e9edef' }}>{opt.text}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0' }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '8px', fontSize: '11px', color: '#8696a0', textAlign: 'right' }}>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }

    if (!message.mediaUrl) return null;

    // View Once
    if (isViewOnce) {
      if (isViewOnceOpened) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '8px', margin: '4px 0', color: '#8696a0', fontSize: '13px' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>①</span>
            <span style={{ fontStyle: 'italic' }}>Opened</span>
          </div>
        );
      }
      return (
        <div
          onClick={() => !isViewOnceOpened && setIsViewingOnce(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: isMe ? '#004a3c' : '#182229',
            borderRadius: '10px',
            margin: '4px 0',
            cursor: 'pointer',
            border: '1.5px solid #00a884',
            boxShadow: '0 2px 8px rgba(0, 168, 132, 0.15)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: '#00a884',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 800,
            flexShrink: 0,
          }}>
            ①
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e9edef', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {message.mediaType === 'VIDEO' ? 'Video' : 'Photo'} (View Once)
            </span>
            <span style={{ fontSize: '11px', color: '#8696a0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={10} color="#00a884" />
              {isMe ? 'Sent • Screenshot protected' : 'Tap to view • Screenshot blocked'}
            </span>
          </div>
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

  // Dedicated Call Message Bubble (Missed / Offline / Completed Calls)
  if (message.messageType === 'CALL' || (message.callType && !message.content?.includes(' '))) {
    const isVideo = (message.callType || '').toUpperCase() === 'VIDEO';
    const rawStatus = (message.callStatus || message.status || '').toUpperCase();
    const isMissed = rawStatus === 'MISSED' || rawStatus === 'OFFLINE' || rawStatus === 'NO_ANSWER';
    const isDeclined = rawStatus === 'REJECTED' || rawStatus === 'BUSY';
    const isCompleted = rawStatus === 'COMPLETED' || rawStatus === 'CONNECTED';
    const duration = message.callDuration || 0;

    const formatDur = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

    let title = '';
    let subtitle = '';
    let icon = null;

    if (isMissed) {
      if (isMe) {
        title = `Unanswered ${isVideo ? 'video' : 'voice'} call`;
        subtitle = rawStatus === 'OFFLINE' ? 'User was offline · Notification sent' : 'No answer';
        icon = isVideo ? <Video size={20} color="#8696a0" /> : <PhoneOutgoing size={20} color="#8696a0" />;
      } else {
        title = `Missed ${isVideo ? 'video' : 'voice'} call`;
        subtitle = rawStatus === 'OFFLINE' ? 'You were offline · Tap to call back' : 'Tap to call back';
        icon = isVideo ? <Video size={20} color="#ef4444" /> : <PhoneMissed size={20} color="#ef4444" />;
      }
    } else if (isDeclined) {
      title = `${isVideo ? 'Video' : 'Voice'} call declined`;
      subtitle = isMe ? 'Call was declined' : 'You declined this call';
      icon = <PhoneOff size={20} color="#ef4444" />;
    } else if (isCompleted) {
      title = `${isVideo ? 'Video' : 'Voice'} call`;
      subtitle = duration > 0 ? formatDur(duration) : 'Completed';
      icon = isMe ? <PhoneOutgoing size={20} color="#00a884" /> : <PhoneIncoming size={20} color="#00a884" />;
    } else {
      title = `${isVideo ? 'Video' : 'Voice'} call`;
      subtitle = rawStatus.toLowerCase();
      icon = isVideo ? <Video size={20} color="#00a884" /> : <Phone size={20} color="#00a884" />;
    }

    const handleCallBack = () => {
      const peer = isMe
        ? (message.receiverUsername || message.receiver?.username)
        : (message.senderUsername || message.sender?.username || message.sender);
      if (!peer) return;
      window.dispatchEvent(new CustomEvent('start_call', {
        detail: {
          receiver: peer,
          callType: isVideo ? 'VIDEO' : 'AUDIO',
        }
      }));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px', width: '100%' }}>
        <div
          onClick={handleCallBack}
          style={{
            maxWidth: '320px',
            minWidth: '220px',
            padding: '12px 14px',
            borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            backgroundColor: isMe ? '#005c4b' : '#202c33',
            color: '#e9edef',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            border: isMissed && !isMe ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'transform 0.1s ease',
          }}
          title="Click to call back"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isMissed && !isMe ? 'rgba(239, 68, 68, 0.18)' : 'rgba(0, 168, 132, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: isMissed && !isMe ? '#ef4444' : '#e9edef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </div>
              <div style={{ fontSize: '12px', color: '#8696a0', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {subtitle}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '6px', fontSize: '11px', color: '#8696a0' }}>
            <span>{time}</span>
            {renderStatus()}
          </div>
        </div>
      </div>
    );
  }

  if (isVanishMode && isSeen && vanishCountdown === 0) {
    return null;
  }

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
            {/* Forward */}
            <button onClick={() => { setShowForwardModal(true); setShowToolbar(false); }} title="Forward"
              style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
              <CornerUpRight size={14} />
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
              <button onClick={() => { setIsEditing(!isEditing); setEditText(displayText); setShowToolbar(true); }} title="Edit"
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
        <div
          className="message-bubble-card"
          style={{
            padding: noBackground ? '0' : '8px 12px',
          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          backgroundColor: noBackground ? 'transparent' : isMe ? '#005c4b' : '#202c33',
          color: '#e9edef',
          boxShadow: noBackground ? 'none' : '0 1px 1px rgba(0,0,0,0.25)',
          position: 'relative',
          wordBreak: 'break-word',
        }}>
          {/* Sender name in groups */}
          {!isMe && (message.senderUsername || message.sender?.username) && (selectedContact?.isGroup || message.groupId || message.group?.id) && (
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00a884', marginBottom: '2px' }}>
              ~{message.senderUsername || message.sender?.username}
            </div>
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
            !noBackground && !isViewOnce && message.messageType !== 'POLL' && (displayText || message.content || message.text) && (
              <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.4', fontStyle: isDeleted ? 'italic' : 'normal', color: isDeleted ? '#8696a0' : '#e9edef' }}>
                {renderLinkedText(displayText || message.content || message.text)}
              </p>
            )
          )}

          {/* Timestamp row */}
          {!noBackground && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#8696a0' }}>
              {message.isEdited && <span style={{ fontSize: '10px', fontStyle: 'italic' }}>Edited</span>}
              {isPinned && <Pin size={11} color="#00a884" />}
              {isStarred && <Star size={11} color="#f59e0b" fill="#f59e0b" />}
              {isVanishMode && isSeen && vanishCountdown !== null && vanishCountdown > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    color: vanishCountdown <= 5 ? '#ef4444' : '#f59e0b',
                    backgroundColor: vanishCountdown <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    marginRight: '2px',
                  }}
                  title={`Vanishes ${vanishCountdown}s after being read`}
                >
                  <Flame size={10} color={vanishCountdown <= 5 ? '#ef4444' : '#f59e0b'} />
                  {vanishCountdown}s
                </span>
              )}
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

      {/* WhatsApp-Style Screenshot Restricted View Once Modal */}
      <ViewOnceModal
        isOpen={isViewingOnce}
        mediaUrl={message.mediaUrl}
        mediaType={message.mediaType}
        currentUser={currentUser}
        senderUsername={message.senderUsername || message.sender?.username}
        onClose={() => {
          setIsViewingOnce(false);
          markViewOnceOpened(message.id);
        }}
      />

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={message}
        contacts={contacts}
        onForward={async (targets, msg) => {
          for (const target of targets) {
            sendMessage(displayText || msg.content || msg.text, {
              mediaUrl: msg.mediaUrl,
              mediaType: msg.mediaType,
              messageType: msg.messageType,
              isForwarded: true,
              targetContact: target,
            });
          }
        }}
      />
    </div>
  );
}
