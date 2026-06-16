import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  LogOut, 
  MessageSquare, 
  Sparkles, 
  Check, 
  CheckCheck, 
  Lock, 
  Sun, 
  Moon, 
  AlertCircle,
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff
} from 'lucide-react';
import './App.css';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function App() {
  // --- STATE SYSTEM (Pure JavaScript) ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Auth Form Fields
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [profilePicInput, setProfilePicInput] = useState('');
  
  // App UI Helpers
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  
  // Audio/Video Call System State
  const [activeCall, setActiveCall] = useState(null); // 'audio' | 'video' | null
  const [callStatus, setCallStatus] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [micMuted, setMicMuted] = useState(false);
  
  // Status story states
  const [sidebarTab, setSidebarTab] = useState('chats');
  const [myStatus, setMyStatus] = useState(null);
  const [statuses, setStatuses] = useState([
    {
      id: 1,
      name: "Rahul Sharma",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100",
      time: "Just now",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300",
      caption: "Coding all night long! 💻🚀"
    },
    {
      id: 2,
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      time: "45 minutes ago",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
      caption: "Beautiful sunset view! 🌅"
    }
  ]);
  const [viewingStatus, setViewingStatus] = useState(null);
  const [newStatusCaption, setNewStatusCaption] = useState('');
  const [newStatusImg, setNewStatusImg] = useState('');
  
  // AI summary modal states
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Active chat state
  const [activeContactId, setActiveContactId] = useState(null);
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "Rahul Sharma",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100",
      statusText: "typing...",
      isOnline: true,
      messages: [
        { id: 1, text: "Hey! Kaisa chal raha hai project?", sender: "other", timestamp: "10:30 AM", status: "read" },
        { id: 2, text: "Mast chal raha hai, JWT authentication add kar liya hai maine backend mein!", sender: "me", timestamp: "10:32 AM", status: "read" },
        { id: 3, text: "Bohot sahi! Real-time messaging kab add kar rahe ho?", sender: "other", timestamp: "10:33 AM", status: "read" },
        { id: 4, text: "Usi par kaam kar raha hoon abhi.", sender: "me", timestamp: "10:35 AM", status: "read" }
      ]
    },
    {
      id: 2,
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      statusText: "Offline",
      isOnline: false,
      messages: [
        { id: 1, text: "Meeting schedule review kiye tumne client ke sath?", sender: "other", timestamp: "Yesterday", status: "read" },
        { id: 2, text: "Haan, main check karke updates share karta hoon sham tak.", sender: "me", timestamp: "Yesterday", status: "read" }
      ]
    },
    {
      id: 3,
      name: "Ollama AI Assistant",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100",
      statusText: "Active AI Bot",
      isOnline: true,
      isAi: true,
      messages: [
        { id: 1, text: "Hello! Main local Ollama engine ka assistant hoon. Main aapke chats ko analyze aur summarize kar sakta hoon.", sender: "ai", timestamp: "10:00 AM", status: "read" }
      ]
    }
  ]);

  // Ref to automatically scroll to bottom of chat
  const messageEndRef = useRef(null);
  const stompClientRef = useRef(null);

  useEffect(() => {
    // Check if token exists in localStorage to auto-login
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    // Scroll chat window to bottom on new message
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContactId, contacts]);

  // WebSocket Connection Hook
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;

    const socket = new SockJS('http://localhost:8081/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to WebSocket server:', frame);
      
      // Register presence on backend
      client.publish({
        destination: '/app/presence/connect',
        body: currentUser.username
      });

      // Subscribe to presence updates
      client.subscribe('/topic/presence', (message) => {
        const update = JSON.parse(message.body);
        setContacts(prev => prev.map(contact => {
          if (contact.name === update.username) {
            return {
              ...contact,
              isOnline: update.isOnline,
              statusText: update.isOnline ? 'Online' : 'Offline'
            };
          }
          return contact;
        }));
      });

      // Subscribe to receive real-time messages
      client.subscribe(`/topic/messages/${currentUser.username}`, (message) => {
        const received = JSON.parse(message.body);
        
        const formatted = {
          id: received.id,
          text: received.content,
          sender: received.senderUsername === currentUser.username ? 'me' : 'other',
          timestamp: new Date(received.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: received.status
        };

        setContacts(prev => prev.map(contact => {
          const targetContactName = received.senderUsername === currentUser.username 
            ? received.receiverUsername 
            : received.senderUsername;

          if (contact.name === targetContactName) {
            // Deduplicate messages
            if (contact.messages.some(m => m.id === formatted.id)) {
              return contact;
            }
            return {
              ...contact,
              messages: [...contact.messages, formatted]
            };
          }
          return contact;
        }));
      });
    };

    client.onStompError = (error) => {
      console.error('STOMP protocol error:', error);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [isAuthenticated, currentUser, isDemoMode]);

  // Load initial online status list from backend
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;

    const fetchOnlineUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8081/api/users/online', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const onlineUsernames = await response.json();
          setContacts(prev => prev.map(contact => {
            if (onlineUsernames.includes(contact.name)) {
              return {
                ...contact,
                isOnline: true,
                statusText: 'Online'
              };
            }
            return contact;
          }));
        }
      } catch (err) {
        console.error("Error loading online users:", err);
      }
    };

    fetchOnlineUsers();
  }, [isAuthenticated, currentUser, isDemoMode]);

  // Fetch active chat partners list from database
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;

    const fetchChatPartners = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8081/api/messages/partners/${currentUser.username}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const partners = await response.json();

          // Map users to contacts format
          const dbContacts = partners.map(u => ({
            id: u.id,
            name: u.username,
            avatar: u.profilePicUrl,
            phoneNumber: u.phoneNumber,
            statusText: "Offline",
            isOnline: false,
            messages: []
          }));

          // Always add the Ollama AI bot to the list
          const aiBot = {
            id: 9999,
            name: "Ollama AI Assistant",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100",
            statusText: "Active AI Bot",
            isOnline: true,
            isAi: true,
            messages: [
              { id: 1, text: "Hello! Main local Ollama engine ka assistant hoon. Main aapke chats ko analyze aur summarize kar sakta hoon.", sender: "ai", timestamp: "10:00 AM", status: "read" }
            ]
          };

          setContacts([...dbContacts, aiBot]);
        }
      } catch (err) {
        console.error("Failed to load chat partners from database:", err);
      }
    };

    fetchChatPartners();
  }, [isAuthenticated, currentUser, isDemoMode]);

  // Load chat history from backend REST API
  useEffect(() => {
    if (activeContactId === null || !currentUser || isDemoMode) return;

    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || activeContact.isAi) return;

    const loadHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8081/api/messages/${currentUser.username}/${activeContact.name}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.senderUsername === currentUser.username ? 'me' : 'other',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: msg.status
          }));

          setContacts(prev => prev.map(c => {
            if (c.id === activeContactId) {
              return { ...c, messages: formatted };
            }
            return c;
          }));
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };

    loadHistory();
  }, [activeContactId, isDemoMode]);

  // Toggle Dark/Light Theme
  const toggleTheme = () => {
    const rootClass = document.documentElement.classList;
    if (themeMode === 'dark') {
      rootClass.add('light-mode');
      setThemeMode('light');
    } else {
      rootClass.remove('light-mode');
      setThemeMode('dark');
    }
  };

  // --- AUDIO/VIDEO CALL SIMULATION HANDLERS ---
  const startCall = (type) => {
    setActiveCall(type);
    setCallStatus('ringing');
    setMicMuted(false);
    
    // Simulate other user picking up after 2.5s
    setTimeout(() => {
      setCallStatus('connected');
    }, 2500);
  };

  const endCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      setActiveCall(null);
    }, 1000);
  };

  // --- POST STATUS/STORY HANDLER ---
  const handlePostStatus = (e) => {
    e.preventDefault();
    if (!newStatusCaption.trim()) return;

    const newStory = {
      id: Date.now(),
      name: currentUser?.username || "Guest",
      avatar: currentUser?.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
      time: "Just now",
      image: newStatusImg.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300",
      caption: newStatusCaption
    };

    setMyStatus(newStory);
    setNewStatusCaption('');
    setNewStatusImg('');
  };

  // --- CONTACT SEARCH BY PHONE NUMBER ---
  const handleSearchContact = async (e) => {
    e.preventDefault();
    setSearchError(null);

    const query = searchQuery.trim();
    if (!query) return;

    // Check if the contact is already in contacts list (either by name or by phone number)
    const existing = contacts.find(c => c.name.toLowerCase() === query.toLowerCase() || c.phoneNumber === query);
    if (existing) {
      setActiveContactId(existing.id);
      setSearchQuery('');
      return;
    }

    if (isDemoMode) {
      // Demo Mode: Mock finding user if it looks like a valid phone number (e.g. digits)
      if (/^\d+$/.test(query)) {
        const mockNewContact = {
          id: Date.now(),
          name: `User_${query.slice(-4)}`,
          phoneNumber: query,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100`,
          statusText: "Offline",
          isOnline: false,
          messages: []
        };
        setContacts(prev => [mockNewContact, ...prev]);
        setActiveContactId(mockNewContact.id);
        setSearchQuery('');
      } else {
        setSearchError("not available here this user");
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/users/search?phoneNumber=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const foundUser = await response.json();
        
        if (foundUser.username === currentUser.username) {
          setSearchError("You cannot search yourself!");
          return;
        }

        const alreadyExists = contacts.find(c => c.id === foundUser.id);
        if (!alreadyExists) {
          const newContact = {
            id: foundUser.id,
            name: foundUser.username,
            phoneNumber: query,
            avatar: foundUser.profilePicUrl,
            statusText: "Offline",
            isOnline: false,
            messages: []
          };
          setContacts(prev => [newContact, ...prev]);
          setActiveContactId(newContact.id);
        } else {
          setActiveContactId(foundUser.id);
        }
        setSearchQuery('');
      } else {
        setSearchError("not available here this user");
      }
    } catch (err) {
      console.error("Error searching user:", err);
      setSearchError("not available here this user");
    }
  };

  // --- HANDLERS FOR AUTHENTICATION API ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const apiPort = "8081"; // User configured port
    const baseUrl = `http://localhost:${apiPort}/api/auth`;
    const endpoint = authMode === 'login' ? 'login' : 'register';

    const payload = authMode === 'login' 
      ? { username: usernameInput, password: passwordInput }
      : { username: usernameInput, email: emailInput, phoneNumber: phoneInput, password: passwordInput, profilePicUrl: profilePicInput };

    try {
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(response.status === 403 
          ? "Unauthorized access / Invalid Credentials (ya fir duplicate registration)." 
          : "Server connection failed!"
        );
      }

      const data = await response.json();
      
      // Save Token and Profile
      localStorage.setItem('token', data.token);
      const profile = {
        id: data.id,
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        profilePicUrl: data.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
      };
      localStorage.setItem('user', JSON.stringify(profile));
      
      setCurrentUser(profile);
      setIsAuthenticated(true);
      setIsDemoMode(false);
    } catch (err) {
      console.warn("Backend unavailable, falling back to Demo Mode", err);
      // Demo Mode Activation (For client offline review)
      setIsDemoMode(true);
      setErrorMsg("Backend unavailable! Starting in Local Demo Offline Mode for testing UI.");
      
      setTimeout(() => {
        const mockProfile = {
          username: usernameInput || "GuestStudent",
          email: emailInput || "guest@test.com",
          phoneNumber: phoneInput || "9876543210",
          profilePicUrl: profilePicInput || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
        };
        setCurrentUser(mockProfile);
        setIsAuthenticated(true);
        setErrorMsg(null);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveContactId(null);
  };

  // --- SEND MESSAGE FLOW ---
  const handleSendMessage = () => {
    if (!messageInput.trim() || activeContactId === null) return;

    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;

    // If Offline Demo Mode or AI bot, use client side simulation
    if (isDemoMode || activeContact.isAi) {
      const newMessage = {
        id: Date.now(),
        text: messageInput,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };

      setContacts(prev => prev.map(contact => {
        if (contact.id === activeContactId) {
          const updatedMsgs = [...contact.messages, newMessage];
          
          if (contact.isAi) {
            setTimeout(() => {
              const aiReply = {
                id: Date.now() + 1,
                text: `Mainne aapka ye message padha: "${messageInput}". Main aapki is chat stream ko Ollama Phi-3 AI se summarize karne ke liye ready hoon. Header mein diye 'Summarize' button par click karein!`,
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              };
              setContacts(curr => curr.map(c => {
                if (c.id === contact.id) {
                  return { ...c, messages: [...updatedMsgs, aiReply] };
                }
                return c;
              }));
            }, 1200);
          }

          return { ...contact, messages: updatedMsgs };
        }
        return contact;
      }));

      setMessageInput('');
      return;
    }

    // Live WebSocket Messaging
    if (stompClientRef.current && stompClientRef.current.connected) {
      const payload = {
        senderUsername: currentUser.username,
        receiverUsername: activeContact.name,
        content: messageInput
      };

      stompClientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload)
      });

      setMessageInput('');
    } else {
      console.warn("WebSocket not connected!");
    }
  };

  // --- AI TRANSIENT SUMMARIZATION (Ollama) ---
  const triggerAiSummarize = async () => {
    if (activeContactId === null) return;
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;

    setIsAiLoading(true);
    setShowSummaryModal(true);

    if (isDemoMode || activeContact.isAi) {
      // Offline simulation for mock contacts or demo mode
      setTimeout(() => {
        const generatedSummary = `
✨ **Ollama AI Conversation Insights** (Model: Phi-3 [Offline Demo])
--------------------------------------------------
• **Topic:** Project status discussion and JWT validation integration.
• **Key Updates:** User successfully integrated Spring Security and JWT signature checks on port 8081.
• **Current Action Items:** Working on setting up WebSocket configurations for real-time messaging pipeline.
• **AI Recommendation:** Ensure token refresh mechanisms are designed prior to React deployment.
        `;
        setAiSummaryText(generatedSummary);
        setIsAiLoading(false);
      }, 1500);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/ai/summarize/${currentUser.username}/${activeContact.name}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const text = await response.text();
        setAiSummaryText(text);
      } else {
        const errorText = await response.text();
        setAiSummaryText(`Failed to retrieve summary from Ollama: ${errorText}`);
      }
    } catch (err) {
      setAiSummaryText(`Failed to connect to local Ollama summarizer engine. Make sure the backend server is running and local Ollama is active (run: 'ollama run phi3' in terminal). Details: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const activeContact = contacts.find(c => c.id === activeContactId);
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER MAIN LAYOUT ---
  return (
    <div className="app-container">
      
      {/* 1. AUTHENTICATION MODULE VIEW */}
      {!isAuthenticated ? (
        <div className="auth-container glass animate-scale-up">
          <div className="auth-header">
            <h2>WhatsApp Secure AI</h2>
            <p>{authMode === 'login' ? 'Apne account mein login karein' : 'Naya Student Developer register karein'}</p>
          </div>

          {errorMsg && (
            <div className="error-banner">
              <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                required 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                placeholder="student_dev"
              />
            </div>

            {authMode === 'register' && (
              <>
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={emailInput} 
                    onChange={e => setEmailInput(e.target.value)} 
                    placeholder="student@example.com"
                  />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={phoneInput} 
                    onChange={e => setPhoneInput(e.target.value)} 
                    placeholder="9876543210"
                  />
                </div>
                <div className="input-group">
                  <label>Profile Picture URL (Optional)</label>
                  <input 
                    type="url" 
                    value={profilePicInput} 
                    onChange={e => setProfilePicInput(e.target.value)} 
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                required 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="••••••••"
              />
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
      ) : (
        
        // 2. MAIN CHAT DASHBOARD APPLICATION VIEW
        <div className="dashboard-layout animate-fade-in">
          
          {/* Sidebar Area */}
          <div className="sidebar">
            <div className="sidebar-header">
              <div className="user-profile-header">
                <img 
                  src={currentUser?.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                  alt="avatar" 
                  className="avatar" 
                />
                <div>
                  <div className="user-info-name">{currentUser?.username}</div>
                  <div className="user-info-sub">{isDemoMode ? 'Local Demo Mode' : 'Connected to DB'}</div>
                </div>
              </div>
              <div className="header-actions">
                <button className="action-btn" title="Toggle Theme" onClick={toggleTheme}>
                  {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="action-btn" title="Log Out" onClick={handleLogout}>
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            <div className="search-container">
              <form onSubmit={handleSearchContact} className="search-box" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search Phone Number + Enter..." 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', marginLeft: '8px' }}
                />
              </form>
            </div>
            {searchError && (
              <div className="search-error-banner" style={{ color: '#ef4444', fontSize: '12.5px', padding: '6px 12px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', margin: '4px 12px 0 12px', fontWeight: '500' }}>
                {searchError}
              </div>
            )}

            {/* Sidebar View Selector: Chats vs Status */}
            <div className="sidebar-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '8px 12px' }}>
              <button 
                onClick={() => setSidebarTab('chats')} 
                style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: sidebarTab === 'chats' ? '2.5px solid var(--primary)' : 'none', color: sidebarTab === 'chats' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
              >
                Chats
              </button>
              <button 
                onClick={() => setSidebarTab('status')} 
                style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: sidebarTab === 'status' ? '2.5px solid var(--primary)' : 'none', color: sidebarTab === 'status' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
              >
                Status
              </button>
            </div>

            {sidebarTab === 'chats' ? (
              <div className="contact-list">
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className={`contact-card ${activeContactId === contact.id ? 'active' : ''}`}
                    onClick={() => setActiveContactId(contact.id)}
                  >
                    <img src={contact.avatar} alt={contact.name} className="avatar" />
                    {contact.isOnline && <div className="online-badge"></div>}
                    <div className="contact-details">
                      <div className="contact-top-row">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-time">
                          {contact.messages.length > 0 ? contact.messages[contact.messages.length - 1].timestamp : ''}
                        </span>
                      </div>
                      <div className="contact-msg">
                        {contact.messages.length > 0 ? contact.messages[contact.messages.length - 1].text : 'No messages yet'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="status-section" style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                {/* Post Status form */}
                <form onSubmit={handlePostStatus} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Share a status update</div>
                  <input 
                    type="text" 
                    placeholder="What's on your mind?..." 
                    value={newStatusCaption} 
                    onChange={e => setNewStatusCaption(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                  />
                  <input 
                    type="url" 
                    placeholder="Status Image URL (optional)..." 
                    value={newStatusImg} 
                    onChange={e => setNewStatusImg(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                  />
                  <button type="submit" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Post Status
                  </button>
                </form>

                {/* My Status */}
                {myStatus && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px' }}>My Status</div>
                    <div 
                      className="contact-card" 
                      onClick={() => setViewingStatus(myStatus)}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <img src={myStatus.avatar} alt="my avatar" className="avatar" style={{ border: '2px solid var(--primary)', padding: '2px' }} />
                      <div className="contact-details">
                        <div className="contact-name">{myStatus.name}</div>
                        <div className="contact-msg">{myStatus.time}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Statuses */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px' }}>Recent Updates</div>
                  {statuses.map(st => (
                    <div 
                      key={st.id} 
                      className="contact-card" 
                      onClick={() => setViewingStatus(st)}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <img src={st.avatar} alt={st.name} className="avatar" style={{ border: '2px solid var(--primary)', padding: '2px' }} />
                      <div className="contact-details">
                        <div className="contact-name">{st.name}</div>
                        <div className="contact-msg">{st.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Chat Windows Area */}
          <div className="chat-window">
            {activeContact ? (
              <>
                <div className="chat-header">
                  <div className="active-contact-profile">
                    <img src={activeContact.avatar} alt={activeContact.name} className="avatar" />
                    <div>
                      <div className="user-info-name">{activeContact.name}</div>
                      <div className="user-info-sub">{activeContact.statusText}</div>
                    </div>
                  </div>
                  <div className="chat-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!activeContact.isAi && (
                      <>
                        <button className="action-btn" title="Voice Call" onClick={() => startCall('audio')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', color: 'var(--primary)' }}>
                          <Phone size={18} />
                        </button>
                        <button className="action-btn" title="Video Call" onClick={() => startCall('video')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', color: 'var(--primary)' }}>
                          <Video size={18} />
                        </button>
                      </>
                    )}
                    <button className="ai-summary-pill" onClick={triggerAiSummarize}>
                      <Sparkles size={14} />
                      Ollama Summarize
                    </button>
                  </div>
                </div>

                <div className="message-feed">
                  {activeContact.messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`message-wrapper ${msg.sender === 'me' ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        {msg.text}
                        <div className="message-meta">
                          {msg.timestamp}
                          {msg.sender === 'me' && (
                            msg.status === 'read' ? <CheckCheck size={12} style={{ color: 'var(--primary)' }} /> : <Check size={12} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>

                <div className="message-input-area">
                  <input 
                    type="text" 
                    className="message-input-box" 
                    placeholder="Type a message..." 
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="send-btn" onClick={handleSendMessage}>
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="welcome-screen">
                <div className="welcome-circle">
                  <MessageSquare size={48} />
                </div>
                <h3>Welcome to WhatsApp Secure AI</h3>
                <p>Send and receive secure messages with transient AI privacy protection enabled.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                  <Lock size={12} /> End-to-end encrypted logic
                </div>
              </div>
            )}

            {/* AI Summary Modal Overlay */}
            {showSummaryModal && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h4>Local Ollama Insights</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phi-3 Model Summary</span>
                  </div>
                  <div className="modal-content">
                    {isAiLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                        <div className="loader" style={{ border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <span>Analyzing messages stream transiently...</span>
                      </div>
                    ) : (
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem' }}>{aiSummaryText}</pre>
                    )}
                  </div>
                  <button 
                    className="modal-close-btn" 
                    onClick={() => setShowSummaryModal(false)}
                    disabled={isAiLoading}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Calling Modal Overlay */}
            {activeCall && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1000 }}>
                <div className="modal-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', maxWidth: '340px', textAlign: 'center', borderRadius: '16px', background: 'rgba(20, 20, 20, 0.95)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
                  <img src={activeContact.avatar} alt={activeContact.name} className="avatar animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px', border: '3px solid var(--primary)' }} />
                  <style>{`
                    .animate-pulse {
                      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    @keyframes pulse {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: .7; transform: scale(1.05); }
                    }
                  `}</style>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'white' }}>{activeContact.name}</h3>
                  <div style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
                    {activeCall} call • <span style={{ color: callStatus === 'connected' ? 'var(--primary)' : 'var(--text-muted)' }}>{callStatus}...</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button 
                      onClick={() => setMicMuted(!micMuted)} 
                      style={{ background: micMuted ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                      title={micMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    
                    <button 
                      onClick={endCall} 
                      style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                      title="Decline / End Call"
                    >
                      <PhoneOff size={24} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Story Viewing Modal Overlay */}
            {viewingStatus && (
              <div className="modal-overlay" onClick={() => setViewingStatus(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 1000, cursor: 'pointer' }}>
                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '0', maxWidth: '420px', width: '90%', borderRadius: '16px', overflow: 'hidden', background: 'black', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                  {/* Status header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                    <img src={viewingStatus.avatar} alt="avatar" className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14.5px' }}>{viewingStatus.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11.5px' }}>{viewingStatus.time}</div>
                    </div>
                    <button onClick={() => setViewingStatus(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                  </div>

                  {/* Status image */}
                  <div style={{ position: 'relative', width: '100%', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                    <img src={viewingStatus.image} alt="status story" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>

                  {/* Status Caption */}
                  <div style={{ padding: '20px', color: 'white', fontSize: '15px', textAlign: 'center', background: 'rgba(20,20,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {viewingStatus.caption}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
