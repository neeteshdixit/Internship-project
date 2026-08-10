import React from 'react';
import {
  MessageSquare, Circle, Phone, Activity, Settings, Sun, Moon, LogOut,
  Search, ArrowDownLeft, ArrowUpRight, Star, Shield, Archive, VolumeX,
  Tag, Wifi, WifiOff, Plus, Image, Type
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { useAnalytics } from '../../hooks/useAnalytics';

const Sidebar = () => {
  const { currentUser, handleLogout, isDemoMode } = useAuth();
  const {
    themeMode, toggleTheme,
    sidebarTab, setSidebarTab,
    showProfileModal, setShowProfileModal,
    chatWallpaper, setChatWallpaper,
    fontSize, setFontSize,
    bubbleStyle, setBubbleStyle,
    setShowTransparencyModal,
    setShowScheduleModal,
    selectedLabelFilter, setSelectedLabelFilter,
  } = useUI();
  const {
    contacts, activeContactId, setActiveContactId,
    searchQuery, setSearchQuery, searchError, setSearchError,
    typingStates, messageClock,
    myStatuses, friendStatuses, isStatusesLoading,
    newStatusCaption, setNewStatusCaption,
    newStatusImg, setNewStatusImg,
    statusType, setStatusType,
    statusTextBg, setStatusTextBg,
    handlePostStatus,
    openStatusViewer,
    callHistory, isCallHistoryLoading,
    privacyData, handleSavePrivacySettings,
    aiSettings, saveAiSettings, aiTransparencyData,
    stompClientRef,
    handleSearchContact,
  } = useChat();
  const { startCall } = useCall();

  // Analytics for active contact (prefetched)
  const activeContact = contacts.find(c => c.id === activeContactId);
  const analyticsQuery = useAnalytics(
    activeContact?.username || activeContact?.name,
    sidebarTab === 'analytics' && Boolean(activeContact && !activeContact.isAi && !activeContact.isNotes)
  );
  const analyticsData = analyticsQuery.data;
  const isAnalyticsLoading = analyticsQuery.isLoading;

  const getCallIcon = (direction) => direction === 'incoming'
    ? <ArrowDownLeft size={16} />
    : <ArrowUpRight size={16} />;

  const getStatusLabel = (status) => {
    const labels = { missed: 'Missed Call', rejected: 'Rejected', cancelled: 'Cancelled', busy: 'Busy', no_answer: 'No Answer', offline: 'Offline', failed: 'Failed', connected: 'Call completed' };
    return labels[status] || status;
  };

  const fmtDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isExpiredMsg = (m, now) => {
    if (!m?.expiresAt) return false;
    return new Date(m.expiresAt).getTime() <= now;
  };

  const filteredContacts = (contacts || []).filter(c => {
    if (!c) return false;
    const lowerQuery = (searchQuery || '').toLowerCase();
    const nameStr = c.name || c.username || '';
    const matchesSearch = nameStr.toLowerCase().includes(lowerQuery)
      || (c.username && c.username.toLowerCase().includes(lowerQuery))
      || (c.phoneNumber && String(c.phoneNumber).includes(searchQuery));
    if (!matchesSearch) return false;
    if (selectedLabelFilter === 'ALL') return !c.isArchived;
    if (selectedLabelFilter === 'FAVORITES') return c.isFavorite && !c.isArchived;
    if (selectedLabelFilter === 'ARCHIVED') return c.isArchived;
    if (selectedLabelFilter === 'BLOCKED') return c.isBlocked;
    if (selectedLabelFilter === 'MUTED') return c.isMuted;
    return c.label === selectedLabelFilter;
  });

  const LABEL_FILTERS = ['ALL', 'FAVORITES', 'ARCHIVED', 'BLOCKED', 'MUTED', 'WORK', 'PERSONAL', 'FAMILY'];

  return (
    <div className="sidebar-panel" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ─── NAV RAIL ─── */}
      <div className="nav-rail" style={{ width: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px', borderRight: '1px solid var(--border-color)', background: 'var(--sidebar-bg)' }}>
        <div style={{ marginBottom: '16px', cursor: 'pointer' }} onClick={() => setShowProfileModal(true)}>
          <img src={currentUser?.profilePicUrl || '/image.png'} alt="me" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
        </div>

        {[
          { id: 'chats', Icon: MessageSquare, label: 'Chats' },
          { id: 'status', Icon: Circle, label: 'Status' },
          { id: 'calls', Icon: Phone, label: 'Calls' },
          { id: 'analytics', Icon: Activity, label: 'Analytics' },
          { id: 'settings', Icon: Settings, label: 'Settings' },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setSidebarTab(id)}
            title={label}
            className={`nav-rail-btn ${sidebarTab === id ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', color: sidebarTab === id ? 'var(--accent)' : 'var(--text-secondary)', transition: 'all 0.2s' }}
          >
            <Icon size={22} />
          </button>
        ))}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={toggleTheme} title="Toggle Theme" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => handleLogout(stompClientRef)} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* ─── MAIN SIDEBAR PANEL ─── */}
      <div style={{ width: '360px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', background: 'var(--sidebar-bg)' }}>

        {/* ─── CHATS TAB ─── */}
        {sidebarTab === 'chats' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700 }}>Chats</h2>

              {/* Search */}
              <form onSubmit={(e) => handleSearchContact(e, searchQuery, setSearchQuery, setSearchError)} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search or add by phone..."
                    style={{ width: '100%', padding: '8px 8px 8px 34px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Find</button>
              </form>
              {searchError && <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '6px 0 0' }}>{searchError}</p>}

              {/* Label Filters */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingTop: '10px', scrollbarWidth: 'none' }}>
                {LABEL_FILTERS.map(f => (
                  <button key={f} onClick={() => setSelectedLabelFilter(f)}
                    style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 600, background: selectedLabelFilter === f ? 'var(--accent)' : 'var(--input-bg)', color: selectedLabelFilter === f ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredContacts.map(contact => {
                const lastMsg = contact.messages?.filter(m => !isExpiredMsg(m, messageClock))?.slice(-1)[0];
                const isActive = activeContactId === contact.id;
                const peerTyping = typingStates[contact.username || contact.name];
                return (
                  <div key={contact.id} onClick={() => setActiveContactId(contact.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: isActive ? 'var(--hover-bg)' : 'transparent', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={contact.avatar || '/image.png'} alt={contact.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                      {contact.isOnline && <span style={{ position: 'absolute', bottom: 2, right: 2, width: '11px', height: '11px', borderRadius: '50%', background: '#00e676', border: '2px solid var(--sidebar-bg)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contact.name}
                          {contact.isPinned && ' 📌'}
                          {contact.isMuted && ' 🔕'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{lastMsg?.timestamp || ''}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: peerTyping === 'typing' ? 'var(--accent)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {peerTyping === 'typing' ? 'typing...' : (lastMsg?.text || contact.statusText || '')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STATUS TAB ─── */}
        {sidebarTab === 'status' && (
          <div style={{ padding: '16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700 }}>Status</h2>

            {/* Post Status */}
            <form onSubmit={handlePostStatus} style={{ background: 'var(--input-bg)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {['text', 'image'].map(t => (
                  <button key={t} type="button" onClick={() => setStatusType(t)}
                    style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: statusType === t ? 'var(--accent)' : 'var(--border-color)', color: statusType === t ? '#fff' : 'var(--text-secondary)', fontSize: '12px' }}>
                    {t === 'text' ? <><Type size={12} style={{ marginRight: '4px' }} />Text</> : <><Image size={12} style={{ marginRight: '4px' }} />Image</>}
                  </button>
                ))}
              </div>
              {statusType === 'image' && (
                <input value={newStatusImg} onChange={e => setNewStatusImg(e.target.value)} placeholder="Image URL..." style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--sidebar-bg)', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
              )}
              <input value={newStatusCaption} onChange={e => setNewStatusCaption(e.target.value)} placeholder={statusType === 'text' ? "What's on your mind?" : 'Caption...'} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--sidebar-bg)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' }} />
              <button type="submit" style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Post Status
              </button>
            </form>

            {/* My Status */}
            {myStatuses.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase' }}>My Status</p>
                {myStatuses.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={s.image || s.avatar || '/image.png'} alt="status" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div><p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>My Status</p><p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{s.caption}</p></div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends' Statuses */}
            {isStatusesLoading ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading...</p> : (
              friendStatuses.map(group => (
                <div key={group.username} onClick={() => openStatusViewer(group)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={group.avatar || '/image.png'} alt={group.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{group.username}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{group.updates.length} update{group.updates.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── CALLS TAB ─── */}
        {sidebarTab === 'calls' && (
          <div style={{ padding: '16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700 }}>Recent Calls</h2>
            {isCallHistoryLoading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading...</p>
            ) : callHistory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No call history</p>
            ) : (
              callHistory.map(call => (
                <div key={call.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: call.status === 'missed' ? '#ff4d4f' : 'var(--accent)', flexShrink: 0 }}>
                    {getCallIcon(call.direction || 'outgoing')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{call.peerUsername || call.receiverUsername}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {getStatusLabel(call.status)} · {call.callType} · {fmtDuration(call.durationSeconds)}
                    </p>
                  </div>
                  <button onClick={() => startCall(call.callType === 'VIDEO' ? 'video' : 'audio')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
                    <Phone size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── ANALYTICS TAB ─── */}
        {sidebarTab === 'analytics' && (
          <div style={{ padding: '16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700 }}>Analytics</h2>
            {!activeContact ? (
              <p style={{ color: 'var(--text-secondary)' }}>Select a contact to view analytics.</p>
            ) : isAnalyticsLoading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading analytics...</p>
            ) : !analyticsData ? (
              <p style={{ color: 'var(--text-secondary)' }}>No analytics available for this contact.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Total Messages', value: analyticsData.totalMessages },
                  { label: 'Messages Sent', value: analyticsData.messagesSent },
                  { label: 'Messages Received', value: analyticsData.messagesReceived },
                  { label: 'Avg. Response Time', value: analyticsData.avgResponseTime },
                  { label: 'Most Active Hour', value: analyticsData.mostActiveHour },
                ].map(({ label, value }) => value !== undefined && (
                  <div key={label} style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {sidebarTab === 'settings' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Settings</h2>

            {/* Appearance */}
            <div style={{ background: 'var(--input-bg)', borderRadius: '12px', padding: '14px' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Appearance</p>
              <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Chat Wallpaper</label>
              <select value={chatWallpaper} onChange={e => setChatWallpaper(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '10px' }}>
                {['default', 'teal', 'blue', 'purple', 'sunset', 'minimal'].map(w => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
              </select>
              <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Font Size</label>
              <select value={fontSize} onChange={e => setFontSize(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}>
                {['small', 'medium', 'large'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>

            {/* Privacy */}
            <div style={{ background: 'var(--input-bg)', borderRadius: '12px', padding: '14px' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Privacy</p>
              {privacyData && (
                <>
                  {[
                    { label: 'Last Seen', key: 'lastSeenVisibility', val: privacyData.lastSeenVisibility },
                    { label: 'Online Status', key: 'onlineVisibility', val: privacyData.onlineVisibility },
                    { label: 'Profile Photo', key: 'profilePhotoVisibility', val: privacyData.profilePhotoVisibility },
                  ].map(({ label, key, val }) => (
                    <div key={key} style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{label}</label>
                      <select defaultValue={val}
                        onChange={e => handleSavePrivacySettings({ ...privacyData, [key]: e.target.value })}
                        style={{ width: '100%', padding: '7px', borderRadius: '8px', background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}>
                        {['EVERYONE', 'CONTACTS', 'NOBODY'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={privacyData.readReceipts || false}
                      onChange={e => handleSavePrivacySettings({ ...privacyData, readReceipts: e.target.checked })} />
                    Read Receipts
                  </label>
                </>
              )}
              <button onClick={() => setShowTransparencyModal(true)}
                style={{ marginTop: '10px', width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                <Shield size={14} style={{ marginRight: '6px' }} /> AI Transparency Report
              </button>
            </div>

            {/* AI Settings */}
            {aiSettings && (
              <div style={{ background: 'var(--input-bg)', borderRadius: '12px', padding: '14px' }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AI Settings</p>
                {[
                  { key: 'preferLocalProcessing', label: 'Prefer Local Processing' },
                  { key: 'disableCloudAi', label: 'Disable Cloud AI' },
                  { key: 'askPermissionEveryTime', label: 'Ask Permission Before Cloud' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <input type="checkbox" checked={aiSettings[key] || false}
                      onChange={e => saveAiSettings({ ...aiSettings, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
