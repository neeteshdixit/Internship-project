import React from 'react';
import { AlertCircle } from 'lucide-react';

// Auth component - receives props from App.jsx's InnerApp
// (props are passed explicitly because auth is shown BEFORE contexts are available)
const Auth = ({
  authMode, setAuthMode,
  errorMsg,
  handleAuthSubmit,
  usernameInput, setUsernameInput,
  emailInput, setEmailInput,
  phoneInput, setPhoneInput,
  profilePicInput, setProfilePicInput,
  passwordInput, setPasswordInput,
  isLoading
}) => {
  return (
    <div className="auth-container glass animate-scale-up">
      <div className="auth-header">
        <img src="/image.png" alt="Logo" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
        <h2>WhatsApp Secure AI</h2>
        <p>{authMode === 'login' ? 'Sign in to access secure chats' : 'Register a new developer account'}</p>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          {errorMsg}
        </div>
      )}

      <form className="auth-form" onSubmit={handleAuthSubmit}>
        <div className="input-group">
          <label>{authMode === 'login' ? 'Phone Number / Username' : 'Username'}</label>
          <input
            type="text" required value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            placeholder={authMode === 'login' ? '9876543210 or username' : 'student_dev'}
            inputMode={authMode === 'login' ? 'tel' : 'text'}
          />
        </div>

        {authMode === 'register' && (
          <>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" required value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="student@example.com" />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" required value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="9876543210" />
            </div>
            <div className="input-group">
              <label>Profile Picture URL (Optional)</label>
              <input type="url" value={profilePicInput} onChange={e => setProfilePicInput(e.target.value)} placeholder="https://images.unsplash.com/..." />
            </div>
          </>
        )}

        <div className="input-group">
          <label>Password</label>
          <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••••••" />
        </div>

        <button type="submit" className="auth-btn btn-hover-grow" disabled={isLoading}>
          {isLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-footer">
        {authMode === 'login' ? (
          <span>Account nahi hai? <span className="auth-link" onClick={() => setAuthMode('register')}>Naya banayein</span></span>
        ) : (
          <span>Pehle se account hai? <span className="auth-link" onClick={() => setAuthMode('login')}>Login karein</span></span>
        )}
      </div>
    </div>
  );
};

export default Auth;
