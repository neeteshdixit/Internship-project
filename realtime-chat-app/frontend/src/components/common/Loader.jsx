import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ size = 24, color = 'var(--primary)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <Loader2 size={size} color={color} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}