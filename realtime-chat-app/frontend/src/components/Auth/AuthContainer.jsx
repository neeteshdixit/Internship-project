// src/components/auth/AuthContainer.jsx
import React from 'react';
import AuthForm from './AuthForm';

export default function AuthContainer({ authMode, setAuthMode, handleAuthSubmit, errorMsg, ...props }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '420px',
      padding: '36px',
      backgroundColor: 'var(--bg-dark, #111b21)',
      borderRadius: '16px',
      border: '1px solid var(--border-color, #222d34)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <img src="/image.png" alt="Setu Connect Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 12px auto', display: 'block' }} />
        <h2 style={{ color: 'var(--text-main, #e9edef)', fontSize: '24px', fontWeight: '700', margin: 0 }}>Setu Connect</h2>
        <p style={{ color: 'var(--text-muted, #8696a0)', fontSize: '13px', marginTop: '6px' }}>
          {authMode === 'login' ? 'Surakshit aur tez baat-cheet ke liye login karein' : 'Apna naya surakshit account banayein'}
        </p>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '16px',
          textAlign: 'left'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <AuthForm authMode={authMode} setAuthMode={setAuthMode} handleAuthSubmit={handleAuthSubmit} {...props} />
    </div>
  );
}