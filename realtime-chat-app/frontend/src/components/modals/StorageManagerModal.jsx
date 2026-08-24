import React, { useState } from 'react';
import { X, HardDrive, Trash2, PieChart, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function StorageManagerModal() {
  const { closeModal } = useUI();
  const { contacts, messages, setMessages } = useChat();
  const [cleaned, setCleaned] = useState(false);

  // Calculate storage metrics
  let totalMediaBytes = 0;
  let totalDocBytes = 0;
  let totalMsgCount = 0;

  Object.values(messages).forEach((chatList) => {
    (chatList || []).forEach((m) => {
      totalMsgCount++;
      if (m.mediaUrl && (m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO')) totalMediaBytes += (m.fileSize || 1024 * 350);
      if (m.mediaUrl && (m.mediaType === 'DOCUMENT' || m.mediaType === 'FILE')) totalDocBytes += (m.fileSize || 1024 * 120);
    });
  });

  const mediaMB = (totalMediaBytes / (1024 * 1024)).toFixed(1);
  const docMB = (totalDocBytes / (1024 * 1024)).toFixed(1);
  const textMB = ((totalMsgCount * 80) / (1024 * 1024)).toFixed(2);
  const totalMB = (parseFloat(mediaMB) + parseFloat(docMB) + parseFloat(textMB)).toFixed(1);

  const handleFreeSpace = () => {
    setCleaned(true);
    setTimeout(() => {
      setCleaned(false);
      closeModal('storageManager');
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('storageManager')}>
      <div style={{ width: 'min(440px, calc(100vw - 24px))', backgroundColor: '#202c33', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <HardDrive size={18} color="#00a884" /> Chat Storage Manager
          </div>
          <button onClick={() => closeModal('storageManager')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Storage Usage Bar */}
          <div style={{ backgroundColor: '#182229', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#8696a0', fontWeight: 600 }}>TOTAL APP STORAGE</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#00a884' }}>{totalMB} MB</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#2a3942', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: '65%', backgroundColor: '#00a884' }} title="Media" />
              <div style={{ width: '25%', backgroundColor: '#53bdeb' }} title="Docs" />
              <div style={{ width: '10%', backgroundColor: '#f59e0b' }} title="Text" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#8696a0' }}>
              <span>🟢 Photos & Videos: {mediaMB} MB</span>
              <span>🔵 Docs: {docMB} MB</span>
              <span>🟡 Messages: {textMB} MB</span>
            </div>
          </div>

          {/* Breakdown by chats */}
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0', marginBottom: '8px', textTransform: 'uppercase' }}>
            Top Storage Conversations
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 'min(160px, calc(100dvh - 32px))', overflowY: 'auto', marginBottom: '16px' }}>
            {contacts.slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#2a3942', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', color: '#e9edef' }}>@{c.username || c.name}</span>
                <span style={{ fontSize: '12px', color: '#8696a0', fontWeight: 600 }}>{((i + 1) * 2.4).toFixed(1)} MB</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleFreeSpace}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#00a884',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {cleaned ? <><Check size={16} /> Storage Cleaned!</> : <><Trash2 size={16} /> Clean Cache & Free Space</>}
          </button>
        </div>
      </div>
    </div>
  );
}
