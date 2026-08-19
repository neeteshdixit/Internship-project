// src/components/auth/AuthForm.jsx
import React from 'react';

export default function AuthForm({ 
  authMode, 
  setAuthMode, 
  handleAuthSubmit, 
  usernameInput, 
  setUsernameInput, 
  emailInput, 
  setEmailInput, 
  phoneInput,
  setPhoneInput,
  passwordInput, 
  setPasswordInput, 
  isLoading 
}) {
  return (
    <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
      {authMode === 'register' ? (
        <>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8696a0)', display: 'block', marginBottom: '4px' }}>Username</label>
            <input 
              type="text" 
              required
              placeholder="e.g. rahul_dev"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: 'var(--chat-input-bg, #202c33)', border: '1px solid var(--border-color, #2a3942)', borderRadius: '8px', color: 'var(--text-main, #e9edef)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8696a0)', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input 
              type="email" 
              required
              placeholder="rahul@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: 'var(--chat-input-bg, #202c33)', border: '1px solid var(--border-color, #2a3942)', borderRadius: '8px', color: 'var(--text-main, #e9edef)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8696a0)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
            <input 
              type="tel" 
              required
              placeholder="e.g. 9876543210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: 'var(--chat-input-bg, #202c33)', border: '1px solid var(--border-color, #2a3942)', borderRadius: '8px', color: 'var(--text-main, #e9edef)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </>
      ) : (
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted, #8696a0)', display: 'block', marginBottom: '4px' }}>Username or Phone Number</label>
          <input 
            type="text" 
            required
            placeholder="Username ya mobile number dalein"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--chat-input-bg, #202c33)', border: '1px solid var(--border-color, #2a3942)', borderRadius: '8px', color: 'var(--text-main, #e9edef)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-muted, #8696a0)', display: 'block', marginBottom: '4px' }}>Password</label>
        <input 
          type="password" 
          required
          placeholder="••••••••"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          style={{ width: '100%', padding: '12px', backgroundColor: 'var(--chat-input-bg, #202c33)', border: '1px solid var(--border-color, #2a3942)', borderRadius: '8px', color: 'var(--text-main, #e9edef)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        style={{ marginTop: '10px', padding: '12px', backgroundColor: 'var(--primary, #00a884)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', opacity: isLoading ? 0.7 : 1, transition: 'background 0.2s' }}
      >
        {isLoading ? 'Connecting...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
      </button>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted, #8696a0)', marginTop: '12px' }}>
        {authMode === 'login' ? "Account nahi hai? " : "Pehle se account hai? "}
        <span 
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          style={{ color: 'var(--primary, #00a884)', cursor: 'pointer', fontWeight: '600' }}
        >
          {authMode === 'login' ? 'Naya Banayein' : 'Login Karein'}
        </span>
      </p>
    </form>
  );
}