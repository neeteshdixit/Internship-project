import React, { useState, useEffect } from 'react';
import { Image, Type, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiFetch';

export default function StatusPanel() {
  const { currentUser } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [postType, setPostType] = useState('text');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState('#00a884');
  const [imageUrl, setImageUrl] = useState('');
  const [posting, setPosting] = useState(false);

  const BG_COLORS = ['#00a884', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const [all, mine] = await Promise.allSettled([
          apiFetch('/api/statuses'),
          apiFetch('/api/statuses/mine'),
        ]);
        if (all.status === 'fulfilled') setStatuses(all.value || []);
        if (mine.status === 'fulfilled') setMyStatuses(mine.value || []);
      } catch (e) {}
    };
    fetchStatuses();
  }, [currentUser]);

  const postStatus = async () => {
    if (postType === 'text' && !text.trim()) return;
    if (postType === 'image' && !imageUrl.trim()) return;
    setPosting(true);
    try {
      await apiFetch('/api/statuses', {
        method: 'POST',
        body: JSON.stringify({ type: postType.toUpperCase(), content: postType === 'text' ? text : imageUrl, backgroundColor: bgColor }),
      });
      setText('');
      setImageUrl('');
      const mine = await apiFetch('/api/statuses/mine');
      setMyStatuses(mine || []);
    } catch (e) { alert('Failed to post status'); }
    setPosting(false);
  };

  const s = {
    wrap: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111b21', color: '#e9edef', overflow: 'hidden' },
    header: { padding: '16px', backgroundColor: '#202c33', borderBottom: '1px solid #222d34', fontSize: '16px', fontWeight: 600 },
    section: { padding: '12px 16px', borderBottom: '1px solid #1e2d35', fontSize: '12px', fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statusItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #1e2d35', cursor: 'pointer' },
    statusAvatar: { width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>Status</div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {/* Post Status */}
        <div style={{ padding: '12px 16px', backgroundColor: '#1a2630', borderBottom: '1px solid #222d34' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button onClick={() => setPostType('text')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'text' ? '#00a884' : '#2a3942', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Type size={13} /> Text</button>
            <button onClick={() => setPostType('image')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'image' ? '#00a884' : '#2a3942', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Image size={13} /> Image</button>
          </div>
          {postType === 'text' ? (
            <>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {BG_COLORS.map((c) => <div key={c} onClick={() => setBgColor(c)} style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: bgColor === c ? '2px solid #fff' : '2px solid transparent' }} />)}
              </div>
              <input type="text" placeholder="What's on your mind?" value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: '8px 10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
            </>
          ) : (
            <input type="url" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ width: '100%', padding: '8px 10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
          )}
          <button onClick={postStatus} disabled={posting} style={{ width: '100%', padding: '8px', backgroundColor: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>{posting ? 'Posting...' : 'Post Status'}</button>
        </div>

        {myStatuses.length > 0 && <>
          <div style={s.section}>My Status</div>
          {myStatuses.map((st) => (
            <div key={st.id} style={s.statusItem}>
              <div style={{ ...s.statusAvatar, backgroundColor: st.backgroundColor || '#2a3942' }}>
                {st.type === 'IMAGE' ? <img src={st.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '11px', color: '#fff', textAlign: 'center', padding: '4px' }}>{st.content?.substring(0, 20)}</span>}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>My Status</div>
                <div style={{ fontSize: '12px', color: '#8696a0' }}>{new Date(st.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
        </>}

        <div style={s.section}>Recent Updates</div>
        {statuses.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>No status updates from contacts</div>
        ) : statuses.map((st) => (
          <div key={st.id} style={s.statusItem}>
            <div style={{ ...s.statusAvatar, backgroundColor: st.backgroundColor || '#2a3942' }}>
              {st.type === 'IMAGE' ? <img src={st.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '11px', color: '#fff', textAlign: 'center', padding: '4px' }}>{st.content?.substring(0, 20)}</span>}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>@{st.username || 'User'}</div>
              <div style={{ fontSize: '12px', color: '#8696a0' }}>{new Date(st.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
