// src/components/auth/AuthForm.jsx
import React, { useState } from 'react';

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
  const [showPassword, setShowPassword] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--chat-input-bg, #202c33)',
    border: '1px solid var(--border-color, #2a3942)',
    borderRadius: '8px',
    color: 'var(--text-main, #e9edef)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const EyeIcon = ({ open }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );

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
              style={inputStyle}
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
              style={inputStyle}
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
              style={inputStyle}
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
            style={inputStyle}
          />
        </div>
      )}

      {/* Password field with show/hide toggle */}
      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-muted, #8696a0)', display: 'block', marginBottom: '4px' }}>Password</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ ...inputStyle, paddingRight: '44px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Password chupaao' : 'Password dekho'}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: showPassword ? 'var(--primary, #00a884)' : 'var(--text-muted, #8696a0)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
              transition: 'color 0.2s',
            }}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {showPassword && passwordInput && (
          <p style={{ fontSize: '11px', color: 'var(--primary, #00a884)', marginTop: '4px', marginBottom: 0 }}>
            ✓ Password dikh raha hai
          </p>
        )}
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