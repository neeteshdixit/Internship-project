import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/apiFetch';
import { encryptPayload, decryptPayload } from '../crypto/cryptoEngine';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { currentUser, token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const stompClientRef = useRef(null);

  const getChatKey = (contact) => {
    if (!contact) return '';
    if (contact.isGroup) return `group:${contact.id}`;
    const myName = currentUser?.username || 'me';
    const otherName = contact.username || contact.customName || contact.name || 'contact';
    const sortedNames = [myName, otherName].sort();
    return `direct:${sortedNames[0]}|${sortedNames[1]}`;
  };

  useEffect(() => {
    if (!currentUser || !token) return;

    const socket = new SockJS('http://localhost:8081/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        client.subscribe(`/topic/messages/${currentUser.username}`, async (message) => {
          const receivedMsg = JSON.parse(message.body);
          await handleIncomingMessage(receivedMsg);
        });

        client.subscribe(`/topic/typing/${currentUser.username}`, (message) => {
          const typingData = JSON.parse(message.body);
          setTypingUsers((prev) => ({
            ...prev,
            [typingData.sender]: typingData.isTyping,
          }));
        });
      },
      onDisconnect: () => setIsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) client.deactivate();
    };
  }, [currentUser, token]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchContacts = async () => {
      try {
        const data = await apiFetch('/api/contacts');
        setContacts(data || []);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      }
    };
    fetchContacts();
  }, [currentUser]);

  const handleIncomingMessage = async (msg) => {
    const isGroupMsg = !!msg.group;
    const chatKey = isGroupMsg 
      ? `group:${msg.group.id}` 
      : `direct:${[msg.sender.username, msg.receiver?.username].sort().join('|')}`;

    let decryptedContent = msg.content;
    try {
      if (msg.iv) {
        decryptedContent = await decryptPayload(
          msg.content, 
          msg.iv, 
          [msg.group?.id, msg.sender?.username, msg.receiver?.username]
        );
      }
    } catch (e) {
      console.error('Decryption failed:', e);
    }

    const processedMsg = { ...msg, content: decryptedContent };

    setMessages((prev) => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), processedMsg],
    }));
  };

  const sendMessage = async (content, mediaUrl = null, mediaType = 'TEXT') => {
    if (!selectedContact || !stompClientRef.current) return;

    const chatKey = getChatKey(selectedContact);
    const { ciphertext, iv } = await encryptPayload(content, chatKey);

    const messageDto = {
      senderUsername: currentUser.username,
      receiverUsername: selectedContact.isGroup ? null : selectedContact.username,
      groupId: selectedContact.isGroup ? selectedContact.id : null,
      content: ciphertext,
      iv: iv,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      messageType: mediaType,
    };

    stompClientRef.current.publish({
      destination: '/app/chat',
      body: JSON.stringify(messageDto),
    });

    const localMsg = {
      id: Date.now(),
      sender: currentUser,
      receiver: selectedContact.isGroup ? null : selectedContact,
      group: selectedContact.isGroup ? selectedContact : null,
      content: content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      messageType: mediaType,
    };

    setMessages((prev) => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), localMsg],
    }));
  };

  const selectContact = async (contact) => {
    setSelectedContact(contact);
    const chatKey = getChatKey(contact);

    if (!messages[chatKey]) {
      try {
        let endpoint = contact.isGroup
          ? `/api/messages/group/${contact.id}`
          : `/api/messages/${contact.username}`;

        const history = await apiFetch(endpoint);
        
        const decryptedHistory = await Promise.all(
          history.map(async (msg) => {
            if (msg.iv) {
              try {
                const decrypted = await decryptPayload(
                  msg.content, 
                  msg.iv, 
                  [contact.id, msg.sender?.username, msg.receiver?.username]
                );
                return { ...msg, content: decrypted };
              } catch (e) {
                return msg;
              }
            }
            return msg;
          })
        );

        setMessages((prev) => ({
          ...prev,
          [chatKey]: decryptedHistory,
        }));
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        contacts,
        selectedContact,
        selectContact,
        messages,
        sendMessage,
        isConnected,
        typingUsers,
        getChatKey,
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