import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { ShieldCheck, MessageSquare, Lock } from 'lucide-react';
import ChatHeader from '../chat/ChatHeader';
import MessageList from '../chat/MessageList';
import ChatInput from '../chat/ChatInput';

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const { selectedContact, messages, sendMessage, getChatKey } = useChat();
  const messagesEndRef = useRef(null);

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const chatMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  // Map messages to format expected by MessageBubble
  const formattedMessages = chatMessages.map((msg) => {
    const isMe = (msg.senderUsername === currentUser?.username) || 
                 (msg.sender?.username === currentUser?.username) || 
                 (msg.sender === 'me');
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return {
      id: msg.id || Math.random(),
      text: msg.content || '',
      sender: isMe ? 'me' : 'other',
      time: time,
      status: msg.status || 'sent',
    };
  });

  const handleSendMessage = (text) => {
    sendMessage(text);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [formattedMessages]);

  // If no chat selected, display clean Welcome/Empty state
  if (!selectedContact) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111b21',
        borderLeft: '1px solid #222d34',
        textAlign: 'center',
        padding: '30px'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: '#202c33',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <img src="/image.png" alt="Setu Connect" style={{ width: '80px', height: '80px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <h2 style={{ color: '#e9edef', fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Setu Connect for Web</h2>
        <p style={{ color: '#8696a0', fontSize: '14px', maxWidth: '460px', lineHeight: '1.6', marginBottom: '24px' }}>
          Send and receive end-to-end encrypted messages seamlessly. Select a contact or group from the sidebar to start chatting.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#8696a0',
          fontSize: '12px'
        }}>
          <Lock size={14} color="#00a884" /> End-to-end encrypted
        </div>
      </div>
    );
  }

  // Active Chat Screen
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0b141a',
      position: 'relative'
    }}>
      {/* 1. Header */}
      <ChatHeader activeChat={{
        name: selectedContact.customName || selectedContact.username || 'Contact',
        avatar: selectedContact.profilePicUrl || selectedContact.profilePictureUrl,
        isGroup: selectedContact.isGroup,
        online: selectedContact.online
      }} />

      {/* 2. Message List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <MessageList messages={formattedMessages} currentUser={currentUser} />
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Message Input Bar */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}