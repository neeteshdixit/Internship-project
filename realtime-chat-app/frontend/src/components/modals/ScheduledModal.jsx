// src/components/modals/ScheduledModal.jsx
import React from 'react';
import { X, Clock } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function ScheduledModal() {
  const { closeModal } = useUI();

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-dark)', width: '400px', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--primary)" />
            <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>Scheduled Messages</h3>
          </div>
          <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          Koi bhi message abhi scheduled nahi hai.
        </p>
      </div>
    </div>
  );
}