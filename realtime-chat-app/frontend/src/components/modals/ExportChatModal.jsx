import React, { useState } from 'react';
import { X, Download, FileText, Code, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function ExportChatModal() {
  const { closeModal } = useUI();
  const { selectedContact, messages, getChatKey } = useChat();
  const [format, setFormat] = useState('TXT'); // 'TXT' | 'JSON'
  const [downloaded, setDownloaded] = useState(false);

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const chatMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  const handleExport = () => {
    const contactName = selectedContact?.username || selectedContact?.name || 'Chat';
    let fileData;
    let fileName;
    let mimeType;

    if (format === 'JSON') {
      fileData = JSON.stringify(chatMessages, null, 2);
      fileName = `SetuConnect_${contactName}_${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      const header = `========================================================\nSETU CONNECT CHAT TRANSCRIPT\nContact: ${contactName}\nExport Date: ${new Date().toLocaleString()}\nTotal Messages: ${chatMessages.length}\nSecurity: End-to-End Encrypted (AES-GCM)\n========================================================\n\n`;
      const body = chatMessages.map((m) => {
        const time = new Date(m.timestamp || Date.now()).toLocaleString();
        const sender = m.senderUsername || m.sender?.username || 'User';
        const content = m.content || m.text || (m.mediaUrl ? `[Media: ${m.mediaUrl}]` : '');
        return `[${time}] ${sender}: ${content}`;
      }).join('\n');
      fileData = header + body;
      fileName = `SetuConnect_${contactName}_${Date.now()}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([fileData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      closeModal('exportChat');
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('exportChat')}>
      <div style={{ width: 'min(400px, calc(100vw - 24px))', backgroundColor: '#202c33', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Download size={18} color="#00a884" /> Export Conversation
          </div>
          <button onClick={() => closeModal('exportChat')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#8696a0', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Export chat history with <strong>@{selectedContact?.username || selectedContact?.name}</strong> ({chatMessages.length} messages) for offline backup.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setFormat('TXT')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: format === 'TXT' ? '2px solid #00a884' : '1px solid #2a3942',
                backgroundColor: format === 'TXT' ? '#182229' : '#2a3942',
                color: '#e9edef',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <FileText size={22} color={format === 'TXT' ? '#00a884' : '#8696a0'} />
              Text File (.txt)
            </button>

            <button
              onClick={() => setFormat('JSON')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: format === 'JSON' ? '2px solid #00a884' : '1px solid #2a3942',
                backgroundColor: format === 'JSON' ? '#182229' : '#2a3942',
                color: '#e9edef',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Code size={22} color={format === 'JSON' ? '#00a884' : '#8696a0'} />
              JSON Data (.json)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => closeModal('exportChat')} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={handleExport} style={{ flex: 1, padding: '10px', backgroundColor: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {downloaded ? <><Check size={16} /> Exported!</> : <><Download size={16} /> Download</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
