import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { apiFetch, getApiBaseUrl } from '../lib/apiFetch';
import { encryptPayload, decryptPayload } from '../crypto/cryptoEngine';

const ChatContext = createContext(null);
const OFFLINE_QUEUE_KEY = 'offlineMessageQueue';
const CHAT_STORAGE_PREFIX = 'setu_chat_history_v2';

export const ChatProvider = ({ children }) => {
  const { currentUser, token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  // Initialize messages from persistent LocalStorage cache so chat is NEVER lost on refresh
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_PREFIX);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [callHistory, setCallHistory] = useState([]);
  const [screenshotAlert, setScreenshotAlert] = useState(null);

  const stompClientRef = useRef(null);
  const selectedContactRef = useRef(null);
  const typingTimersRef = useRef({});
  const groupSubscriptionsRef = useRef({});

  // Automatically persist all chat messages to LocalStorage on every update
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_PREFIX, JSON.stringify(messages));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, maintaining in-memory messages');
    }
  }, [messages]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  const getChatKey = useCallback((contact) => {
    if (!contact) return '';
    if (contact.isGroup) return `group:${contact.id}`;
    const myName = (currentUser?.username || 'me').toLowerCase();
    const otherName = (contact.username || contact.customName || contact.name || 'contact').toLowerCase();
    const sortedNames = [myName, otherName].sort();
    return `direct:${sortedNames[0]}|${sortedNames[1]}`;
  }, [currentUser]);

  const getChatKeyFromMsg = useCallback((msg) => {
    if (msg.group?.id || msg.groupId) return `group:${msg.group?.id || msg.groupId}`;
    const sender = (msg.sender?.username || msg.senderUsername || '').toLowerCase();
    const receiver = (msg.receiver?.username || msg.receiverUsername || currentUser?.username || '').toLowerCase();
    const sorted = [sender, receiver].filter(Boolean).sort();
    return `direct:${sorted.join('|')}`;
  }, [currentUser]);

  const autoMarkRead = useCallback(async (senderUsername) => {
    try {
      await apiFetch(`/api/messages/read/${senderUsername}`, { method: 'POST' });
      const nowIso = new Date().toISOString();
      const chatKey = `direct:${[currentUser?.username?.toLowerCase(), senderUsername.toLowerCase()].filter(Boolean).sort().join('|')}`;
      setMessages((prev) => {
        if (!prev[chatKey]) return prev;
        return {
          ...prev,
          [chatKey]: prev[chatKey].map((m) => {
            const isSender = (m.senderUsername?.toLowerCase() === senderUsername.toLowerCase() ||
                              m.sender?.username?.toLowerCase() === senderUsername.toLowerCase());
            if (isSender && m.status !== 'read') {
              return { ...m, status: 'read', readAt: m.readAt || nowIso };
            }
            return m;
          }),
        };
      });
    } catch (e) {}
  }, [currentUser]);

  const flushOfflineQueue = useCallback((client) => {
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (!queue.length) return;
      queue.forEach((item) => client.publish({ destination: '/app/chat', body: JSON.stringify(item) }));
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) { console.error('Failed to flush offline queue:', e); }
  }, []);

  const addToOfflineQueue = useCallback((messageDto) => {
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      queue.push(messageDto);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) { console.error('Failed to queue offline message:', e); }
  }, []);

  // Fetch online users list
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/api/users/online');
      if (Array.isArray(data) || data instanceof Set || typeof data === 'object') {
        const userArray = Array.isArray(data) ? data : Object.keys(data || {});
        setOnlineUsers(new Set(userArray.map((u) => String(u).toLowerCase())));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchOnlineUsers();
      const interval = setInterval(fetchOnlineUsers, 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchOnlineUsers]);

  // Handle incoming STOMP message
  const handleIncomingMessage = useCallback(async (msg) => {
    // 1. Check for system event: Panic Wipe / Nuke / Single Message Delete
    if (msg.type === 'MESSAGE_DELETED' || msg.messageType === 'MESSAGE_DELETED' || msg.content === 'DELETED') {
      if (msg.reason === 'PANIC_WIPE') {
        setMessages({});
        localStorage.removeItem(CHAT_STORAGE_PREFIX);
        return;
      }
      const targetId = msg.messageId || msg.id;
      if (targetId) {
        try {
          const deletedIds = JSON.parse(localStorage.getItem('setu_deleted_msg_ids') || '[]');
          deletedIds.push(String(targetId));
          localStorage.setItem('setu_deleted_msg_ids', JSON.stringify([...new Set(deletedIds)]));
        } catch (e) {}

        setMessages((prev) => {
          const next = {};
          for (const key of Object.keys(prev)) {
            next[key] = (prev[key] || []).filter((m) => String(m.id) !== String(targetId) && String(m._id) !== String(targetId) && String(m._localId) !== String(targetId));
          }
          return next;
        });
        return;
      }
    }
    if (msg.type === 'NUKE_CHAT' && msg.chatKey) {
      setMessages((prev) => ({ ...prev, [msg.chatKey]: [] }));
      return;
    }

    // 2. Check for system event: Vanish Mode Synced across both users
    if (msg.type === 'VANISH_MODE_UPDATED') {
      const isEnabled = !!msg.enabled;
      const myName = (currentUser?.username || '').toLowerCase();
      let peer = '';
      if (!msg.groupId) {
        if (msg.conversationKey && msg.conversationKey.startsWith('direct:')) {
          const parts = msg.conversationKey.replace('direct:', '').split('|');
          peer = (parts.find((p) => p.toLowerCase() !== myName) || '').toLowerCase();
        }
        if (!peer && msg.targetPeer) {
          peer = msg.targetPeer.toLowerCase();
        }
        if (!peer) {
          const actor = (msg.actorUsername || '').toLowerCase();
          const target = (msg.peerUsername || '').toLowerCase();
          peer = (actor && actor !== myName) ? actor : target;
        }
      }

      setContacts((prev) =>
        prev.map((c) => {
          const cName = (c.username || c.name || '').toLowerCase();
          if ((peer && cName === peer) || (msg.groupId && c.id === msg.groupId)) {
            return { ...c, vanishMode: isEnabled };
          }
          return c;
        })
      );
      if (selectedContactRef.current) {
        const selName = (selectedContactRef.current.username || selectedContactRef.current.name || '').toLowerCase();
        if ((peer && selName === peer) || (msg.groupId && selectedContactRef.current.id === msg.groupId)) {
          setSelectedContact((prev) => prev ? { ...prev, vanishMode: isEnabled } : null);
        }
      }
      return;
    }

    // 3. Check for system event: Screenshot Alert
    if (msg.type === 'SCREENSHOT_ATTEMPT') {
      const user = msg.username || 'The other user';
      setScreenshotAlert(`⚠️ ${user} attempted to take a screenshot!`);
      setTimeout(() => setScreenshotAlert(null), 5000);
      return;
    }

    // 4. Check for system event: View Once opened
    if (msg.type === 'VIEW_ONCE_OPENED' && msg.messageId) {
      setMessages((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = next[key].map((m) =>
            m.id === msg.messageId ? { ...m, isViewOnceOpened: true } : m
          );
        });
        return next;
      });
      return;
    }

    const chatKey = getChatKeyFromMsg(msg);
    if (!chatKey) return;

    let decryptedContent = msg.content;
    try {
      if (msg.iv) {
        const candidates = [
          chatKey,
          msg.groupId ? `group:${msg.groupId}` : null,
          msg.group?.id ? `group:${msg.group.id}` : null,
          selectedContactRef.current?.isGroup ? `group:${selectedContactRef.current.id}` : null,
          'group:1',
          '1',
        ].filter(Boolean);
        decryptedContent = await decryptPayload(msg.content, msg.iv, candidates);
      }
    } catch (e) { console.error('Decryption failed:', e); }

    const processedMsg = { ...msg, content: decryptedContent };

    setMessages((prev) => {
      const existing = prev[chatKey] || [];
      const isOwnMsg = msg.senderUsername?.toLowerCase() === currentUser?.username?.toLowerCase() ||
                       msg.sender?.username?.toLowerCase() === currentUser?.username?.toLowerCase();
      const hasLocal = isOwnMsg && existing.some((m) => !m.id && m._localId);
      if (hasLocal) {
        let replaced = false;
        return {
          ...prev,
          [chatKey]: existing.map((m) => {
            if (!replaced && !m.id && m._localId) { replaced = true; return processedMsg; }
            return m;
          }),
        };
      }
      const isDup = msg.id && existing.some((m) => m.id === msg.id);
      if (isDup) return prev;
      return { ...prev, [chatKey]: [...existing, processedMsg] };
    });

    const senderName = msg.sender?.username || msg.senderUsername;
    if (senderName && senderName.toLowerCase() !== currentUser?.username?.toLowerCase()) {
      setContacts((prev) => {
        const exists = prev.some((c) => (c.username || c.name || '').toLowerCase() === senderName.toLowerCase());
        if (!exists) return [...prev, { id: msg.sender?.id || Date.now(), username: senderName, name: senderName, profilePicUrl: msg.sender?.profilePicUrl, isOnline: true }];
        return prev;
      });
    }

    const currentlySelected = selectedContactRef.current;
    if (currentlySelected && getChatKey(currentlySelected) === chatKey) {
      const sName = msg.sender?.username || msg.senderUsername;
      if (sName && sName.toLowerCase() !== currentUser?.username?.toLowerCase()) autoMarkRead(sName);
    } else {
      setUnreadCounts((prev) => ({ ...prev, [chatKey]: (prev[chatKey] || 0) + 1 }));
    }
  }, [getChatKeyFromMsg, getChatKey, currentUser, autoMarkRead]);

  const callSignalListenersRef = useRef(new Set());

  const registerCallSignalListener = useCallback((listener) => {
    callSignalListenersRef.current.add(listener);
    return () => {
      callSignalListenersRef.current.delete(listener);
    };
  }, []);

  const sendCallSignal = useCallback((signalDto) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify(signalDto),
      });
      return true;
    }
    return false;
  }, []);

  // Fetch initial call history
  const fetchCallHistory = useCallback(async () => {
    try {
      const data = await apiFetch('/api/calls');
      if (Array.isArray(data)) {
        setCallHistory(data.map((item) => ({
          id: item.id,
          otherUser: item.peerUsername,
          callType: (item.callType || 'audio').toUpperCase(),
          direction: item.direction === 'outgoing' ? 'OUTGOING' : 'INCOMING',
          status: (item.status || 'completed').toUpperCase(),
          duration: item.durationSeconds || 0,
          timestamp: item.timestamp,
        })));
      }
    } catch (e) {
      console.warn('Failed to load call history:', e);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCallHistory();
    }
  }, [currentUser, fetchCallHistory]);

  // WebSocket Connection
  useEffect(() => {
    if (!currentUser || !token) return;
    const baseUrl = getApiBaseUrl();
    const socket = new SockJS(`${baseUrl}/ws`, null, {
  transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
});
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        // Direct messages and notifications (both exact and lowercase username)
        client.subscribe(`/topic/messages/${currentUser.username}`, async (message) => {
          await handleIncomingMessage(JSON.parse(message.body));
        });
        if (currentUser.username.toLowerCase() !== currentUser.username) {
          client.subscribe(`/topic/messages/${currentUser.username.toLowerCase()}`, async (message) => {
            await handleIncomingMessage(JSON.parse(message.body));
          });
        }

        // Typing indicator
        client.subscribe(`/topic/typing/${currentUser.username}`, (message) => {
          const typingData = JSON.parse(message.body);
          const sender = (typingData.sender || typingData.senderUsername || '').toLowerCase();
          if (!sender) return;
          setTypingUsers((prev) => ({ ...prev, [sender]: typingData.isTyping }));
          if (typingTimersRef.current[sender]) clearTimeout(typingTimersRef.current[sender]);
          if (typingData.isTyping) {
            typingTimersRef.current[sender] = setTimeout(() => {
              setTypingUsers((prev) => ({ ...prev, [sender]: false }));
            }, 3000);
          }
        });

        // Live Presence topic
        client.subscribe(`/topic/presence`, (message) => {
          try {
            const p = JSON.parse(message.body);
            const user = (p.username || '').toLowerCase();
            setOnlineUsers((prev) => {
              const n = new Set(prev);
              if (p.online || p.isOnline) n.add(user); else n.delete(user);
              return n;
            });
          } catch (e) {}
        });

        // Read receipts
        client.subscribe(`/topic/messages/read/${currentUser.username}`, (message) => {
          try {
            const readData = JSON.parse(message.body);
            const readAt = readData.readAt || new Date().toISOString();
            const chatKey = `direct:${[currentUser.username.toLowerCase(), (readData.receiverUsername || '').toLowerCase()].sort().join('|')}`;
            setMessages((prev) => {
              if (!prev[chatKey]) return prev;
              return {
                ...prev,
                [chatKey]: prev[chatKey].map((m) => {
                  const isMine = (m.senderUsername?.toLowerCase() === currentUser.username?.toLowerCase() ||
                                  m.sender?.username?.toLowerCase() === currentUser.username?.toLowerCase());
                  if (isMine && m.status !== 'read') {
                    return { ...m, status: 'read', readAt: m.readAt || readAt };
                  }
                  return m;
                })
              };
            });
          } catch (e) {}
        });

        // Call signaling subscription
        const handleCallSignal = (message) => {
          try {
            const signal = JSON.parse(message.body);
            callSignalListenersRef.current.forEach((listener) => {
              try { listener(signal); } catch (err) { console.error('Call signal listener error:', err); }
            });
          } catch (e) {
            console.error('Failed to parse incoming call signal:', e);
          }
        };

        client.subscribe(`/topic/calls/${currentUser.username}`, handleCallSignal);
        if (currentUser.username.toLowerCase() !== currentUser.username) {
          client.subscribe(`/topic/calls/${currentUser.username.toLowerCase()}`, handleCallSignal);
        }

        // Call history real-time updates subscription
        const handleCallHistoryUpdate = (message) => {
          try {
            const entry = JSON.parse(message.body);
            setCallHistory((prev) => [
              {
                id: entry.id,
                otherUser: entry.peerUsername,
                callType: (entry.callType || 'audio').toUpperCase(),
                direction: entry.direction === 'outgoing' ? 'OUTGOING' : 'INCOMING',
                status: (entry.status || 'completed').toUpperCase(),
                duration: entry.durationSeconds || 0,
                timestamp: entry.timestamp,
              },
              ...prev.filter((c) => c.id !== entry.id)
            ]);
          } catch (e) {}
        };
        client.subscribe(`/topic/callhistory/${currentUser.username}`, handleCallHistoryUpdate);
        if (currentUser.username.toLowerCase() !== currentUser.username) {
          client.subscribe(`/topic/callhistory/${currentUser.username.toLowerCase()}`, handleCallHistoryUpdate);
        }

        // Register user presence immediately
        client.publish({ destination: '/app/presence/connect', body: currentUser.username });
        fetchOnlineUsers();
        flushOfflineQueue(client);
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => console.error('STOMP error:', frame),
    });
    client.activate();
    stompClientRef.current = client;
    return () => { if (client.active) client.deactivate(); };
  }, [currentUser, token, handleIncomingMessage, flushOfflineQueue, fetchOnlineUsers]);

  // Load Contacts
  useEffect(() => {
    if (!currentUser) return;
    const fetchAll = async () => {
      try {
        const [cRes, pRes, gRes] = await Promise.allSettled([
          apiFetch('/api/contacts'),
          apiFetch(`/api/messages/partners/${currentUser.username}`),
          apiFetch('/api/groups'),
        ]);
        const contactList = cRes.status === 'fulfilled' ? (cRes.value || []) : [];
        const partnerList = pRes.status === 'fulfilled' ? (pRes.value || []) : [];
        const groupList = gRes.status === 'fulfilled' ? (gRes.value || []) : [];
        const contactUsernames = new Set(contactList.map((c) => (c.username || c.name || '').toLowerCase()));
        const mergedPartners = partnerList
          .filter((p) => p?.username && !contactUsernames.has(p.username.toLowerCase()))
          .map((p) => ({ id: p.contactUserId || p.id, username: p.username, name: p.name || p.username, profilePicUrl: p.profilePicUrl || p.avatar, lastMessage: p.lastMessage, lastMessageTime: p.lastMessageTime }));
        const mergedGroups = (groupList || []).map((g) => ({ id: g.id, username: null, name: g.name, customName: g.name, isGroup: true, profilePicUrl: g.avatarUrl || g.avatar, members: g.members || [], admins: g.admins || [], createdBy: g.createdBy, onlyAdminsCanMessage: g.onlyAdminsCanMessage, onlyAdminsCanCall: g.onlyAdminsCanCall, onlyAdminsCanAddMembers: g.onlyAdminsCanAddMembers }));
        const pinnedChats = new Set(JSON.parse(localStorage.getItem('setu_pinned_chat_ids') || '[]'));
        const favChats = new Set(JSON.parse(localStorage.getItem('setu_favorite_chat_ids') || '[]'));

        const allContacts = [...contactList, ...mergedPartners, ...mergedGroups].map(c => {
          const isPin = pinnedChats.has(String(c.id)) || pinnedChats.has(String(c.username)) || !!c.isPinned;
          const isFav = favChats.has(String(c.id)) || favChats.has(String(c.username)) || !!c.isFavorite;
          return { ...c, isPinned: isPin, isFavorite: isFav };
        });
        setContacts(allContacts);
      } catch (error) { console.error('Failed to fetch contacts:', error); }
    };
    fetchAll();
  }, [currentUser]);

  // Upload file helper
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('File upload failed');
    }
    return await response.json();
  };

  // Send Message
  const sendMessage = useCallback(async (content, options = {}) => {
    const contact = options.targetContact || selectedContact;
    if (!contact || (!content?.trim() && !options.mediaUrl)) return;
    const {
      mediaUrl = null,
      mediaType = 'TEXT',
      messageType = null,
      fileName = null,
      fileSize = null,
      isViewOnce = false,
      isForwarded = false,
      replyToId = null,
      replyToText = null,
      replyToSender = null,
      scheduleAt = null,
    } = options;

    const chatKey = getChatKey(contact);
    let ciphertext = content || '';
    let iv = null;
    try {
      const enc = await encryptPayload(content || '', chatKey);
      ciphertext = enc.ciphertext;
      iv = enc.iv;
    } catch (e) {}

    const disappearingHours = contact.disappearingDurationHours || 0;
    const selfDestructSeconds = disappearingHours > 0 ? disappearingHours * 3600 : null;

    const finalMessageType = messageType || (isViewOnce ? 'VIEW_ONCE' : mediaType);

    const messageDto = {
      senderUsername: currentUser.username,
      receiverUsername: contact.isGroup ? null : (contact.username || contact.name),
      groupId: contact.isGroup ? contact.id : null,
      content: ciphertext,
      iv,
      mediaUrl,
      mediaType,
      messageType: finalMessageType,
      fileName,
      fileSize,
      isViewOnce,
      isForwarded,
      selfDestructSeconds,
      parentMessageId: replyToId,
      parentMessageText: replyToText,
      parentMessageSender: replyToSender,
      scheduleAt,
    };

    const localMsg = {
      id: null,
      _localId: `local_${Date.now()}`,
      sender: { username: currentUser.username, id: currentUser.id },
      senderUsername: currentUser.username,
      receiver: contact.isGroup ? null : { username: contact.username },
      receiverUsername: contact.isGroup ? null : contact.username,
      group: contact.isGroup ? { id: contact.id, name: contact.name } : null,
      groupId: contact.isGroup ? contact.id : null,
      content: content || '',
      timestamp: new Date().toISOString(),
      status: 'sent',
      messageType: finalMessageType,
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      isViewOnce,
      isForwarded,
      selfDestructSeconds,
      parentMessageId: replyToId,
      parentMessageText: replyToText,
      parentMessageSender: replyToSender,
    };

    setMessages((prev) => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), localMsg] }));

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({ destination: '/app/chat', body: JSON.stringify(messageDto) });
    } else {
      addToOfflineQueue(messageDto);
    }
  }, [selectedContact, currentUser, getChatKey, addToOfflineQueue]);

  // Broadcast Screenshot Attempt Alert to Peer
  const sendScreenshotAlert = useCallback(() => {
    if (!selectedContact || !stompClientRef.current?.connected) return;
    const alertPayload = {
      type: 'SCREENSHOT_ATTEMPT',
      username: currentUser?.username || 'A participant',
    };
    if (selectedContact.isGroup) {
      if (selectedContact.id) {
        stompClientRef.current.publish({
          destination: `/topic/messages/group/${selectedContact.id}`,
          body: JSON.stringify({ ...alertPayload, groupId: selectedContact.id }),
        });
      }
    } else {
      const receiver = selectedContact.username || selectedContact.name;
      if (!receiver) return;
      stompClientRef.current.publish({
        destination: `/topic/messages/${receiver}`,
        body: JSON.stringify(alertPayload),
      });
    }
  }, [selectedContact, currentUser]);

  // Mark View Once opened on both ends
  const markViewOnceOpened = useCallback((messageId) => {
    if (!messageId) return;
    setMessages((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = next[key].map((m) =>
          m.id === messageId ? { ...m, isViewOnceOpened: true } : m
        );
      });
      return next;
    });
    if (selectedContact && stompClientRef.current?.connected) {
      const receiver = selectedContact.isGroup ? null : (selectedContact.username || selectedContact.name);
      if (receiver) {
        stompClientRef.current.publish({
          destination: `/topic/messages/${receiver}`,
          body: JSON.stringify({ type: 'VIEW_ONCE_OPENED', messageId }),
        });
      }
    }
  }, [selectedContact]);

  // Emergency Panic Wipe: Deletes all messages permanently
  const triggerPanicWipe = useCallback(async () => {
    try {
      await apiFetch('/api/messages/panic-wipe', { method: 'DELETE' });
      setMessages({});
      localStorage.removeItem(CHAT_STORAGE_PREFIX);
    } catch (e) {
      console.error('Panic wipe failed:', e);
    }
  }, []);

  // Toggle Vanish Mode with live WebSocket sync to peer
  const toggleVanishMode = useCallback(async (contact, enabled) => {
    if (!contact) return;
    const peerName = contact.username || contact.name;
    const endpoint = contact.isGroup
      ? `/api/vanish-mode/group/${contact.id}`
      : `/api/vanish-mode/direct/${peerName}`;
    try {
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, vanishMode: enabled } : c))
      );
      setSelectedContact((prev) => prev ? { ...prev, vanishMode: enabled } : null);
    } catch (e) {
      console.error('Vanish mode toggle failed:', e);
    }
  }, []);

  const sendTypingSignal = useCallback((isTyping) => {
    if (!selectedContact || !stompClientRef.current?.connected) return;
    const receiverUsername = selectedContact.isGroup ? null : (selectedContact.username || selectedContact.name);
    if (!receiverUsername) return;
    stompClientRef.current.publish({ destination: '/app/chat/typing', body: JSON.stringify({ senderUsername: currentUser.username, sender: currentUser.username, receiverUsername, isTyping }) });
  }, [selectedContact, currentUser]);

  const selectContact = useCallback(async (contact) => {
    if (!contact || (!contact.username && !contact.id)) return;
    setSelectedContact(contact);
    const chatKey = getChatKey(contact);
    setUnreadCounts((prev) => ({ ...prev, [chatKey]: 0 }));

    // Fetch vanish state for conversation
    if (contact.isGroup && contact.id) {
      try {
        const vState = await apiFetch(`/api/vanish-mode/group/${contact.id}`);
        if (vState && vState.enabled !== undefined) {
          const isEnabled = !!vState.enabled;
          contact.vanishMode = isEnabled;
          setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, vanishMode: isEnabled } : c)));
          setSelectedContact((prev) => (prev && prev.id === contact.id ? { ...prev, vanishMode: isEnabled } : prev));
        }
      } catch (e) {}
    } else if (contact.username || contact.name) {
      const uName = contact.username || contact.name;
      try {
        const vState = await apiFetch(`/api/vanish-mode/direct/${uName}`);
        if (vState && vState.enabled !== undefined) {
          const isEnabled = !!vState.enabled;
          contact.vanishMode = isEnabled;
          setContacts((prev) => prev.map((c) => ((c.username === uName || c.name === uName) ? { ...c, vanishMode: isEnabled } : c)));
          setSelectedContact((prev) => (prev && (prev.username === uName || prev.name === uName) ? { ...prev, vanishMode: isEnabled } : prev));
        }
      } catch (e) {}
    }

    // If group, ensure WebSocket subscription to group topic
    if (contact.isGroup && contact.id && stompClientRef.current?.connected) {
      if (!groupSubscriptionsRef.current[contact.id]) {
        try {
          const sub = stompClientRef.current.subscribe(`/topic/group/${contact.id}`, async (message) => {
            await handleIncomingMessage(JSON.parse(message.body));
          });
          groupSubscriptionsRef.current[contact.id] = sub;
        } catch (e) {}
      }
    }

    try {
      const otherUsername = contact.username || contact.name;
      let history = null;
      if (contact.isGroup) {
        try {
          history = await apiFetch(`/api/messages/group/${contact.id}`);
        } catch (e) {
          history = await apiFetch(`/api/groups/${contact.id}/messages`);
        }
      } else {
        history = await apiFetch(`/api/messages/${currentUser.username}/${otherUsername}`);
      }

      if (Array.isArray(history)) {
        const decryptedHistory = await Promise.all(history.map(async (msg) => {
          const iv = msg.iv;
          if (iv && msg.content) {
            const candidates = [
              getChatKeyFromMsg(msg),
              chatKey,
              msg.groupId ? `group:${msg.groupId}` : null,
              contact.isGroup ? `group:${contact.id}` : null,
              `group:1`,
            ].filter(Boolean);
            try {
              const dec = await decryptPayload(msg.content, iv, candidates);
              return { ...msg, content: dec };
            } catch (e) {
              return msg;
            }
          }
          return msg;
        }));
        // Synchronize server history: respect deleted messages and never resurrect deleted rows
        setMessages((prev) => {
          const existing = (prev[chatKey] && Array.isArray(prev[chatKey])) ? prev[chatKey] : [];
          const deletedIds = new Set(JSON.parse(localStorage.getItem('setu_deleted_msg_ids') || '[]'));
          const pinnedMsgIds = new Set(JSON.parse(localStorage.getItem('setu_pinned_msg_ids') || '[]'));

          // 1. Filter server messages against known deleted IDs and enforce pinned state
          const validServerMsgs = decryptedHistory
            .filter((m) => m && !deletedIds.has(String(m.id)) && !deletedIds.has(String(m._id)))
            .map((m) => {
              const isP = pinnedMsgIds.has(String(m.id)) || pinnedMsgIds.has(String(m._id)) || !!m.isPinned;
              return isP ? { ...m, isPinned: true, selfDestructSeconds: null, expiresAt: null } : m;
            });

          // 2. Only preserve unconfirmed pending local messages
          const pendingLocalMsgs = existing
            .filter((m) => m && !m.id && m._localId && !deletedIds.has(String(m._localId)))
            .map((m) => {
              const isP = pinnedMsgIds.has(String(m._localId)) || !!m.isPinned;
              return isP ? { ...m, isPinned: true, selfDestructSeconds: null, expiresAt: null } : m;
            });

          const combined = [...validServerMsgs, ...pendingLocalMsgs];
          combined.sort((a, b) => new Date(a.timestamp || a.createdAt || 0).getTime() - new Date(b.timestamp || b.createdAt || 0).getTime());
          return { ...prev, [chatKey]: combined };
        });
      }
      if (!contact.isGroup && contact.username) autoMarkRead(contact.username);
    } catch (error) {
      // If offline/error, keep existing cached messages intact
      console.log('Serving chat from local persistent storage');
    }
  }, [currentUser, getChatKey, getChatKeyFromMsg, autoMarkRead]);

  // Go back to chat list (used by mobile back navigation)
  const clearSelectedContact = useCallback(() => setSelectedContact(null), []);

  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;

    // 1. Mark as permanently deleted in localStorage
    try {
      const deletedIds = JSON.parse(localStorage.getItem('setu_deleted_msg_ids') || '[]');
      deletedIds.push(String(messageId));
      localStorage.setItem('setu_deleted_msg_ids', JSON.stringify([...new Set(deletedIds)]));
    } catch (e) {}

    // 2. Remove immediately from all conversations in state
    setMessages((prev) => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = (prev[key] || []).filter(
          (m) => String(m.id) !== String(messageId) && String(m._id) !== String(messageId) && String(m._localId) !== String(messageId)
        );
      }
      return next;
    });

    // 3. Immediately purge from LocalStorage cache so refresh never brings it back
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_PREFIX);
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const key of Object.keys(parsed)) {
          parsed[key] = (parsed[key] || []).filter(
            (m) => String(m.id) !== String(messageId) && String(m._id) !== String(messageId) && String(m._localId) !== String(messageId)
          );
        }
        localStorage.setItem(CHAT_STORAGE_PREFIX, JSON.stringify(parsed));
      }
    } catch (e) {}

    // 4. Call backend to delete permanently from DB
    try {
      await apiFetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }, []);

  const starMessage = useCallback(async (messageId, starred) => {
    // 1. Optimistic update in UI
    const chatKey = selectedContact ? getChatKey(selectedContact) : null;
    if (chatKey) {
      setMessages((prev) => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).map((m) => (m.id === messageId ? { ...m, isStarred: starred } : m)),
      }));
    }
    // 2. Call backend
    try {
      await apiFetch(`/api/messages/star/${messageId}`, {
        method: 'POST',
        body: JSON.stringify({ starred }),
      });
    } catch (e) {
      console.error('Star failed:', e);
    }
  }, [selectedContact, getChatKey]);

  const pinMessage = useCallback(async (messageId, pinned) => {
    if (!messageId) return;
    const strId = String(messageId);

    // 1. Persist pinned message ID in localStorage
    try {
      let pinnedMsgIds = JSON.parse(localStorage.getItem('setu_pinned_msg_ids') || '[]');
      if (pinned) {
        if (!pinnedMsgIds.includes(strId)) pinnedMsgIds.push(strId);
      } else {
        pinnedMsgIds = pinnedMsgIds.filter((id) => id !== strId);
      }
      localStorage.setItem('setu_pinned_msg_ids', JSON.stringify(pinnedMsgIds));
    } catch (e) {}

    // 2. Optimistic update in UI: set isPinned, clear vanish countdown
    const chatKey = selectedContact ? getChatKey(selectedContact) : null;
    if (chatKey) {
      setMessages((prev) => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).map((m) =>
          String(m.id) === strId || String(m._id) === strId || String(m._localId) === strId
            ? { ...m, isPinned: pinned, selfDestructSeconds: pinned ? null : m.selfDestructSeconds, expiresAt: pinned ? null : m.expiresAt }
            : m
        ),
      }));
    }

    // 3. Call backend
    try {
      await apiFetch(`/api/messages/pin/${messageId}`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
      });
    } catch (e) {
      console.error('Pin failed:', e);
    }
  }, [selectedContact, getChatKey]);

  const updateContactAttribute = useCallback(async (contactId, attribute, value) => {
    if (!contactId) return;
    const strId = String(contactId);

    // 1. Maintain dedicated pinned and favorite chat sets in localStorage
    if (attribute === 'isPinned') {
      try {
        let pinnedChats = JSON.parse(localStorage.getItem('setu_pinned_chat_ids') || '[]');
        if (value) {
          if (!pinnedChats.includes(strId)) pinnedChats.push(strId);
        } else {
          pinnedChats = pinnedChats.filter((id) => id !== strId);
        }
        localStorage.setItem('setu_pinned_chat_ids', JSON.stringify(pinnedChats));
      } catch (e) {}
    } else if (attribute === 'isFavorite') {
      try {
        let favChats = JSON.parse(localStorage.getItem('setu_favorite_chat_ids') || '[]');
        if (value) {
          if (!favChats.includes(strId)) favChats.push(strId);
        } else {
          favChats = favChats.filter((id) => id !== strId);
        }
        localStorage.setItem('setu_favorite_chat_ids', JSON.stringify(favChats));
      } catch (e) {}
    }

    // 2. Optimistically update local contacts
    setContacts((prev) =>
      prev.map((c) => {
        if (String(c.id) === strId || String(c.username) === strId) {
          return { ...c, [attribute]: value };
        }
        return c;
      })
    );
    if (selectedContact && (String(selectedContact.id) === strId || String(selectedContact.username) === strId)) {
      setSelectedContact((prev) => (prev ? { ...prev, [attribute]: value } : prev));
    }

    // 3. Sync to backend if numeric contact id exists
    try {
      const target = contacts.find((c) => String(c.id) === strId || String(c.username) === strId);
      if (target && typeof target.id === 'number') {
        await apiFetch(`/api/contacts/${target.id}`, {
          method: 'PUT',
          body: JSON.stringify({ [attribute]: value }),
        });
      }
    } catch (e) {
      console.error('Update contact failed:', e);
    }
  }, [contacts, selectedContact]);

  const reactToMessage = useCallback(async (messageId, emoji) => {
    // 1. Update reaction locally in state and storage immediately
    const chatKey = selectedContact ? getChatKey(selectedContact) : null;
    if (chatKey) {
      setMessages((prev) => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).map((m) => {
          if (m.id === messageId) {
            const rx = { ...(m.reactions || {}) };
            rx[emoji] = (rx[emoji] || 0) + 1;
            return { ...m, reactions: rx };
          }
          return m;
        }),
      }));
    }
    // 2. Sync with backend
    try {
      await apiFetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji, username: currentUser.username }),
      });
    } catch (e) {}
  }, [selectedContact, getChatKey, currentUser]);

  const forwardMessage = useCallback(async (messageId, targetContact) => {
    try {
      await apiFetch(`/api/messages/${messageId}/forward`, {
        method: 'POST',
        body: JSON.stringify({
          receiverUsername: targetContact.isGroup ? null : targetContact.username,
          groupId: targetContact.isGroup ? targetContact.id : null,
        }),
      });
    } catch (e) { console.error('Forward failed:', e); }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const [cRes, gRes] = await Promise.allSettled([
        apiFetch('/api/contacts'),
        apiFetch('/api/groups'),
      ]);
      const data = cRes.status === 'fulfilled' ? (cRes.value || []) : [];
      const groupList = gRes.status === 'fulfilled' ? (gRes.value || []) : [];
      
      const pinnedChats = new Set(JSON.parse(localStorage.getItem('setu_pinned_chat_ids') || '[]'));
      const favChats = new Set(JSON.parse(localStorage.getItem('setu_favorite_chat_ids') || '[]'));

      setContacts((prev) => {
        const partners = prev.filter(c => !c.isGroup && !data.some(d => d.id === c.id));
        const mergedGroups = groupList.map((g) => ({ id: g.id, username: null, name: g.name, customName: g.name, isGroup: true, profilePicUrl: g.avatarUrl, members: g.members || [], admins: g.admins || [], createdBy: g.createdBy, onlyAdminsCanMessage: g.onlyAdminsCanMessage, onlyAdminsCanCall: g.onlyAdminsCanCall, onlyAdminsCanAddMembers: g.onlyAdminsCanAddMembers }));
        
        const merged = [...data, ...partners, ...mergedGroups].map((c) => {
          const isPin = pinnedChats.has(String(c.id)) || pinnedChats.has(String(c.username)) || !!c.isPinned;
          const isFav = favChats.has(String(c.id)) || favChats.has(String(c.username)) || !!c.isFavorite;
          return { ...c, isPinned: isPin, isFavorite: isFav };
        });
        return merged;
      });
    } catch (e) { console.error('Failed to refresh contacts:', e); }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        setContacts,
        selectedContact,
        selectContact,
        clearSelectedContact,
        messages,
        setMessages,
        sendMessage,
        uploadFile,
        sendTypingSignal,
        sendScreenshotAlert,
        markViewOnceOpened,
        triggerPanicWipe,
        toggleVanishMode,
        isConnected,
        typingUsers,
        onlineUsers,
        unreadCounts,
        screenshotAlert,
        getChatKey,
        deleteMessage,
        starMessage,
        pinMessage,
        reactToMessage,
        forwardMessage,
        updateContactAttribute,
        refreshContacts,
        callHistory,
        setCallHistory,
        sendCallSignal,
        registerCallSignalListener,
        fetchCallHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
