import React, { useState, useEffect } from 'react';
import { X, Star, Trash2 } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiFetch';

export default function StarredModal() {
  const { closeModal } = useUI();
  const { currentUser } = useAuth();
  const [starredMessages, setStarredMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchStarred = async () => {
      try {
        const data = await apiFetch(`/api/messages/starred/${currentUser.username}`);
        setStarredMessages(data || []);
      } catch (e) {
        setStarredMessages([]);
      }
      setLoading(false);
    };
    fetchStarred();
  }, [currentUser]);

  const handleUnstar = async (msgId) => {
    try {
      await apiFetch(`/api/messages/${msgId}/star`, { method: 'PUT', body: JSON.stringify({ starred: false }) });
      setStarredMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (e) {}
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('starred')}>
      <div style={{ width: 'min(440px, calc(100vw - 24px))', maxHeight: 'min(520px, calc(100dvh - 32px))', backgroundColor: '#202c33', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Star size={18} color="#f59e0b" fill="#f59e0b" /> Starred Messages
          </div>
          <button onClick={() => closeModal('starred')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#8696a0', padding: '30px' }}>Loading starred messages...</div>
          ) : starredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 20px', fontSize: '13px' }}>
              <Star size={32} color="#2a3942" style={{ marginBottom: '8px' }} />
              <div>No starred messages yet.</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Hover over any message and click the star icon to save it here.</div>
            </div>
          ) : (
            starredMessages.map((msg) => (
              <div key={msg.id} style={{ backgroundColor: '#2a3942', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#00a884' }}>~{msg.senderUsername}</span>
                  <span style={{ fontSize: '10px', color: '#8696a0' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#e9edef', wordBreak: 'break-word' }}>{msg.content}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button onClick={() => handleUnstar(msg.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
