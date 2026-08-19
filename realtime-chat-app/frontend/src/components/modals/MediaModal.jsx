import React from 'react';
import { X, Download } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function MediaModal() {
  const { closeModal } = useUI();

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '16px' }}>
        <button onClick={() => alert('Downloading media...')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
          <Download size={20} />
        </button>
        <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ maxWidth: '80%', maxHeight: '80%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" 
          alt="Preview" 
          style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} 
        />
      </div>
    </div>
  );
}