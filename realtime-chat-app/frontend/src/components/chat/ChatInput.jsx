import React, { useState } from 'react';
import { Send, Paperclip, Smile, Mic, Sparkles } from 'lucide-react';

export default function ChatInput({ onSendMessage }) {
  const [text, setText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  // AI Smart Reply simulation helper
  const handleAiSmartReply = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setText("Haan bhai, main bilkul taiyar hoon. Isko aage badhate hain!");
      setIsAiLoading(false);
    }, 600);
  };

  return (
    <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-dark)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* AI Smart Suggestion Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          type="button"
          onClick={handleAiSmartReply}
          disabled={isAiLoading}
          style={{
            background: 'var(--hover-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--primary)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Sparkles size={12} />
          {isAiLoading ? 'Generating AI Reply...' : 'AI Smart Reply'}
        </button>
      </div>

      {/* Main Input Row */}
      <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <Smile size={22} />
        </button>
        <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <Paperclip size={22} />
        </button>
        
        <input 
          type="text" 
          placeholder="Type a secure message..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '10px 14px', 
            backgroundColor: 'var(--chat-input-bg)', 
            border: 'none', 
            borderRadius: '8px', 
            color: 'var(--text-main)', 
            outline: 'none', 
            fontSize: '14px' 
          }}
        />

        {text.trim() ? (
          <button type="submit" style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <Send size={18} />
          </button>
        ) : (
          <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={20} />
          </button>
        )}
      </form>
    </div>
  );
}