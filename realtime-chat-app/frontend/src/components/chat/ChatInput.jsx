import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, MapPin, Image, FileText, Clock, Trash2, Sticker } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const EMOJI_LIST = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','🖐','✋','👌','✌️','🤞','🤙','👍','👎','✊','👊','👏','🙌','🙏','💪','❤️','🧡','💛','💚','💙','💜','🖤','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🔥','✨','⭐','🎉','🎊','🎈','🎁','🏆','🥇','🎯','💯','🆕','🆒','🆓'];

// Sticker packs — using unicode emoji art + open sticker URLs
const STICKER_PACKS = [
  {
    name: '🐱 Cats',
    stickers: [
      'https://media.tenor.com/Y7gvN3MwGVEAAAAi/cat-kitty.gif',
      'https://media.tenor.com/6oHoLPFGfVcAAAAi/sad-cat.gif',
      'https://media.tenor.com/x0WqHRlieFoAAAAi/bongocat.gif',
      'https://media.tenor.com/r9_bGm2kvpIAAAAi/cat-bongo.gif',
      'https://media.tenor.com/ByMkzLhptJYAAAAi/cat-peek.gif',
      'https://media.tenor.com/3JkV0eMpCboAAAAi/cat-paws.gif',
    ],
  },
  {
    name: '🐶 Dogs',
    stickers: [
      'https://media.tenor.com/wvHOFuGvvdQAAAAi/dog-funny.gif',
      'https://media.tenor.com/VyrvtbI5_YMAAAAS/shiba-inu-doge.gif',
      'https://media.tenor.com/8YBPGxmLSdQAAAAi/corgi-dog.gif',
      'https://media.tenor.com/mSVj7bvwq0QAAAAi/dog-wink.gif',
      'https://media.tenor.com/PBLP5wvIqIIAAAAi/puppy-dog-eyes.gif',
      'https://media.tenor.com/DFkAmhY0AUwAAAAi/dog-head-tilt.gif',
    ],
  },
  {
    name: '💬 Chat',
    stickers: [
      'https://media.tenor.com/0Y4QPBL0EfAAAAAi/hi-hello.gif',
      'https://media.tenor.com/JjSmMnLqY00AAAAi/bye.gif',
      'https://media.tenor.com/B7aLhUOYt7oAAAAi/ok-thumbs-up.gif',
      'https://media.tenor.com/WtGOp-A_JQ4AAAAi/haha-laughing.gif',
      'https://media.tenor.com/2DLfpUXSrlsAAAAi/sleepy.gif',
      'https://media.tenor.com/bQJzS2kWxV8AAAAi/wow.gif',
    ],
  },
  {
    name: '🎮 Fun',
    stickers: [
      'https://media.tenor.com/eBqAqXEqcywAAAAi/among-us.gif',
      'https://media.tenor.com/t7QFG7sXs0cAAAAi/pepe-dancing.gif',
      'https://media.tenor.com/Nc46R0wALB4AAAAi/nyan-cat.gif',
      'https://media.tenor.com/GW14T-bGTBwAAAAi/dancing-banana.gif',
      'https://media.tenor.com/1Db3n7AQaGcAAAAi/trollface.gif',
      'https://media.tenor.com/wdDM3GxnSoIAAAAi/minion-wink.gif',
    ],
  },
];

