import React from 'react';
import { X, Sparkles, Cpu } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function AIModal() {
  const { closeModal } = useUI();

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-dark)', width: 'min(420px, calc(100vw - 24px))', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>AI Assistant Settings</h3>
          </div>
          <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: 'var(--text-main)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-darker)', borderRadius: '8px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>Smart Replies</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Context-aware quick responses</p>
            </div>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-darker)', borderRadius: '8px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>AI Summarizer</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Summarize long unread chat streams</p>
            </div>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
          </div>

          <div style={{ padding: '10px', backgroundColor: 'var(--hover-bg)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--primary)" />
            <span>AI processes text locally and securely with zero data retention policy.</span>
          </div>
        </div>

      </div>
    </div>
  );
}