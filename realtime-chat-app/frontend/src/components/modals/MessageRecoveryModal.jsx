import React, { useState } from 'react';
import { X, RotateCcw, Trash2, ShieldAlert, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function MessageRecoveryModal() {
  const { closeModal } = useUI();
  const { selectedContact, messages, setMessages, getChatKey } = useChat();

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const currentMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  // Filter messages that are marked deleted
  const deletedMessages = currentMessages.filter((m) => m.deleted || m.content === '🚫 This message was deleted' || m.content === 'This message was deleted');

  const handleRestore = (msgId) => {
    setMessages((prev) => ({
      ...prev,
      [chatKey]: (prev[chatKey] || []).map((m) =>
        m.id === msgId ? { ...m, deleted: false, content: m.originalContent || 'Restored message' } : m
      ),
    }));
  };

  const handlePermanentWipe = () => {
    setMessages((prev) => ({
      ...prev,
      [chatKey]: (prev[chatKey] || []).filter((m) => !m.deleted && m.content !== '🚫 This message was deleted' && m.content !== 'This message was deleted'),
    }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('messageRecovery')}>
      <div style={{ width: '440px', maxHeight: '540px', backgroundColor: '#202c33', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <RotateCcw size={18} color="#00a884" /> Message Recovery Center
          </div>
          <button onClick={() => closeModal('messageRecovery')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <p style={{ color: '#8696a0', fontSize: '12px', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Messages deleted in the last 24 hours can be restored before permanent garbage collection.
          </p>

          {deletedMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 20px', fontSize: '13px' }}>
              <Check size={32} color="#00a884" style={{ marginBottom: '8px' }} />
              <div>Recycle Bin is clean. No deleted messages in this chat.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {deletedMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#2a3942', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#e9edef', fontStyle: 'italic' }}>"{m.content}"</div>
                    <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '2px' }}>Deleted on {new Date(m.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <button onClick={() => handleRestore(m.id)} style={{ padding: '6px 10px', backgroundColor: '#00a884', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RotateCcw size={12} /> Restore
                  </button>
                </div>
              ))}
            </div>
          )}

          {deletedMessages.length > 0 && (
            <button
              onClick={handlePermanentWipe}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={15} /> Empty Trash (Permanently Purge)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