// GIF panel using Tenor public embed search
function GifPicker({ onSelect, onClose }) {
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trending on mount
  useEffect(() => {
    searchGifs('trending');
  }, []);

  const searchGifs = async (q) => {
    setLoading(true);
    try {
      // Using Tenor API v2 with free key (client-side public key)
      const TENOR_KEY = ''; // public demo key
      const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q || 'funny')}&key=${TENOR_KEY}&limit=20&media_filter=gif`);
      const data = await res.json();
      const urls = (data.results || []).map(r => ({
        url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
        preview: r.media_formats?.nanogif?.url || r.media_formats?.tinygif?.url || '',
      })).filter(g => g.url);
      setGifResults(urls);
    } catch (e) {
      // Fallback static GIFs if Tenor fails
      setGifResults([
        { url: 'https://media.tenor.com/GW14T-bGTBwAAAAC/dancing-banana.gif', preview: 'https://media.tenor.com/GW14T-bGTBwAAAAC/dancing-banana.gif' },
        { url: 'https://media.tenor.com/0Y4QPBL0EfAAAAC/hi-hello.gif', preview: 'https://media.tenor.com/0Y4QPBL0EfAAAAC/hi-hello.gif' },
        { url: 'https://media.tenor.com/Nc46R0wALB4AAAAC/nyan-cat.gif', preview: 'https://media.tenor.com/Nc46R0wALB4AAAAC/nyan-cat.gif' },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'absolute', bottom: '65px', left: '46px', backgroundColor: '#202c33', borderRadius: '12px', border: '1px solid #2a3942', width: '320px', height: '340px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10, overflow: 'hidden' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #2a3942', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          placeholder="Search GIFs..."
          value={gifQuery}
          onChange={e => setGifQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchGifs(gifQuery)}
          style={{ flex: 1, padding: '6px 10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '6px', color: '#e9edef', fontSize: '13px', outline: 'none' }}
          autoFocus
        />
        <button onClick={() => searchGifs(gifQuery)} style={{ backgroundColor: '#00a884', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Go</button>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#8696a0', paddingTop: '40px', fontSize: '13px' }}>Loading GIFs...</div>
        ) : gifResults.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#8696a0', paddingTop: '40px', fontSize: '13px' }}>No GIFs found</div>
        ) : gifResults.map((gif, i) => (
          <div key={i} onClick={() => { onSelect(gif.url); onClose(); }} style={{ borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '4/3', backgroundColor: '#2a3942' }}>
            <img src={gif.preview || gif.url} alt="GIF" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Sticker Picker
function StickerPicker({ onSelect, onClose }) {
  const [activePack, setActivePack] = useState(0);

  return (
    <div style={{ position: 'absolute', bottom: '65px', left: '46px', backgroundColor: '#202c33', borderRadius: '12px', border: '1px solid #2a3942', width: '300px', height: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a3942', padding: '6px 8px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flex: 1 }}>
          {STICKER_PACKS.map((pack, i) => (
            <button key={i} onClick={() => setActivePack(i)}
              style={{ background: activePack === i ? '#2a3942' : 'transparent', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: activePack === i ? '#00a884' : '#8696a0', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {pack.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {STICKER_PACKS[activePack].stickers.map((url, i) => (
          <div key={i} onClick={() => { onSelect(url); onClose(); }}
            style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#2a3942', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', transition: 'border 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.border = '1px solid #00a884'}
            onMouseLeave={e => e.currentTarget.style.border = '1px solid transparent'}
          >
            <img src={url} alt="Sticker" loading="lazy" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatInput({ onSendMessage, replyMessage, onCancelReply }) {
  const { sendTypingSignal, uploadFile, selectedContact } = useChat();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showStickers, setShowStickers] = useState(false);

  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [scheduleTime, setScheduleTime] = useState('');
  const [showScheduleInput, setShowScheduleInput] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Restore Draft
  useEffect(() => {
    if (!selectedContact) return;
    const draftKey = `draft_${selectedContact.id || selectedContact.username}`;
    setText(localStorage.getItem(draftKey) || '');
  }, [selectedContact]);

  // Close all popups when clicking outside
  useEffect(() => {
    const close = () => { setShowEmoji(false); setShowAttach(false); setShowGif(false); setShowStickers(false); };
    document.addEventListener('keydown', e => e.key === 'Escape' && close());
    return () => document.removeEventListener('keydown', close);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (selectedContact) {
      const dk = `draft_${selectedContact.id || selectedContact.username}`;
      val.trim() ? localStorage.setItem(dk, val) : localStorage.removeItem(dk);
    }
    sendTypingSignal(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingSignal(false), 2000);
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setIsUploading(true);
          try {
            const res = await uploadFile(file);
            setPendingFile({ mediaUrl: res.mediaUrl, mediaType: 'IMAGE', fileName: res.fileName, fileSize: res.fileSize, isViewOnce: false, previewUrl: URL.createObjectURL(file) });
          } catch {}
          setIsUploading(false);
        }
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadFile(file);
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      setPendingFile({ mediaUrl: res.mediaUrl, mediaType: isImg ? 'IMAGE' : isVid ? 'VIDEO' : 'DOCUMENT', fileName: res.fileName || file.name, fileSize: res.fileSize || file.size, isViewOnce: false, previewUrl: (isImg || isVid) ? URL.createObjectURL(file) : null });
    } catch {}
    setIsUploading(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setShowAttach(false);
    try {
      const res = await uploadFile(file);
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      setPendingFile({ mediaUrl: res.mediaUrl, mediaType: isImg ? 'IMAGE' : isVid ? 'VIDEO' : 'DOCUMENT', fileName: res.fileName || file.name, fileSize: res.fileSize || file.size, isViewOnce: false, previewUrl: (isImg || isVid) ? URL.createObjectURL(file) : null });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendGif = (url) => {
    onSendMessage('', { mediaUrl: url, mediaType: 'GIF', messageType: 'GIF' });
  };

  const handleSendSticker = (url) => {
    onSendMessage('', { mediaUrl: url, mediaType: 'STICKER', messageType: 'STICKER' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        try {
          const res = await uploadFile(file);
          onSendMessage('🎤 Voice Note', { mediaUrl: res.mediaUrl, mediaType: 'VOICE', messageType: 'VOICE' });
        } catch {
          onSendMessage('🎤 Voice Note', { mediaType: 'VOICE' });
        }
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000);
    } catch { alert('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); clearInterval(recordingTimerRef.current); }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !pendingFile) return;
    sendTypingSignal(false);
    onSendMessage(text, {
      mediaUrl: pendingFile?.mediaUrl || null,
      mediaType: pendingFile?.mediaType || 'TEXT',
      messageType: pendingFile?.mediaType || 'TEXT',
      fileName: pendingFile?.fileName || null,
      fileSize: pendingFile?.fileSize || null,
      isViewOnce: !!pendingFile?.isViewOnce,
      replyToId: replyMessage?.id || null,
      replyToText: replyMessage?.content || replyMessage?.text || null,
      replyToSender: replyMessage?.senderUsername || replyMessage?.sender?.username || null,
      scheduleAt: scheduleTime || null,
    });
    if (selectedContact) localStorage.removeItem(`draft_${selectedContact.id || selectedContact.username}`);
    setText('');
    setPendingFile(null);
    setScheduleTime('');
    setShowScheduleInput(false);
    if (onCancelReply) onCancelReply();
  };

  const handleShareLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { onSendMessage(`📍 Location`, { mediaType: 'LOCATION', mediaUrl: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}` }); setShowAttach(false); },
      () => { alert('GPS unavailable'); setShowAttach(false); }
    );
  };

  const closeAll = () => { setShowEmoji(false); setShowAttach(false); setShowGif(false); setShowStickers(false); };

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      style={{ backgroundColor: '#202c33', borderTop: '1px solid #222d34', position: 'relative' }}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt" style={{ display: 'none' }} />

      {/* Reply Preview */}
      {replyMessage && (
        <div style={{ padding: '8px 16px', backgroundColor: '#182229', borderLeft: '4px solid #00a884', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00a884' }}>Replying to ~{replyMessage.senderUsername || replyMessage.sender?.username}</div>
            <div style={{ fontSize: '13px', color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyMessage.content || replyMessage.text}</div>
          </div>
          <button onClick={onCancelReply} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Pending File Preview */}
      {pendingFile && (
        <div style={{ padding: '10px 16px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222d34' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pendingFile.previewUrl
              ? pendingFile.mediaType === 'VIDEO'
                ? <video src={pendingFile.previewUrl} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                : <img src={pendingFile.previewUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
              : <FileText size={32} color="#00a884" />
            }
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#e9edef' }}>{pendingFile.fileName}</div>
              <div style={{ fontSize: '11px', color: '#8696a0' }}>{Math.round((pendingFile.fileSize || 0) / 1024)} KB</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {(pendingFile.mediaType === 'IMAGE' || pendingFile.mediaType === 'VIDEO') && (
              <button type="button" onClick={() => setPendingFile(p => ({ ...p, isViewOnce: !p.isViewOnce }))}
                title={pendingFile.isViewOnce ? 'View Once ON' : 'Send as View Once'}
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: pendingFile.isViewOnce ? '#00a884' : '#2a3942', border: pendingFile.isViewOnce ? '2px solid #00a884' : '2px dashed #8696a0', color: pendingFile.isViewOnce ? '#fff' : '#8696a0', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ①
              </button>
            )}
            <button type="button" onClick={() => setPendingFile(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Voice Recording Bar */}
      {isRecording && (
        <div style={{ padding: '12px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222d34' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            <span style={{ color: '#e9edef', fontSize: '14px', fontWeight: 600 }}>
              {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={cancelRecording} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <Trash2 size={16} /> Cancel
            </button>
            <button onClick={stopRecording} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#00a884', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Schedule Bar */}
      {showScheduleInput && (
        <div style={{ padding: '8px 16px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #222d34' }}>
          <Clock size={16} color="#00a884" />
          <span style={{ fontSize: '12px', color: '#e9edef' }}>Send at:</span>
          <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ backgroundColor: '#2a3942', border: 'none', borderRadius: '6px', color: '#e9edef', padding: '4px 8px', fontSize: '12px', outline: 'none' }} />
          <button onClick={() => setShowScheduleInput(false)} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div style={{ position: 'absolute', bottom: '65px', left: '16px', width: '300px', height: '200px', backgroundColor: '#202c33', borderRadius: '12px', border: '1px solid #2a3942', padding: '8px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10 }}>
          {EMOJI_LIST.map(em => (
            <button key={em} type="button" onClick={() => setText(p => p + em)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}>{em}</button>
          ))}
        </div>
      )}

      {/* GIF Picker */}
      {showGif && <GifPicker onSelect={handleSendGif} onClose={() => setShowGif(false)} />}

      {/* Sticker Picker */}
      {showStickers && <StickerPicker onSelect={handleSendSticker} onClose={() => setShowStickers(false)} />}

      {/* Attach Menu */}
      {showAttach && (
        <div style={{ position: 'absolute', bottom: '65px', left: '46px', backgroundColor: '#202c33', borderRadius: '12px', border: '1px solid #2a3942', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10, width: '200px' }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: '13px', cursor: 'pointer', borderRadius: '6px' }}>
            <Image size={17} color="#00a884" /> Photos & Videos
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: '13px', cursor: 'pointer', borderRadius: '6px' }}>
            <FileText size={17} color="#53bdeb" /> Document / File
          </button>
          <button type="button" onClick={handleShareLocation} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: '13px', cursor: 'pointer', borderRadius: '6px' }}>
            <MapPin size={17} color="#ef4444" /> Location
          </button>
          <button type="button" onClick={() => { setShowScheduleInput(true); setShowAttach(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: '13px', cursor: 'pointer', borderRadius: '6px' }}>
            <Clock size={17} color="#f59e0b" /> Schedule Message
          </button>
        </div>
      )}

      {/* Main Input Bar */}
      {!isRecording && (
        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}>
          {/* Emoji */}
          <button type="button" onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); setShowGif(false); setShowStickers(false); }} style={{ background: 'transparent', border: 'none', color: showEmoji ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '6px' }}>
            <Smile size={22} />
          </button>

          {/* GIF Button */}
          <button type="button" onClick={() => { setShowGif(!showGif); setShowEmoji(false); setShowAttach(false); setShowStickers(false); }}
            title="Send GIF"
            style={{ background: showGif ? 'rgba(0,168,132,0.15)' : 'transparent', border: showGif ? '1px solid #00a884' : '1px solid transparent', color: showGif ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, lineHeight: 1 }}>
            GIF
          </button>

          {/* Sticker Button */}
          <button type="button" onClick={() => { setShowStickers(!showStickers); setShowEmoji(false); setShowAttach(false); setShowGif(false); }}
            title="Send Sticker"
            style={{ background: showStickers ? 'rgba(0,168,132,0.15)' : 'transparent', border: showStickers ? '1px solid #00a884' : '1px solid transparent', color: showStickers ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', fontSize: '16px', lineHeight: 1 }}>
            🎭
          </button>

          {/* Attach */}
          <button type="button" onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); setShowGif(false); setShowStickers(false); }} style={{ background: 'transparent', border: 'none', color: showAttach ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '6px' }}>
            <Paperclip size={22} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={isUploading ? 'Uploading...' : 'Type a message...'}
            value={text}
            disabled={isUploading}
            maxLength={4000}
            onPaste={handlePaste}
            onChange={handleInputChange}
            onFocus={closeAll}
            style={{ flex: 1, padding: '9px 14px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', outline: 'none', fontSize: '14px' }}
          />

          {/* Send / Mic */}
          {text.trim() || pendingFile ? (
            <button type="submit" disabled={isUploading} style={{ background: '#00a884', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
              <Send size={17} />
            </button>
          ) : (
            <button type="button" onClick={startRecording} title="Record voice message" style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mic size={20} />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
