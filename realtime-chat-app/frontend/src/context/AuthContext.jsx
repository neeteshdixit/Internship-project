import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  // App load hone par current user fetch karna agar token present ho
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // First try to restore from localStorage cache (instant, no network)
      const cached = localStorage.getItem('currentUser');
      if (cached) {
        try {
          setCurrentUser(JSON.parse(cached));
          setIsAuthenticated(true);
          setLoading(false);
        } catch {}
      }

      try {
        const data = await apiFetch('/api/users/me');
        setCurrentUser(data);
        // Update localStorage cache with fresh data
        localStorage.setItem('currentUser', JSON.stringify(data));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Session expired or invalid token:', error);
        // Only logout if we couldn't restore from cache either
        if (!cached) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  // Login handler
  const login = async (username, password) => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
        // Also store user info for quick access
        localStorage.setItem('currentUser', JSON.stringify({
          id: response.id,
          username: response.username,
          email: response.email,
          phoneNumber: response.phoneNumber,
          profilePicUrl: response.profilePicUrl,
        }));
        setToken(response.token);
        setCurrentUser({
          id: response.id,
          username: response.username,
          email: response.email,
          phoneNumber: response.phoneNumber,
          profilePicUrl: response.profilePicUrl,
        });
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  // Register handler
  const register = async (userData) => {
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify({
          id: response.id,
          username: response.username,
          email: response.email,
          phoneNumber: response.phoneNumber,
          profilePicUrl: response.profilePicUrl,
        }));
        setToken(response.token);
        setCurrentUser({
          id: response.id,
          username: response.username,
          email: response.email,
          phoneNumber: response.phoneNumber,
          profilePicUrl: response.profilePicUrl,
        });
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Registration failed' };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Delete Account handler — account permanently delete karega
  const deleteAccount = async () => {
    try {
      await apiFetch('/api/users/me', { method: 'DELETE' });
      logout();
      return { success: true };
    } catch (error) {
      console.error('Account delete failed:', error);
      return { success: false, message: error.message || 'Account delete nahi ho saka' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};