import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/apiFetch';
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
    try { await apiFetch(`/api/messages/read/${senderUsername}`, { method: 'POST' }); } catch (e) {}
  }, []);

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
    // 1. Check for system event: Panic Wipe / Nuke
    if (msg.type === 'MESSAGE_DELETED' && msg.reason === 'PANIC_WIPE') {
      setMessages({});
      localStorage.removeItem(CHAT_STORAGE_PREFIX);
      return;
    }
    if (msg.type === 'NUKE_CHAT' && msg.chatKey) {
      setMessages((prev) => ({ ...prev, [msg.chatKey]: [] }));
      return;
    }

    // 2. Check for system event: Vanish Mode Synced across both users
    if (msg.type === 'VANISH_MODE_UPDATED') {
      const isEnabled = !!msg.enabled;
      const peer = (msg.peerUsername || msg.actorUsername || '').toLowerCase();
      setContacts((prev) =>
        prev.map((c) => {
          const cName = (c.username || c.name || '').toLowerCase();
          if (cName === peer || (msg.groupId && c.id === msg.groupId)) {
            return { ...c, vanishMode: isEnabled };
          }
          return c;
        })
      );
      if (selectedContactRef.current) {
        const selName = (selectedContactRef.current.username || selectedContactRef.current.name || '').toLowerCase();
        if (selName === peer || (msg.groupId && selectedContactRef.current.id === msg.groupId)) {
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
      if (msg.iv) decryptedContent = await decryptPayload(msg.content, msg.iv, chatKey);
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

  // WebSocket Connection
  useEffect(() => {
    if (!currentUser || !token) return;
    const socket = new SockJS('http://localhost:8081/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        // Direct messages and notifications
        client.subscribe(`/topic/messages/${currentUser.username}`, async (message) => {
          await handleIncomingMessage(JSON.parse(message.body));
        });

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
            const chatKey = `direct:${[currentUser.username.toLowerCase(), (readData.receiverUsername || '').toLowerCase()].sort().join('|')}`;
            setMessages((prev) => {
              if (!prev[chatKey]) return prev;
              return { ...prev, [chatKey]: prev[chatKey].map((m) => (m.senderUsername?.toLowerCase() === currentUser.username?.toLowerCase() || m.sender?.username?.toLowerCase() === currentUser.username?.toLowerCase()) ? { ...m, status: 'read' } : m) };
            });
          } catch (e) {}
        });

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
        const mergedGroups = (groupList || []).map((g) => ({ id: g.id, username: null, name: g.name, customName: g.name, isGroup: true, profilePicUrl: g.avatarUrl, members: g.members || [] }));
        setContacts([...contactList, ...mergedPartners, ...mergedGroups]);
      } catch (error) { console.error('Failed to fetch contacts:', error); }
    };
    fetchAll();
  }, [currentUser]);

  // Upload file helper
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8081/api/media/upload', {
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
    if (!selectedContact || (!content?.trim() && !options.mediaUrl)) return;
    const {
      mediaUrl = null,
      mediaType = 'TEXT',
      fileName = null,
      fileSize = null,
      isViewOnce = false,
      replyToId = null,
      replyToText = null,
      replyToSender = null,
      scheduleAt = null,
    } = options;

    const chatKey = getChatKey(selectedContact);
    let ciphertext = content || '';
    let iv = null;
    try {
      const enc = await encryptPayload(content || '', chatKey);
      ciphertext = enc.ciphertext;
      iv = enc.iv;
    } catch (e) {}

    const messageDto = {
      senderUsername: currentUser.username,
      receiverUsername: selectedContact.isGroup ? null : (selectedContact.username || selectedContact.name),
      groupId: selectedContact.isGroup ? selectedContact.id : null,
      content: ciphertext,
      iv,
      mediaUrl,
      mediaType,
      messageType: isViewOnce ? 'VIEW_ONCE' : mediaType,
      fileName,
      fileSize,
      isViewOnce,
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
      receiver: selectedContact.isGroup ? null : { username: selectedContact.username },
      receiverUsername: selectedContact.isGroup ? null : selectedContact.username,
      group: selectedContact.isGroup ? { id: selectedContact.id, name: selectedContact.name } : null,
      groupId: selectedContact.isGroup ? selectedContact.id : null,
      content: content || '',
      timestamp: new Date().toISOString(),
      status: 'sent',
      messageType: isViewOnce ? 'VIEW_ONCE' : mediaType,
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      isViewOnce,
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
    const receiver = selectedContact.isGroup ? null : (selectedContact.username || selectedContact.name);
    if (!receiver) return;
    const alertPayload = {
      type: 'SCREENSHOT_ATTEMPT',
      username: currentUser.username,
    };
    stompClientRef.current.publish({
      destination: `/topic/messages/${receiver}`,
      body: JSON.stringify(alertPayload),
    });
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
    if (!contact.isGroup && contact.username) {
      try {
        const vState = await apiFetch(`/api/vanish-mode/direct/${contact.username}`);
        if (vState && vState.enabled !== undefined) {
          contact.vanishMode = vState.enabled;
          setSelectedContact((prev) => prev ? { ...prev, vanishMode: vState.enabled } : null);
        }
      } catch (e) {}
    }

    try {
      const otherUsername = contact.username || contact.name;
      const endpoint = contact.isGroup ? `/api/messages/group/${contact.id}` : `/api/messages/${currentUser.username}/${otherUsername}`;
      const history = await apiFetch(endpoint);
      if (Array.isArray(history) && history.length > 0) {
        const decryptedHistory = await Promise.all(history.map(async (msg) => {
          if (msg.iv) {
            try { return { ...msg, content: await decryptPayload(msg.content, msg.iv, getChatKeyFromMsg(msg)) }; }
            catch (e) { return msg; }
          }
          return msg;
        }));
        setMessages((prev) => ({ ...prev, [chatKey]: decryptedHistory }));
      }
      if (!contact.isGroup && contact.username) autoMarkRead(contact.username);
    } catch (error) {
      // If offline/error, keep existing cached messages intact
      console.log('Serving chat from local persistent storage');
    }
  }, [currentUser, getChatKey, getChatKeyFromMsg, autoMarkRead]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await apiFetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      const chatKey = selectedContact ? getChatKey(selectedContact) : null;
      if (!chatKey) return;
      setMessages((prev) => ({ ...prev, [chatKey]: (prev[chatKey] || []).map((m) => m.id === messageId ? { ...m, deleted: true, content: '🚫 This message was deleted' } : m) }));
    } catch (e) { console.error('Delete failed:', e); }
  }, [selectedContact, getChatKey]);

  const starMessage = useCallback(async (messageId, starred) => {
    try {
      await apiFetch(`/api/messages/${messageId}/star`, { method: 'PUT', body: JSON.stringify({ starred }) });
      const chatKey = selectedContact ? getChatKey(selectedContact) : null;
      if (!chatKey) return;
      setMessages((prev) => ({ ...prev, [chatKey]: (prev[chatKey] || []).map((m) => m.id === messageId ? { ...m, isStarred: starred } : m) }));
    } catch (e) { console.error('Star failed:', e); }
  }, [selectedContact, getChatKey]);

  const pinMessage = useCallback(async (messageId, pinned) => {
    try {
      await apiFetch(`/api/messages/${messageId}/pin`, { method: 'PUT', body: JSON.stringify({ pinned }) });
      const chatKey = selectedContact ? getChatKey(selectedContact) : null;
      if (!chatKey) return;
      setMessages((prev) => ({ ...prev, [chatKey]: (prev[chatKey] || []).map((m) => m.id === messageId ? { ...m, isPinned: pinned } : m) }));
    } catch (e) { console.error('Pin failed:', e); }
  }, [selectedContact, getChatKey]);

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

  const updateContactAttribute = useCallback(async (contactId, attribute, value) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, [attribute]: value } : c)));
    try {
      await apiFetch(`/api/contacts/${contactId}/${attribute}`, {
        method: 'PUT',
        body: JSON.stringify({ [attribute]: value }),
      });
    } catch (e) {
      console.error(`Failed to update ${attribute}:`, e);
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, [attribute]: !value } : c)));
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const data = await apiFetch('/api/contacts');
      setContacts((prev) => {
        const groups = prev.filter((c) => c.isGroup);
        return [...(data || []), ...groups];
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
