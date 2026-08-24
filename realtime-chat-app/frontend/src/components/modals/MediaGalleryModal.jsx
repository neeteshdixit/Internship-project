import React, { useState } from 'react';
import { X, Image, FileText, Link2, Download, Search } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function MediaGalleryModal() {
  const { closeModal } = useUI();
  const { selectedContact, messages, getChatKey } = useChat();
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'docs' | 'links'
  const [filterQuery, setFilterQuery] = useState('');

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const chatMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  const mediaItems = chatMessages.filter((m) => m.mediaUrl && (m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO' || m.messageType === 'IMAGE' || m.messageType === 'VIDEO'));
  const docItems = chatMessages.filter((m) => m.mediaUrl && (m.mediaType === 'DOCUMENT' || m.mediaType === 'FILE' || m.messageType === 'DOCUMENT'));
  const linkItems = chatMessages.filter((m) => {
    const text = m.content || m.text || '';
    return text.includes('http://') || text.includes('https://') || text.includes('www.');
  });

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('mediaGallery')}>
      <div style={{ width: 'min(480px, calc(100vw - 24px))', maxHeight: 'min(560px, calc(100dvh - 32px))', backgroundColor: '#202c33', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <h3 style={{ color: '#e9edef', fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Media, Docs & Links — @{selectedContact?.username || selectedContact?.name || 'Chat'}
          </h3>
          <button onClick={() => closeModal('mediaGallery')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a3942', backgroundColor: '#111b21' }}>
          <button
            onClick={() => setActiveTab('media')}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'media' ? '2px solid #00a884' : '2px solid transparent', color: activeTab === 'media' ? '#00a884' : '#8696a0', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Image size={15} /> Media ({mediaItems.length})
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'docs' ? '2px solid #00a884' : '2px solid transparent', color: activeTab === 'docs' ? '#00a884' : '#8696a0', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <FileText size={15} /> Docs ({docItems.length})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'links' ? '2px solid #00a884' : '2px solid transparent', color: activeTab === 'links' ? '#00a884' : '#8696a0', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Link2 size={15} /> Links ({linkItems.length})
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'media' && (
            mediaItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px', fontSize: '13px' }}>No photos or videos shared in this chat</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {mediaItems.map((m, i) => (
                  <a key={i} href={m.mediaUrl} target="_blank" rel="noreferrer" style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '1/1', backgroundColor: '#2a3942', display: 'block' }}>
                    {m.mediaType === 'VIDEO' ? (
                      <video src={m.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={m.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </a>
                ))}
              </div>
            )
          )}

          {activeTab === 'docs' && (
            docItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px', fontSize: '13px' }}>No documents shared in this chat</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {docItems.map((m, i) => (
                  <a key={i} href={m.mediaUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#2a3942', borderRadius: '8px', textDecoration: 'none', color: '#e9edef' }}>
                    <FileText size={20} color="#00a884" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fileName || 'Document'}</div>
                      <div style={{ fontSize: '11px', color: '#8696a0' }}>{new Date(m.timestamp).toLocaleDateString()}</div>
                    </div>
                    <Download size={16} color="#8696a0" />
                  </a>
                ))}
              </div>
            )
          )}

          {activeTab === 'links' && (
            linkItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px', fontSize: '13px' }}>No links shared in this chat</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {linkItems.map((m, i) => (
                  <div key={i} style={{ padding: '10px 14px', backgroundColor: '#2a3942', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#53bdeb', wordBreak: 'break-all' }}>{m.content || m.text}</div>
                    <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '4px' }}>~{m.senderUsername} · {new Date(m.timestamp).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
