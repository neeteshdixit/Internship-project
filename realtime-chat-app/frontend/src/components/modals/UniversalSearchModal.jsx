import React, { useState } from 'react';
import { X, Search, Image, Video, FileText, Link2, Calendar, User, ArrowRight } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function UniversalSearchModal() {
  const { closeModal } = useUI();
  const { contacts, messages, selectContact } = useChat();

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'IMAGE' | 'VIDEO' | 'DOC' | 'LINK'
  const [selectedSender, setSelectedSender] = useState('');

  // Collect all messages across all conversations
  const allMessagesList = [];
  Object.keys(messages).forEach((chatKey) => {
    (messages[chatKey] || []).forEach((m) => {
      allMessagesList.push({ ...m, _chatKey: chatKey });
    });
  });

  const filteredResults = allMessagesList.filter((m) => {
    const text = (m.content || m.text || '').toLowerCase();
    const q = query.toLowerCase().trim();

    // 1. Text match
    if (q && !text.includes(q) && !(m.fileName || '').toLowerCase().includes(q)) {
      return false;
    }

    // 2. Type filter
    if (selectedType === 'IMAGE' && m.mediaType !== 'IMAGE') return false;
    if (selectedType === 'VIDEO' && m.mediaType !== 'VIDEO') return false;
    if (selectedType === 'DOC' && m.mediaType !== 'DOCUMENT' && m.mediaType !== 'FILE') return false;
    if (selectedType === 'LINK' && !text.includes('http')) return false;

    // 3. Sender filter
    if (selectedSender && (m.senderUsername || '').toLowerCase() !== selectedSender.toLowerCase()) {
      return false;
    }

    return true;
  });

  const handleJumpToChat = (msg) => {
    const sender = msg.senderUsername;
    const targetContact = contacts.find((c) => (c.username || c.name) === sender || (msg.groupId && c.id === msg.groupId));
    if (targetContact) {
      selectContact(targetContact);
      closeModal('universalSearch');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('universalSearch')}>
      <div style={{ width: '560px', maxHeight: '620px', backgroundColor: '#202c33', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Search size={18} color="#00a884" /> Universal Search 2.0
          </div>
          <button onClick={() => closeModal('universalSearch')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Search Bar & Filter Chips */}
        <div style={{ padding: '12px 16px', backgroundColor: '#111b21', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#202c33', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px' }}>
            <Search size={16} color="#8696a0" />
            <input
              type="text"
              placeholder="Search across all messages, documents, links..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#e9edef', fontSize: '13px', outline: 'none', marginLeft: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['ALL', 'IMAGE', 'VIDEO', 'DOC', 'LINK'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: selectedType === t ? 'none' : '1px solid #2a3942',
                  backgroundColor: selectedType === t ? '#00a884' : 'transparent',
                  color: selectedType === t ? '#fff' : '#8696a0',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8696a0', marginBottom: '8px', textTransform: 'uppercase' }}>
            Found {filteredResults.length} Matches
          </div>

          {filteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 20px', fontSize: '13px' }}>
              No messages found matching your search.
            </div>
          ) : (
            filteredResults.map((msg, i) => (
              <div
                key={i}
                onClick={() => handleJumpToChat(msg)}
                style={{
                  backgroundColor: '#2a3942',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#00a884' }}>~{msg.senderUsername || 'User'}</span>
                    <span style={{ fontSize: '10px', color: '#8696a0' }}>{new Date(msg.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.content || msg.text || (msg.mediaUrl ? `[Media: ${msg.mediaType}]` : '')}
                  </div>
                </div>
                <ArrowRight size={16} color="#8696a0" style={{ marginLeft: '10px', flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
