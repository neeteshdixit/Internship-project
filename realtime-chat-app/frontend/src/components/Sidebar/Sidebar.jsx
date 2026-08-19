import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useUI } from '../../context/UIContext';
import { apiFetch } from '../../lib/apiFetch';
import { MessageSquare, Radio, Phone, BarChart2, Settings, Search, Plus, Users, UserPlus, FileText, Image } from 'lucide-react';
import StatusPanel from './StatusPanel';
import CallsPanel from './CallsPanel';
import AnalyticsPanel from './AnalyticsPanel';
import SettingsPanel from './SettingsPanel';

const FILTERS = ['ALL', 'FAVORITES', 'ARCHIVED', 'BLOCKED', 'MUTED', 'WORK', 'PERSONAL', 'FAMILY'];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { contacts, selectedContact, selectContact, typingUsers, onlineUsers, unreadCounts, updateContactAttribute, messages, getChatKey } = useChat();
  const { activePanel, setActivePanel, toggleModal } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showAddContact, setShowAddContact] = useState(false);

  const safeContacts = Array.isArray(contacts) ? contacts : [];

  // Global Search across contacts & message history
  const filteredContacts = safeContacts.filter((c) => {
    if (!c) return false;
    const name = c.customName || c.name || c.username || '';
    const q = (searchQuery || '').toLowerCase();

    // Check contact name / phone match
    const matchesNameOrPhone = name.toLowerCase().includes(q) || (c.phoneNumber && c.phoneNumber.includes(q));

    // Also check if any message text in history matches (Global Search)
    const chatKey = getChatKey(c);
    const chatMsgs = (chatKey && messages[chatKey]) ? messages[chatKey] : [];
    const matchesMessages = q && chatMsgs.some((m) => (m.content || m.text || '').toLowerCase().includes(q));

    const matchesSearch = matchesNameOrPhone || matchesMessages;
    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'FAVORITES': return c.isFavorite;
      case 'ARCHIVED': return c.isArchived;
      case 'BLOCKED': return c.isBlocked;
      case 'MUTED': return c.isMuted;
      case 'WORK': return c.label === 'WORK';
      case 'PERSONAL': return c.label === 'PERSONAL';
      case 'FAMILY': return c.label === 'FAMILY';
      default: return !c.isArchived;
    }
  });

  const NAV_ITEMS = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'status', icon: Radio, label: 'Status' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const styles = {
    sidebar: { width: '360px', minWidth: '360px', height: '100%', backgroundColor: '#111b21', display: 'flex', flexDirection: 'row' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { padding: '12px 16px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222d34' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00a884', cursor: 'pointer' },
    searchBar: { padding: '8px 12px', backgroundColor: '#111b21', borderBottom: '1px solid #1e2d35' },
    searchWrap: { display: 'flex', alignItems: 'center', backgroundColor: '#202c33', padding: '6px 12px', borderRadius: '8px' },
    searchInput: { width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e9edef', fontSize: '13px', marginLeft: '8px' },
    filterBar: { display: 'flex', gap: '6px', padding: '6px 12px', overflowX: 'auto', backgroundColor: '#111b21', borderBottom: '1px solid #1e2d35' },
    filterChip: (active) => ({ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: active ? 'none' : '1px solid #2a3942', backgroundColor: active ? '#00a884' : 'transparent', color: active ? '#fff' : '#8696a0', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }),
    contactList: { flex: 1, overflowY: 'auto' },
    contactItem: (isSelected) => ({ display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', backgroundColor: isSelected ? '#2a3942' : 'transparent', borderBottom: '1px solid #1e2d35', transition: 'background 0.15s', borderLeft: isSelected ? '3px solid #00a884' : '3px solid transparent' }),
    footer: { padding: '10px 14px', backgroundColor: '#202c33', borderTop: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

  if (activePanel === 'status') return <div style={styles.sidebar}><NavRail items={NAV_ITEMS} active={activePanel} setActive={setActivePanel} /><StatusPanel /></div>;
  if (activePanel === 'calls') return <div style={styles.sidebar}><NavRail items={NAV_ITEMS} active={activePanel} setActive={setActivePanel} /><CallsPanel /></div>;
  if (activePanel === 'analytics') return <div style={styles.sidebar}><NavRail items={NAV_ITEMS} active={activePanel} setActive={setActivePanel} /><AnalyticsPanel /></div>;
  if (activePanel === 'settings') return <div style={styles.sidebar}><NavRail items={NAV_ITEMS} active={activePanel} setActive={setActivePanel} /><SettingsPanel /></div>;

  return (
    <div style={styles.sidebar}>
      <NavRail items={NAV_ITEMS} active={activePanel} setActive={setActivePanel} />
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => toggleModal('profile', true)}>
            <img src={currentUser?.profilePicUrl || currentUser?.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser?.username || 'U') + '&background=00a884&color=fff'} alt="Profile" style={styles.avatar} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e9edef' }}>{currentUser?.username || 'User'}</div>
              <div style={{ fontSize: '11px', color: '#00a884', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00a884', display: 'inline-block' }}></span> Online
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => toggleModal('group', true)} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="New Group"><Users size={18} /></button>
            <button onClick={() => setShowAddContact(true)} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Add Contact"><UserPlus size={18} /></button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={styles.searchBar}>
          <div style={styles.searchWrap}>
            <Search size={15} color="#8696a0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div style={styles.filterBar}>
          {FILTERS.map((f) => (
            <button key={f} style={styles.filterChip(activeFilter === f)} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Contacts */}
        <div style={styles.contactList}>
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>
              {activeFilter !== 'ALL' ? `No ${activeFilter.toLowerCase()} contacts` : 'No conversations found.'}<br />
              <span style={{ color: '#00a884', cursor: 'pointer', marginTop: '8px', display: 'block' }} onClick={() => setShowAddContact(true)}>+ Add contact to start chatting</span>
            </div>
          ) : filteredContacts.map((contact) => {
            const isSelected = selectedContact?.id === contact.id && selectedContact?.username === contact.username;
            const displayName = contact.customName || contact.name || contact.username || 'Contact';
            const rawName = contact.username || contact.name || '';
            const isOnline = onlineUsers.has(rawName.toLowerCase()) || contact.isOnline;
            const isTyping = rawName && typingUsers[rawName.toLowerCase()];
            const chatKeyParts = [(currentUser?.username || '').toLowerCase(), rawName.toLowerCase()].filter(Boolean).sort();
            const chatKey = contact.isGroup ? `group:${contact.id}` : `direct:${chatKeyParts.join('|')}`;
            const unread = unreadCounts[chatKey] || 0;

            // Check if there is an unsent draft message
            const draftText = localStorage.getItem(`draft_${contact.id || contact.username}`);

            return (
              <div key={contact.id || contact.username} onClick={() => selectContact(contact)} style={styles.contactItem(isSelected)}>
                <div style={{ position: 'relative', marginRight: '12px', flexShrink: 0 }}>
                  <img
                    src={contact.avatar || contact.profilePicUrl || contact.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2a3942&color=aebac1&size=44`}
                    alt={displayName}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {isOnline && <span style={{ position: 'absolute', bottom: 1, right: 1, width: '10px', height: '10px', backgroundColor: '#00a884', borderRadius: '50%', border: '2px solid #111b21' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                      {contact.isPinned && <span title="Pinned" style={{ fontSize: '10px' }}>📌</span>}
                      {contact.isMuted && <span title="Muted" style={{ fontSize: '10px' }}>🔕</span>}
                      {contact.isFavorite && <span title="Favorite" style={{ fontSize: '10px' }}>⭐</span>}
                      {contact.isGroup && <span style={{ fontSize: '9px', backgroundColor: '#2a3942', color: '#8696a0', padding: '1px 5px', borderRadius: '8px', flexShrink: 0 }}>GROUP</span>}
                    </div>
                    {unread > 0 && <span style={{ backgroundColor: '#00a884', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '1px 6px', flexShrink: 0 }}>{unread}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: isTyping ? '#00a884' : draftText ? '#00a884' : '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: (isTyping || draftText) ? 'italic' : 'normal' }}>
                    {isTyping ? 'typing...' : draftText ? `Draft: ${draftText}` : (contact.lastMessage || (contact.isGroup ? 'Group chat' : 'Tap to start chatting'))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={{ fontSize: '11px', color: '#8696a0' }}>🔒 End-to-end encrypted</span>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && <AddContactInline onClose={() => setShowAddContact(false)} />}
    </div>
  );
}

function NavRail({ items, active, setActive }) {
  return (
    <div style={{ width: '60px', backgroundColor: '#1a2630', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', gap: '2px', borderRight: '1px solid #222d34' }}>
      {items.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => setActive(id)} title={label} style={{ background: active === id ? '#2a3942' : 'transparent', border: 'none', color: active === id ? '#00a884' : '#8696a0', cursor: 'pointer', padding: '8px 6px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '52px', transition: 'all 0.15s' }}>
          <Icon size={18} />
          <span style={{ fontSize: '9px', fontWeight: 600 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function AddContactInline({ onClose }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { refreshContacts } = useChat();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      setResult(data);
    } catch (e) { setResult(null); alert('User not found'); }
    setLoading(false);
  };

  const add = async () => {
    if (!result) return;
    try {
      await apiFetch('/api/contacts', { method: 'POST', body: JSON.stringify({ phoneNumber: result.phoneNumber || query }) });
      await refreshContacts();
      onClose();
    } catch (e) { alert('Failed to add contact'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: '#202c33', borderRadius: '12px', padding: '24px', width: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#e9edef', marginBottom: '16px', fontSize: '16px' }}>Add Contact</h3>
        <input type="text" placeholder="Username or phone number" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />
        <button onClick={search} disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: '10px' }}>{loading ? 'Searching...' : 'Search'}</button>
        {result && (
          <div style={{ backgroundColor: '#2a3942', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#e9edef', fontSize: '14px' }}>@{result.username}</span>
            <button onClick={add} style={{ backgroundColor: '#00a884', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Add</button>
          </div>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '8px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', marginTop: '8px' }}>Cancel</button>
      </div>
    </div>
  );
}
