import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { encryptPayload, decryptPayload } from '../crypto/cryptoEngine';
import { apiFetch, API_BASE_URL } from '../lib/apiFetch';
import { useContacts, CONTACTS_KEYS } from '../hooks/useContacts';
import { useCallHistory, CALL_HISTORY_KEY } from '../hooks/useCallHistory';
import { useStatuses, STATUS_KEYS } from '../hooks/useStatuses';
import { usePrivacySettings, PRIVACY_KEY } from '../hooks/usePrivacySettings';
import { useAiSettings, AI_SETTINGS_KEY, AI_TRANSPARENCY_KEY } from '../hooks/useAiSettings';

// --- Pure utility functions ---

const normalizeChatIdentity = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
};

const pushUniqueCandidate = (list, candidate) => {
  if (candidate === undefined || candidate === '') return;
  const normalized = String(candidate).trim();
  if (!normalized) return;
  if (!list.includes(normalized)) list.push(normalized);
};

export const buildDirectChatKey = (participantA, participantB) => {
  const participants = [normalizeChatIdentity(participantA), normalizeChatIdentity(participantB)]
    .filter(Boolean).sort();
  return participants.length ? `direct:${participants.join('|')}` : '';
};

export const buildDirectChatCandidates = (peerUsername, currentUsername) => {
  const candidates = [];
  pushUniqueCandidate(candidates, buildDirectChatKey(currentUsername, peerUsername));
  pushUniqueCandidate(candidates, peerUsername);
  pushUniqueCandidate(candidates, normalizeChatIdentity(peerUsername));
  pushUniqueCandidate(candidates, currentUsername);
  pushUniqueCandidate(candidates, normalizeChatIdentity(currentUsername));
  return candidates;
};

export const buildGroupChatKey = (groupId) => {
  const normalized = normalizeChatIdentity(groupId);
  return normalized ? `group:${normalized}` : '';
};

export const buildGroupChatCandidates = (groupId) => {
  const candidates = [];
  pushUniqueCandidate(candidates, buildGroupChatKey(groupId));
  candidates.push(null);
  return candidates;
};

export const getConversationVanishConfig = (contact, currentUsername) => {
  if (!contact || !currentUsername) return null;
  if (contact.isGroup) {
    if (contact.groupId === null || contact.groupId === undefined) return null;
    return {
      conversationKey: buildGroupChatKey(contact.groupId),
      endpoint: `${API_BASE_URL}/api/vanish-mode/group/${contact.groupId}`,
      groupId: contact.groupId,
      peerUsername: null
    };
  }
  const peerUsername = contact.username || contact.name || '';
  if (!peerUsername) return null;
  return {
    conversationKey: buildDirectChatKey(currentUsername, peerUsername),
    endpoint: `${API_BASE_URL}/api/vanish-mode/direct/${encodeURIComponent(peerUsername)}`,
    groupId: null,
    peerUsername
  };
};

