import React, { useState } from 'react';
import { X, Search, Check, CornerUpRight, Send } from 'lucide-react';

export default function ForwardModal({ isOpen, onClose, message, contacts = [], onForward }) {
  const [search, setSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !message) return null;

  const filteredContacts = contacts.filter((c) => {
    const name = c.customName || c.name || c.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (contact) => {
    const id = contact.id || contact.username;
    if (selectedContacts.some(c => (c.id || c.username) === id)) {
      setSelectedContacts(selectedContacts.filter(c => (c.id || c.username) !== id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleConfirmForward = async () => {
    if (selectedContacts.length === 0) return;
    setIsSending(true);
    try {
      await onForward(selectedContacts, message);
      setSelectedContacts([]);
      onClose();
    } catch (err) {
      console.error('Forward failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '80vh',
          backgroundColor: '#111b21',
          borderRadius: '16px',
          border: '1px solid #222d34',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#202c33',
            borderBottom: '1px solid #2a3942',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <CornerUpRight size={18} color="#00a884" />
            <span>Forward message to</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', backgroundColor: '#182229', borderBottom: '1px solid #222d34', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} color="#8696a0" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#e9edef',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Contacts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>
              No contacts found
            </div>
          ) : (
            filteredContacts.map((c) => {
              const id = c.id || c.username;
              const isSelected = selectedContacts.some(sc => (sc.id || sc.username) === id);
              const avatar = c.avatar || c.profilePicUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';

              return (
                <div
                  key={id}
                  onClick={() => toggleSelect(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(0,168,132,0.1)' : 'transparent',
                    borderBottom: '1px solid #1e2d35',
                  }}
                  onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#182229')}
                  onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={avatar}
                      alt=""
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e9edef' }}>
                        {c.customName || c.name || c.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8696a0' }}>
                        @{c.username || c.name}
                      </div>
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid #8696a0',
                      backgroundColor: isSelected ? '#00a884' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Bar */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #222d34', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#8696a0' }}>
            {selectedContacts.length} selected
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', color: '#8696a0', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedContacts.length === 0 || isSending}
              onClick={handleConfirmForward}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                backgroundColor: selectedContacts.length > 0 && !isSending ? '#00a884' : '#2a3942',
                color: selectedContacts.length > 0 && !isSending ? '#ffffff' : '#8696a0',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: selectedContacts.length > 0 && !isSending ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={15} />
              {isSending ? 'Forwarding...' : `Forward (${selectedContacts.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
