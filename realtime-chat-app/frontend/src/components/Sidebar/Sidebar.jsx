import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useUI } from '../../context/UIContext';
import { MessageSquare, Phone, Users, Settings, Search, Plus } from 'lucide-react';

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { contacts, selectedContact, selectContact } = useChat();
  const { activePanel, setActivePanel, toggleModal } = useUI();
  const [searchQuery, setSearchQuery] = useState('');

  // Safe search filter for contacts
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const filteredContacts = safeContacts.filter((c) => {
    if (!c) return false;
    const name = c.customName || c.name || c.username || '';
    return name.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  return (
    <div className="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col text-white select-none" style={{ width: '340px', minWidth: '340px', height: '100%', backgroundColor: '#111b21', borderRight: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Sidebar Header */}
      <div className="p-4 bg-gray-850 flex items-center justify-between border-b border-gray-800" style={{ padding: '12px 16px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222d34' }}>
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => toggleModal('profile', true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img
            src={currentUser?.profilePicUrl || currentUser?.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Profile"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #00a884' }}
          />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e9edef', margin: 0 }}>{currentUser?.username || 'User'}</h3>
            <span style={{ fontSize: '11px', color: '#00a884', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00a884', display: 'inline-block' }}></span> Online
            </span>
          </div>
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#aebac1' }}>
          <button
            onClick={() => setActivePanel('chats')}
            style={{ background: 'transparent', border: 'none', color: activePanel === 'chats' ? '#00a884' : '#aebac1', cursor: 'pointer', padding: '6px' }}
            title="Chats"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => toggleModal('group', true)}
            style={{ background: 'transparent', border: 'none', color: '#aebac1', cursor: 'pointer', padding: '6px' }}
            title="New Group"
          >
            <Users size={18} />
          </button>
          <button
            onClick={() => toggleModal('profile', true)}
            style={{ background: 'transparent', border: 'none', color: '#aebac1', cursor: 'pointer', padding: '6px' }}
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div style={{ padding: '8px 12px', backgroundColor: '#111b21', borderBottom: '1px solid #222d34' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#202c33', padding: '6px 12px', borderRadius: '8px', border: '1px solid #2a3942' }}>
          <Search size={16} color="#8696a0" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e9edef', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* 3. Contacts / Chats List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredContacts.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>
            No conversations yet.<br />Click the group icon above to start chatting!
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedContact?.id === contact.id;
            const displayName = contact.customName || contact.name || contact.username || 'Contact';
            return (
              <div
                key={contact.id || Math.random()}
                onClick={() => selectContact(contact)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#2a3942' : 'transparent',
                  borderBottom: '1px solid #222d34',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ position: 'relative', marginRight: '12px' }}>
                  <img
                    src={contact.avatar || contact.profilePicUrl || contact.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                    alt={displayName}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {contact.isOnline && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#00a884', borderRadius: '50%', border: '2px solid #111b21' }}></span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#e9edef', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</h4>
                    <span style={{ fontSize: '11px', color: '#8696a0' }}>Active</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#8696a0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.isGroup ? 'Group Chat' : (contact.phoneNumber || 'Tap to chat...')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Quick logout or status info */}
      <div className="p-3 bg-gray-850 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
        <span>Secure E2E Chat</span>
        <button onClick={logout} className="text-red-400 hover:underline font-medium">
          Logout
        </button>
      </div>
    </div>
  );
}