export const getMessageExpiryTimestamp = (msg) => {
  if (!msg) return null;
  if (msg.expiresAt) {
    const parsed = new Date(msg.expiresAt).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (!msg.selfDestructSeconds) return null;
  const baseTime = msg.readAt ? new Date(msg.readAt).getTime() : null;
  return Number.isNaN(baseTime) || baseTime === null ? null : baseTime + (msg.selfDestructSeconds * 1000);
};

export const isExpiredMessage = (msg, now = Date.now()) => {
  const expiry = getMessageExpiryTimestamp(msg);
  return expiry !== null && expiry <= now;
};

export const applyLocalVanishExpiry = (msg, referenceTime = Date.now()) => {
  if (!msg || !msg.selfDestructSeconds || msg.expiresAt) return msg;
  const readAt = msg.readAt || new Date(referenceTime).toISOString();
  const readTime = new Date(readAt).getTime();
  if (Number.isNaN(readTime)) return msg;
  return { ...msg, readAt, expiresAt: new Date(readTime + (msg.selfDestructSeconds * 1000)).toISOString() };
};

// --- Context ---

const ChatContext = createContext(null);

export const ChatProvider = ({ children, currentUser, isAuthenticated, isDemoMode, callContextRef }) => {
  // React Query
  const queryClient = useQueryClient();

  // ── Contacts: local state (populated by useContacts + WebSocket updates) ──
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messageClock, setMessageClock] = useState(Date.now());
  const [typingStates, setTypingStates] = useState({});
  const [messageInput, setMessageInput] = useState('');
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tactical_offline_queue') || '[]'); } catch (e) { return []; }
  });

  // ── React Query: Contacts (initial load from REST) ──
  const contactsQuery = useContacts(currentUser, isAuthenticated && !isDemoMode);
  useEffect(() => {
    if (contactsQuery.data && contacts.length === 0) {
      setContacts(contactsQuery.data);
    }
  }, [contactsQuery.data]);

  // ── React Query: Call History ──
  const callHistoryQuery = useCallHistory(isAuthenticated && !isDemoMode);

  // ── React Query: Statuses ──
  const statusesQuery = useStatuses(currentUser, isAuthenticated && !isDemoMode);
  const myStatuses = statusesQuery.data?.myStatuses || [];
  const friendStatuses = statusesQuery.data?.friendStatuses || [];

  // ── React Query: Privacy Settings ──
  const privacyQuery = usePrivacySettings(isAuthenticated && !isDemoMode);
  const privacyData = privacyQuery.data || {};

  // ── React Query: AI Settings ──
  const aiSettingsQuery = useAiSettings(isAuthenticated && !isDemoMode);
  const aiSettings = aiSettingsQuery.data || {
    preferredProvider: 'AUTO', askPermissionEveryTime: true,
    alwaysAllowCloud: false, disableCloudAi: false, preferLocalProcessing: true,
    neverAutomaticallySendToCloud: true, showPrivacyNoticeBeforeCloud: true
  };

  // ── Local-only UI state ──
  const [latestAiReport, setLatestAiReport] = useState(null);
  const [viewingStatusGroup, setViewingStatusGroup] = useState(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [newStatusCaption, setNewStatusCaption] = useState('');
  const [newStatusImg, setNewStatusImg] = useState('');
  const [statusType, setStatusType] = useState('text');
  const [statusTextBg, setStatusTextBg] = useState('#00a884');

  // Vanish mode
  const [disappearingModes, setDisappearingModes] = useState({});
  const [disappearingTimers, setDisappearingTimers] = useState({});
  const [disappearingModeOwners, setDisappearingModeOwners] = useState({});
  const [isScreenBlurred, setIsScreenBlurred] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(null);

  // Refs
  const stompClientRef = useRef(null);
  const messageEndRef = useRef(null);
  const aiChatEndRef = useRef(null);
  const activeContactIdRef = useRef(activeContactId);
  const contactsRef = useRef(contacts);
  const typingTimeoutRef = useRef(null);
  const vanishModeSyncRef = useRef('');

  useEffect(() => { activeContactIdRef.current = activeContactId; }, [activeContactId]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  // Message expiry clock
  useEffect(() => {
    const interval = setInterval(() => setMessageClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Expire messages using clock
  useEffect(() => {
    setContacts(prev => {
      let changed = false;
      const next = prev.map(contact => {
        if (!contact.messages || contact.messages.length === 0) return contact;
        const filteredMessages = contact.messages.filter(msg => !isExpiredMessage(msg, messageClock));
        if (filteredMessages.length !== contact.messages.length) { changed = true; return { ...contact, messages: filteredMessages }; }
        return contact;
      });
      return changed ? next : prev;
    });
  }, [messageClock]);

  // Scroll chat to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContactId, contacts]);

  // Anti-screenshot protection for vanish mode
  useEffect(() => {
    const currentActiveContact = contacts.find(c => c.id === activeContactId);
    const vanishConfig = getConversationVanishConfig(currentActiveContact, currentUser?.username);
    const activeVanishKey = vanishConfig?.conversationKey || '';
    const isVanishActive = Boolean(activeVanishKey && disappearingModes[activeVanishKey]);

    if (!isVanishActive) { setIsScreenBlurred(false); document.body.classList.remove('vanish-active'); return; }
    document.body.classList.add('vanish-active');

    const handleKeyDown = (e) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.keyCode === 44;
      const isMacScreenshot = (e.metaKey || e.ctrlKey) && e.shiftKey && ['3','4','5','S','s'].includes(e.key);
      const isPrint = (e.ctrlKey || e.metaKey) && ['p','P'].includes(e.key);
      const isSave = (e.ctrlKey || e.metaKey) && ['s','S'].includes(e.key);
      if (isPrintScreen || isMacScreenshot || isPrint || isSave) {
        e.preventDefault(); e.stopPropagation();
        setIsScreenBlurred(true);
        setTimeout(() => setIsScreenBlurred(false), 2500);
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText('');
        alert('🔒 Vanish Mode Anti-Screenshot Security:\nScreenshots, screen capture shortcuts, and printing are strictly blocked while Vanish Mode is active!');
        return false;
      }
    };
    const handleKeyUp = (e) => { if ((e.key === 'PrintScreen' || e.keyCode === 44) && navigator.clipboard?.writeText) navigator.clipboard.writeText(''); };
    const handleVisibilityChange = () => setIsScreenBlurred(document.hidden);

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.body.classList.remove('vanish-active');
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeContactId, contacts, currentUser, disappearingModes]);

  // Vanish mode sync on contact switch
  useEffect(() => {
    if (!currentUser || isDemoMode || activeContactId === null) return;
    const currentActiveContact = contacts.find(c => c.id === activeContactId);
    if (!currentActiveContact || currentActiveContact.isAi || currentActiveContact.isNotes) return;
    const config = getConversationVanishConfig(currentActiveContact, currentUser.username);
    if (!config?.conversationKey || vanishModeSyncRef.current === config.conversationKey) return;
    vanishModeSyncRef.current = config.conversationKey;
    loadConversationVanishState(currentActiveContact);
  }, [activeContactId, contacts, currentUser, isDemoMode]);

  // Online/offline queue handler
  useEffect(() => {
    const handleOnline = () => {
      const queue = JSON.parse(localStorage.getItem('tactical_offline_queue') || '[]');
      if (queue.length > 0 && stompClientRef.current?.connected) {
        queue.forEach(item => stompClientRef.current.publish({ destination: '/app/chat', body: JSON.stringify(item) }));
        localStorage.removeItem('tactical_offline_queue');
        setOfflineQueue([]);
        alert(`🛰️ Field Network Restored: ${queue.length} offline queued messages transmitted!`);
      }
    };
    const handleOffline = () => {};
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // === VANISH MODE ===
  const applyConversationVanishState = (conversationKey, enabled, enabledByUsername) => {
    if (!conversationKey) return;
    const isEnabled = Boolean(enabled);
    setDisappearingModes(prev => ({ ...prev, [conversationKey]: isEnabled }));
    setDisappearingModeOwners(prev => ({ ...prev, [conversationKey]: isEnabled ? (enabledByUsername || null) : null }));
    if (isEnabled) setDisappearingTimers(prev => ({ ...prev, [conversationKey]: 30 }));
  };

  const loadConversationVanishState = async (contact) => {
    const config = getConversationVanishConfig(contact, currentUser?.username);
    if (!config) return null;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(config.endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) return null;
      const data = await response.json();
      applyConversationVanishState(config.conversationKey, data.enabled, data.enabledByUsername);
      return data;
    } catch (error) { console.error('Error loading vanish mode state:', error); return null; }
  };

  const handleToggleVanishMode = async (contact) => {
    if (!contact || !currentUser) return;
    const config = getConversationVanishConfig(contact, currentUser.username);
    if (!config?.conversationKey) return;
    const currentKey = config.conversationKey;
    const isCurrentlyOn = Boolean(disappearingModes[currentKey]);
    const ownerUsername = disappearingModeOwners[currentKey];
    if (isCurrentlyOn && ownerUsername && ownerUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
      alert(`🚫 Security Restriction:\nOnly ${ownerUsername} (who turned ON Vanish Mode) can turn it off.`); return;
    }
    const targetState = !isCurrentlyOn;
    if (isDemoMode) { applyConversationVanishState(currentKey, targetState, targetState ? currentUser.username : null); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: targetState })
      });
      if (response.ok) {
        const data = await response.json();
        applyConversationVanishState(data.conversationKey, data.enabled, data.enabledByUsername);
      } else {
        const errData = await response.json();
        alert(errData.message || errData.error || 'Failed to update Vanish Mode.');
      }
    } catch (e) { alert('Error connecting to server to update Vanish Mode.'); }
  };

  // === WEBSOCKET ===
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to WebSocket server:', frame);
      client.publish({ destination: '/app/presence/connect', body: currentUser.username });

      client.subscribe('/topic/presence', (message) => {
        const update = JSON.parse(message.body);
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch(`${API_BASE_URL}/api/users/${update.username}/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(profileData => {
            setContacts(prev => prev.map(c => {
              const contactUsername = c.username || c.name || '';
              if (contactUsername.toLowerCase().trim() === update.username.toLowerCase().trim()) {
                return { ...c, avatar: profileData.avatar, statusText: profileData.lastSeen, isOnline: profileData.isOnline, about: profileData.about };
              }
              return c;
            }));
          }).catch(err => console.error('Error updating presence profile:', err));
      });

      client.subscribe(`/topic/typing/${currentUser.username}`, (message) => {
        const typingSignal = JSON.parse(message.body);
        setTypingStates(prev => ({ ...prev, [typingSignal.senderUsername]: typingSignal.status }));
      });

      // Call signals - delegate to CallContext via ref
      client.subscribe(`/topic/calls/${currentUser.username}`, async (message) => {
        const signal = JSON.parse(message.body);
        if (callContextRef?.current) {
          callContextRef.current.handleCallSignal(signal, client, currentUser);
        }
      });

      client.subscribe(`/topic/messages/${currentUser.username}`, async (message) => {
        const received = JSON.parse(message.body);
        const deletedMessageId = received.messageId || received.id;

        if (received.type === 'VANISH_MODE_UPDATED' && received.conversationKey) {
          applyConversationVanishState(received.conversationKey, received.enabled, received.enabledByUsername);
          return;
        }

        if (received.content === 'DELETED' || received.type === 'MESSAGE_DELETED') {
          setContacts(prev => prev.map(contact => ({
            ...contact, messages: contact.messages.filter(m => m.id !== deletedMessageId)
          })));
          return;
        }

        const decryptedContent = received.groupId
          ? await decryptPayload(received.content, received.iv, buildGroupChatCandidates(received.groupId))
          : await decryptPayload(received.content, received.iv, buildDirectChatCandidates(
              received.senderUsername === currentUser.username ? received.receiverUsername : received.senderUsername,
              currentUser.username
            ));

        let formatted = {
          id: received.id, text: decryptedContent,
          sender: received.senderUsername === currentUser.username ? 'me' : 'other',
          senderUsername: received.senderUsername, receiverUsername: received.receiverUsername,
          timestamp: new Date(received.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: received.status, parentMessageId: received.parentMessageId,
          parentMessageText: received.parentMessageText, parentMessageSender: received.parentMessageSender,
          isForwarded: received.isForwarded, isStarred: received.isStarred, isPinned: received.isPinned,
          reactions: received.reactions, isMedia: received.isMedia, mediaUrl: received.mediaUrl,
          mediaType: received.mediaType, fileName: received.fileName, fileSize: received.fileSize,
          messageType: received.messageType, callType: received.callType, callStatus: received.callStatus,
          callDuration: received.callDuration, callStartedAt: received.callStartedAt, callEndedAt: received.callEndedAt,
          selfDestructSeconds: received.selfDestructSeconds, expiresAt: received.expiresAt,
          readAt: received.readAt, isPriority: received.isPriority, latitude: received.latitude, longitude: received.longitude
        };

        const currentActiveContactId = activeContactIdRef.current;
        if (currentActiveContactId) {
          const activeContact = contactsRef.current.find(c => c.id === currentActiveContactId);
          const activeContactUsername = activeContact ? (activeContact.username || activeContact.name || '') : '';
          const isActiveDirectChat = activeContact && !activeContact.isGroup && activeContactUsername.toLowerCase().trim() === received.senderUsername.toLowerCase().trim();
          const isActiveGroupChat = activeContact && activeContact.isGroup && received.groupId && activeContact.groupId === received.groupId;
          if ((isActiveDirectChat || isActiveGroupChat) && formatted.sender !== 'me' && formatted.selfDestructSeconds && !formatted.expiresAt) {
            formatted = applyLocalVanishExpiry(formatted);
          }
        }

        if (received.groupId) {
          formatted.senderUsername = received.senderUsername;
          setContacts(prev => prev.map(contact => {
            if (contact.isGroup && contact.groupId === received.groupId) {
              if (contact.messages.some(m => m.id === formatted.id)) {
                return { ...contact, messages: contact.messages.map(m => m.id === formatted.id ? formatted : m) };
              }
              return { ...contact, messages: [...contact.messages, formatted] };
            }
            return contact;
          }));
        } else {
          const targetContactUsername = received.senderUsername === currentUser.username ? received.receiverUsername : received.senderUsername;
          const contactExists = contactsRef.current.some(c => {
            const cu = c.username || c.name || '';
            return cu.toLowerCase().trim() === targetContactUsername.toLowerCase().trim();
          });

          if (!contactExists) {
            fetch(`${API_BASE_URL}/api/users/${targetContactUsername}/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
              .then(res => res.ok ? res.json() : null)
              .then(profileData => {
                const newContact = {
                  id: profileData ? profileData.id : Date.now(), username: targetContactUsername, name: targetContactUsername,
                  avatar: (profileData && profileData.avatar) ? profileData.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
                  phoneNumber: profileData ? profileData.phoneNumber : '', statusText: (profileData && profileData.lastSeen) ? profileData.lastSeen : 'Offline',
                  isOnline: profileData ? profileData.isOnline : false, messages: [formatted],
                  isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE'
                };
                setContacts(prev => {
                  if (!prev.some(c => (c.username || '').toLowerCase() === targetContactUsername.toLowerCase())) return [newContact, ...prev];
                  return prev;
                });
              }).catch(e => console.error('Error fetching incoming contact profile:', e));
          } else {
            setContacts(prev => prev.map(contact => {
              const contactUsername = contact.username || contact.name || '';
              if (contactUsername.toLowerCase().trim() === targetContactUsername.toLowerCase().trim()) {
                if (contact.messages.some(m => m.id === formatted.id)) {
                  return { ...contact, messages: contact.messages.map(m => m.id === formatted.id ? formatted : m) };
                }
                return { ...contact, messages: [...contact.messages, formatted] };
              }
              return contact;
            }));
          }
        }

        if (currentActiveContactId) {
          const activeContact = contactsRef.current.find(c => c.id === currentActiveContactId);
          const activeContactUsername = activeContact ? (activeContact.username || activeContact.name || '') : '';
          if (activeContact && activeContactUsername.toLowerCase().trim() === received.senderUsername.toLowerCase().trim()) {
            fetch(`${API_BASE_URL}/api/messages/read/${received.senderUsername}`, {
              method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).catch(e => console.error('Error marking msg read:', e));
          }
        }
      });

      client.subscribe(`/topic/messages/read/${currentUser.username}`, (message) => {
        const readReceipt = JSON.parse(message.body);
        setContacts(prev => prev.map(contact => {
          const contactUsername = contact.username || contact.name || '';
          if (contactUsername.toLowerCase().trim() === readReceipt.receiverUsername.toLowerCase().trim()) {
            return {
              ...contact, messages: contact.messages.map(m => {
                if (m.sender !== 'me') return m;
                const updated = { ...m, status: 'read' };
                if (updated.selfDestructSeconds) {
                  const readAt = updated.readAt || new Date().toISOString();
                  const readTime = new Date(readAt).getTime();
                  if (!Number.isNaN(readTime)) { updated.readAt = readAt; updated.expiresAt = updated.expiresAt || new Date(readTime + (updated.selfDestructSeconds * 1000)).toISOString(); }
                }
                return updated;
              })
            };
          }
          return contact;
        }));
      });

      client.subscribe(`/topic/callhistory/${currentUser.username}`, (message) => {
        const entry = JSON.parse(message.body);
        if (callContextRef?.current) {
          callContextRef.current.addCallHistoryEntry(entry);
        }
      });
    };

    client.onStompError = (error) => console.error('STOMP protocol error:', error);
    client.activate();
    stompClientRef.current = client;
    return () => { if (stompClientRef.current) stompClientRef.current.deactivate(); };
  }, [isAuthenticated, currentUser, isDemoMode]);

  // === CONTACTS ===
  const fetchContactsAndPartners = async () => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      let savedContacts = [];
      try { const res = await fetch(`${API_BASE_URL}/api/contacts`, { headers }); if (res.ok) savedContacts = await res.json(); } catch (e) {}
      let partners = [];
      try { const res = await fetch(`${API_BASE_URL}/api/messages/partners/${currentUser.username}`, { headers }); if (res.ok) partners = await res.json(); } catch (e) {}

      const mergedMap = new Map();
      savedContacts.forEach(c => {
        const partnerInfo = partners.find(p => p.id === c.contactUserId);
        const lastMsgArr = partnerInfo?.lastMessage ? [{
          id: `last-${c.contactUserId}`, text: partnerInfo.lastMessage,
          sender: partnerInfo.lastMessageSender === currentUser.username ? 'me' : 'other',
          timestamp: partnerInfo.lastMessageTimestamp ? new Date(partnerInfo.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          messageType: partnerInfo.lastMessageType || 'TEXT', callType: partnerInfo.lastCallType, callStatus: partnerInfo.lastCallStatus, callDuration: partnerInfo.lastCallDuration
        }] : [];
        mergedMap.set(c.contactUserId, { id: c.contactUserId, contactRecordId: c.id, username: c.name, name: c.customName || c.name, avatar: c.avatar, phoneNumber: c.phoneNumber, statusText: 'Offline', isOnline: false, messages: lastMsgArr, isFavorite: c.favorite, isBlocked: c.blocked, isPinned: c.pinned, isArchived: c.archived, isMuted: c.muted, label: c.label || 'NONE' });
      });
      partners.forEach(u => {
        if (!mergedMap.has(u.id)) {
          const lastMsgArr = u.lastMessage ? [{ id: `last-${u.id}`, text: u.lastMessage, sender: u.lastMessageSender === currentUser.username ? 'me' : 'other', timestamp: u.lastMessageTimestamp ? new Date(u.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', messageType: u.lastMessageType || 'TEXT', callType: u.lastCallType, callStatus: u.lastCallStatus, callDuration: u.lastCallDuration }] : [];
          mergedMap.set(u.id, { id: u.id, contactRecordId: null, username: u.username, name: u.username, avatar: u.profilePicUrl, phoneNumber: u.phoneNumber, statusText: 'Offline', isOnline: false, messages: lastMsgArr, isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE' });
        }
      });

      let userGroups = [];
      try {
        const res = await fetch(`${API_BASE_URL}/api/groups`, { headers });
        if (res.ok) {
          const rawGroups = await res.json();
          userGroups = rawGroups.map(g => ({ id: `group-${g.id}`, groupId: g.id, name: g.name, username: `group-${g.id}`, avatar: g.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=100', statusText: g.members.map(m => m.username).join(', '), isOnline: true, isGroup: true, createdBy: g.createdBy, members: g.members, messages: g.lastMessage ? [{ id: `last-g-${g.id}`, text: g.lastMessage, sender: 'other', timestamp: g.lastMessageTimestamp ? new Date(g.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }] : [], isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE' }));
        }
      } catch (e) {}

      const aiBot = { id: 9999, username: 'Ollama AI Assistant', name: 'Ollama AI Assistant', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100', statusText: 'Active AI Bot', isOnline: true, isAi: true, messages: [{ id: 1, text: 'Hello! Main local Ollama assistant hoon.', sender: 'ai', timestamp: '10:00 AM', status: 'read' }], isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE' };
      const notesChat = { id: currentUser.id, username: currentUser.username, name: `${currentUser.username} (You / Notes)`, avatar: currentUser.profilePicUrl, phoneNumber: currentUser.phoneNumber, statusText: 'Personal Space', isOnline: true, isNotes: true, messages: [], isFavorite: true, isBlocked: false, isPinned: true, isArchived: false, isMuted: false, label: 'NONE' };
      setContacts([notesChat, ...userGroups, ...Array.from(mergedMap.values()), aiBot]);
    } catch (err) { console.error('Failed to load contacts from database:', err); }
  };

  useEffect(() => { fetchContactsAndPartners(); }, [isAuthenticated, currentUser, isDemoMode]);

  // === MESSAGE SEND ===
  const sendTypingStatus = (status) => {
    if (isDemoMode || !stompClientRef.current?.connected || activeContactId === null) return;
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || activeContact.isAi) return;
    stompClientRef.current.publish({
      destination: '/app/chat/typing',
      body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: activeContact.name, status })
    });
  };

  const handleMessageChange = (val) => {
    setMessageInput(val);
    sendTypingStatus('typing');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus('idle'), 2500);
  };

  const handleSendMessage = async (replyToMsg, setReplyToMsg) => {
    if (!messageInput.trim() || activeContactId === null) return;
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;

    if (isDemoMode || activeContact.isAi) {
      const newMessage = { id: Date.now(), text: messageInput, sender: 'me', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'sent' };
      setContacts(prev => prev.map(contact => contact.id === activeContactId ? { ...contact, messages: [...contact.messages, newMessage] } : contact));
      setMessageInput('');
      return;
    }

    const targetUser = activeContact.isGroup ? null : (activeContact.username || activeContact.name);
    const conversationKey = activeContact.isGroup ? buildGroupChatKey(activeContact.groupId) : buildDirectChatKey(currentUser.username, targetUser);
    const isVanishMode = Boolean(disappearingModes[conversationKey]);
    const selfDestructSecs = isVanishMode ? (disappearingTimers[conversationKey] || 30) : null;
    const { ciphertext, iv } = await encryptPayload(messageInput, conversationKey || targetUser);

    const payload = {
      senderUsername: currentUser.username, receiverUsername: targetUser,
      groupId: activeContact.isGroup ? activeContact.groupId : null,
      content: ciphertext, iv, selfDestructSeconds: selfDestructSecs,
      parentMessageId: replyToMsg ? replyToMsg.id : null,
      parentMessageText: replyToMsg ? replyToMsg.text : null,
      parentMessageSender: replyToMsg ? replyToMsg.senderUsername : null
    };

    if (navigator.onLine && stompClientRef.current?.connected) {
      stompClientRef.current.publish({ destination: '/app/chat', body: JSON.stringify(payload) });
      setMessageInput('');
      if (setReplyToMsg) setReplyToMsg(null);
      sendTypingStatus('idle');
    } else {
      const newQueue = [...offlineQueue, payload];
      setOfflineQueue(newQueue);
      localStorage.setItem('tactical_offline_queue', JSON.stringify(newQueue));
      setMessageInput('');
      alert('⚡ Field Network Offline: Message queued in local device storage. Will auto-sync when online.');
    }
  };

  // === MESSAGE ACTIONS ===
  const handleDeleteMessage = async (msgId) => {
    if (isDemoMode) { setContacts(prev => prev.map(c => c.id === activeContactId ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, text: 'DELETED' } : m) } : c)); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages/${msgId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setContacts(prev => prev.map(c => c.id === activeContactId ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, text: 'DELETED' } : m) } : c));
      else { const errData = await response.json(); alert(errData.error || 'Failed to delete message'); }
    } catch (err) { console.error(err); }
  };

  const handleToggleStarMsg = async (msgId) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages/star/${msgId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setContacts(prev => prev.map(c => c.id === activeContactId ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, isStarred: !m.isStarred } : m) } : c));
    } catch (e) { console.error(e); }
  };

  const handleTogglePinMsg = async (msgId) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages/pin/${msgId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setContacts(prev => prev.map(c => c.id === activeContactId ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m) } : c));
    } catch (e) { console.error(e); }
  };

  const handleReactMsg = async (msgId, emoji) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages/react/${msgId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ reaction: emoji }) });
      if (response.ok) { const data = await response.json(); setContacts(prev => prev.map(c => c.id === activeContactId ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, reactions: data.reactions } : m) } : c)); }
    } catch (e) { console.error(e); }
  };

  const submitForwardMessage = (forwardingMsg, targetContact, setForwardingMsg, setShowForwardModal) => {
    if (!forwardingMsg || !targetContact) return;
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: targetContact.username || targetContact.name, content: forwardingMsg.text, isForwarded: true, isMedia: forwardingMsg.isMedia, mediaUrl: forwardingMsg.mediaUrl, mediaType: forwardingMsg.mediaType, fileName: forwardingMsg.fileName, fileSize: forwardingMsg.fileSize })
      });
      alert(`Message forwarded to ${targetContact.name}`);
      setForwardingMsg(null);
      setShowForwardModal(false);
    }
  };

  // === CONTACT MANAGEMENT ===
  const handleSearchContact = async (e, searchQuery, setSearchQuery, setSearchError) => {
    e.preventDefault();
    setSearchError(null);
    const query = searchQuery.trim();
    if (!query) return;
    if (currentUser && (query === currentUser.phoneNumber || query.toLowerCase() === currentUser.username?.toLowerCase())) { setSearchError('You cannot search yourself.'); return; }
    const existing = contacts.find(c => c.phoneNumber === query || (c.username && c.username.toLowerCase() === query.toLowerCase()) || (c.name && c.name.toLowerCase() === query.toLowerCase()));
    if (existing) { setActiveContactId(existing.id); setSearchQuery(''); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/search?phoneNumber=${encodeURIComponent(query)}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const foundUser = await response.json();
        const inList = contacts.find(c => c.id === foundUser.id);
        if (inList) { setActiveContactId(inList.id); setSearchQuery(''); setSearchError(null); return; }
        const addRes = await fetch(`${API_BASE_URL}/api/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ phoneNumber: foundUser.phoneNumber }) });
        const newContact = { id: foundUser.id, contactRecordId: null, username: foundUser.username, name: foundUser.username, avatar: foundUser.profilePicUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100', phoneNumber: foundUser.phoneNumber, statusText: 'Offline', isOnline: false, messages: [], isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE' };
        if (addRes.ok) { const savedRec = await addRes.json(); newContact.contactRecordId = savedRec.id; newContact.name = savedRec.customName || foundUser.username; }
        setContacts(prev => prev.some(c => c.id === newContact.id) ? prev : [newContact, ...prev]);
        setActiveContactId(newContact.id); setSearchQuery(''); setSearchError(null);
      } else if (response.status === 404) { setSearchError('No registered user found with this number.'); }
    } catch (err) { setSearchError('Cannot connect to server. Check your connection.'); }
  };

  const toggleContactBooleanAttribute = async (contact, attribute) => {
    if (isDemoMode) { setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, [attribute]: !c[attribute] } : c)); return; }
    let recordId = contact.contactRecordId;
    const token = localStorage.getItem('token');
    if (!recordId) {
      try {
        const addResponse = await fetch(`${API_BASE_URL}/api/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ phoneNumber: contact.phoneNumber || contact.name }) });
        if (addResponse.ok) { const savedContact = await addResponse.json(); recordId = savedContact.id; } else return;
      } catch (e) { return; }
    }
    const payload = {};
    if (attribute === 'isFavorite') payload.favorite = !contact.isFavorite;
    if (attribute === 'isBlocked') payload.blocked = !contact.isBlocked;
    if (attribute === 'isPinned') payload.pinned = !contact.isPinned;
    if (attribute === 'isArchived') payload.archived = !contact.isArchived;
    if (attribute === 'isMuted') payload.muted = !contact.isMuted;
    try {
      const response = await fetch(`${API_BASE_URL}/api/contacts/${recordId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (response.ok) setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, contactRecordId: recordId, [attribute]: !contact[attribute] } : c));
    } catch (e) { console.error(e); }
  };

  // === PRIVACY SETTINGS ===
  // Data comes from usePrivacySettings() hook above (privacyData)
  const handleSavePrivacySettings = async (settingsOverride) => {
    if (isDemoMode) return;
    const toSave = settingsOverride || privacyData;
    try {
      await apiFetch('/api/users/privacy', {
        method: 'PUT',
        body: JSON.stringify(toSave),
      });
      // Invalidate cache so next read gets fresh data
      queryClient.invalidateQueries({ queryKey: PRIVACY_KEY });
      alert('Privacy Settings saved successfully!');
    } catch (err) { console.error('Failed to save privacy settings:', err); alert('Failed to save privacy settings.'); }
  };

  // === AI SETTINGS ===
  // Data comes from useAiSettings() hook above (aiSettings)
  const saveAiSettings = async (newSettings) => {
    try {
      await apiFetch('/api/ai/settings', { method: 'POST', body: JSON.stringify(newSettings) });
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: AI_TRANSPARENCY_KEY });
    } catch (e) { console.error('Error saving AI settings:', e); }
  };

  // Expose transparency data from React Query cache
  const aiTransparencyData = queryClient.getQueryData(AI_TRANSPARENCY_KEY) || null;

  // === STATUS ===
  // Data comes from useStatuses() hook above (myStatuses, friendStatuses)
  const handlePostStatus = async (e) => {
    e.preventDefault();
    if (!newStatusCaption.trim() && !newStatusImg) return;
    if (isDemoMode) {
      // optimistic local update for demo
      queryClient.setQueryData(STATUS_KEYS.all, (old) => ({
        myStatuses: [{ id: Date.now(), name: currentUser?.username, avatar: currentUser?.profilePicUrl, time: 'Just now', image: newStatusImg, caption: newStatusCaption, type: statusType, textBackground: statusType === 'text' ? statusTextBg : null }, ...(old?.myStatuses || [])],
        friendStatuses: old?.friendStatuses || []
      }));
      setNewStatusCaption(''); setNewStatusImg(''); return;
    }
    try {
      await apiFetch('/api/statuses', { method: 'POST', body: JSON.stringify({ mediaUrl: newStatusImg, caption: newStatusCaption, type: statusType, textBackground: statusType === 'text' ? statusTextBg : null }) });
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.all });
      setNewStatusCaption(''); setNewStatusImg('');
    } catch (e) { console.error('Failed to post status:', e); }
  };

  const openStatusViewer = (statusGroup) => { setViewingStatusGroup(statusGroup); setActiveStatusIndex(0); };
  const handleNextStatus = () => { if (!viewingStatusGroup) return; if (activeStatusIndex < viewingStatusGroup.updates.length - 1) setActiveStatusIndex(prev => prev + 1); else setViewingStatusGroup(null); };
  const handlePrevStatus = () => { if (activeStatusIndex > 0) setActiveStatusIndex(prev => prev - 1); };

  // === ANALYTICS ===
  // Analytics are fetched via useAnalytics(peerName) hook directly in components
  // This context function is kept for backward compatibility only
  const loadAnalytics = (peerName) => {
    // Prefetch into cache so useAnalytics() hook finds it ready
    if (!isDemoMode && peerName) {
      queryClient.prefetchQuery({
        queryKey: ['analytics', peerName],
        queryFn: () => apiFetch(`/api/analytics/${peerName}`),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return (
    <ChatContext.Provider value={{
      contacts, setContacts,
      activeContactId, setActiveContactId,
      messageClock, typingStates,
      messageInput, setMessageInput,
      offlineQueue, setOfflineQueue,
      disappearingModes, disappearingTimers, disappearingModeOwners,
      isScreenBlurred,
      searchQuery, setSearchQuery,
      searchError, setSearchError,
      // React Query derived data
      aiSettings,
      privacyData,
      aiTransparencyData,
      latestAiReport, setLatestAiReport,
      callHistory: callHistoryQuery.data || [],
      isCallHistoryLoading: callHistoryQuery.isLoading,
      myStatuses, friendStatuses,
      isStatusesLoading: statusesQuery.isLoading,
      viewingStatusGroup, setViewingStatusGroup,
      activeStatusIndex, setActiveStatusIndex,
      newStatusCaption, setNewStatusCaption,
      newStatusImg, setNewStatusImg,
      statusType, setStatusType,
      statusTextBg, setStatusTextBg,
      stompClientRef, messageEndRef, aiChatEndRef,
      activeContactIdRef, contactsRef,
      queryClient,
      applyConversationVanishState,
      handleToggleVanishMode,
      handleSendMessage,
      handleMessageChange,
      sendTypingStatus,
      handleDeleteMessage,
      handleToggleStarMsg,
      handleTogglePinMsg,
      handleReactMsg,
      submitForwardMessage,
      handleSearchContact,
      toggleContactBooleanAttribute,
      handleSavePrivacySettings,
      saveAiSettings,
      handlePostStatus,
      openStatusViewer, handleNextStatus, handlePrevStatus,
      loadAnalytics,
      fetchContactsAndPartners: () => queryClient.invalidateQueries({ queryKey: CONTACTS_KEYS.all })
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
