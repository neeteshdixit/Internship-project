import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8081';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  // Auth Form Fields
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [profilePicInput, setProfilePicInput] = useState('');

  // UI helpers
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load basic token & profile info on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const baseUrl = `${API_BASE_URL}/api/auth`;
    const endpoint = authMode === 'login' ? 'login' : 'register';

    const payload = authMode === 'login'
      ? { identifier: usernameInput, password: passwordInput }
      : { username: usernameInput, email: emailInput, phoneNumber: phoneInput, password: passwordInput, profilePicUrl: profilePicInput };

    try {
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Server connection failed!';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
            if (errData.details) {
              const details = Object.entries(errData.details)
                .map(([field, msg]) => `${field}: ${msg}`)
                .join(', ');
              errorMessage += ` (${details})`;
            }
          }
        } catch (e) {
          if (response.status === 403) {
            errorMessage = 'Unauthorized access / Invalid Credentials (ya fir duplicate registration).';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      const profile = {
        id: data.id,
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        profilePicUrl: data.profilePicUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
      };
      localStorage.setItem('user', JSON.stringify(profile));
      setCurrentUser(profile);
      setIsAuthenticated(true);
      setIsDemoMode(false);
    } catch (err) {
      console.error('Authentication error:', err);
      setErrorMsg(err.message || 'Failed to authenticate. Server is unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = (stompClientRef) => {
    if (stompClientRef?.current) {
      stompClientRef.current.publish({
        destination: '/app/presence/disconnect',
        body: currentUser?.username || ''
      });
      stompClientRef.current.deactivate();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, setIsAuthenticated,
      authMode, setAuthMode,
      currentUser, setCurrentUser,
      usernameInput, setUsernameInput,
      emailInput, setEmailInput,
      phoneInput, setPhoneInput,
      passwordInput, setPasswordInput,
      profilePicInput, setProfilePicInput,
      errorMsg, setErrorMsg,
      isLoading,
      isDemoMode, setIsDemoMode,
      handleAuthSubmit,
      handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
