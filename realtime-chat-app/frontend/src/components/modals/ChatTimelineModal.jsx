import React from 'react';
import { X, Calendar, Sparkles, Heart, MessageSquare, Image } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function ChatTimelineModal() {
  const { closeModal } = useUI();
  const { selectedContact, messages, getChatKey } = useChat();

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const chatMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  const firstMsg = chatMessages[0];
  const totalMsgs = chatMessages.length;
  const mediaCount = chatMessages.filter((m) => m.mediaUrl).length;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('chatTimeline')}>
      <div style={{ width: '460px', maxHeight: '560px', backgroundColor: '#202c33', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Sparkles size={18} color="#f59e0b" /> Chat Memory Timeline
          </div>
          <button onClick={() => closeModal('chatTimeline')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Milestone Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#182229', borderRadius: '10px', borderLeft: '4px solid #00a884' }}>
              <Calendar size={28} color="#00a884" />
              <div>
                <div style={{ fontSize: '12px', color: '#8696a0', fontWeight: 600 }}>FIRST MESSAGE SENT</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#e9edef', marginTop: '2px' }}>
                  {firstMsg ? new Date(firstMsg.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#182229', borderRadius: '10px', borderLeft: '4px solid #6366f1' }}>
              <MessageSquare size={28} color="#6366f1" />
              <div>
                <div style={{ fontSize: '12px', color: '#8696a0', fontWeight: 600 }}>TOTAL EXCHANGED MESSAGES</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#e9edef', marginTop: '2px' }}>
                  {totalMsgs} Messages & Voice Notes
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#182229', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
              <Image size={28} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '12px', color: '#8696a0', fontWeight: 600 }}>SHARED MEMORIES (PHOTOS & DOCS)</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#e9edef', marginTop: '2px' }}>
                  {mediaCount} Media Files Shared
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
