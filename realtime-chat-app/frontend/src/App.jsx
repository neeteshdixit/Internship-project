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
  MicOff,
  User as UserIcon,
  Trash2,
  Edit2,
  Paperclip,
  Smile,
  Star,
  Pin,
  Share2,
  Settings,
  Circle,
  Play,
  Volume2,
  VolumeX,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Activity,
  FileText
} from 'lucide-react';
import './App.css';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const API_BASE_URL = 'http://localhost:8081';


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
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'ringing' | 'connected' | 'ended' | 'connecting' | 'calling'
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [incomingCallSignal, setIncomingCallSignal] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState([]);
  
  // Left Navigation Sidebar tab select
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'status' | 'calls' | 'analytics' | 'settings'

  // Privacy states
  const [lastSeenVisibility, setLastSeenVisibility] = useState('EVERYONE');
  const [onlineVisibility, setOnlineVisibility] = useState('EVERYONE');
  const [profilePhotoVisibility, setProfilePhotoVisibility] = useState('EVERYONE');
  const [aboutVisibility, setAboutVisibility] = useState('EVERYONE');
  const [readReceipts, setReadReceipts] = useState(true);
  const [groupPrivacy, setGroupPrivacy] = useState('EVERYONE');
  const [callPrivacy, setCallPrivacy] = useState('EVERYONE');

  // Contact profile state
  const [showContactProfileModal, setShowContactProfileModal] = useState(false);
  const [profileAbout, setProfileAbout] = useState('Hey there! I am using WhatsApp.');
  
  // Status story states
  const [myStatuses, setMyStatuses] = useState([]);
  const [friendStatuses, setFriendStatuses] = useState([]);
  const [viewingStatusGroup, setViewingStatusGroup] = useState(null); // { username, avatar, updates }
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [newStatusCaption, setNewStatusCaption] = useState('');
  const [newStatusImg, setNewStatusImg] = useState('');
  const [statusType, setStatusType] = useState('text'); // 'text' | 'image' | 'video'
  const [statusTextBg, setStatusTextBg] = useState('#00a884'); // teal

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // AI Assistant Panel states
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiActiveFeature, setAiActiveFeature] = useState(null); // which feature is open
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOffline, setAiOffline] = useState(false);
  const [aiRewriteMode, setAiRewriteMode] = useState('professional');
  const [aiTranslateLang, setAiTranslateLang] = useState('Hindi');
  const [aiExplainLevel, setAiExplainLevel] = useState('beginner');
  const [aiCustomText, setAiCustomText] = useState('');
  const [aiSmartReplies, setAiSmartReplies] = useState([]);
  const [aiCopied, setAiCopied] = useState(false);
  // AI conversational chat
  const [aiChatMode, setAiChatMode] = useState(false); // true = chat with AI, false = feature panel
  const [aiChatMessages, setAiChatMessages] = useState([]); // [{role:'user'|'assistant', text:''}]
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);

  // Appearance & Personalization Settings
  const [chatWallpaper, setChatWallpaper] = useState('default'); // 'default', 'teal', 'blue', 'purple', 'sunset', 'minimal'
  const [fontSize, setFontSize] = useState('medium'); // 'small', 'medium', 'large'
  const [bubbleStyle, setBubbleStyle] = useState('standard'); // 'standard', 'modern', 'minimal'

  // Scheduled message states
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Contact Label & Filter states
  const [selectedLabelFilter, setSelectedLabelFilter] = useState('ALL'); // 'ALL', 'FAVORITES', 'ARCHIVED', 'MUTED', 'BLOCKED', 'FAMILY', 'WORK'
  const [contactLabelInput, setContactLabelInput] = useState('');

  // Reply message state
  const [replyToMsg, setReplyToMsg] = useState(null); // message object

  // Forward message state
  const [forwardingMsg, setForwardingMsg] = useState(null); // message object
  const [showForwardModal, setShowForwardModal] = useState(false);

  // Active chat search
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);

  // AI summary modal states
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Profile edit modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Typing status registry
  const [typingStates, setTypingStates] = useState({}); // { username: 'typing' | 'recording' | 'idle' }
  const typingTimeoutRef = useRef(null);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // AI settings, transparency and report state
  const [aiSettings, setAiSettings] = useState({
    preferredProvider: 'AUTO',
    askPermissionEveryTime: true,
    alwaysAllowCloud: false,
    disableCloudAi: false,
    preferLocalProcessing: true,
    neverAutomaticallySendToCloud: true,
    showPrivacyNoticeBeforeCloud: true
  });
  const [aiTransparencyData, setAiTransparencyData] = useState(null);
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);
  const [showPrivacyPermissionModal, setShowPrivacyPermissionModal] = useState(false);
  const [pendingAiFeature, setPendingAiFeature] = useState(null);
  const [latestAiReport, setLatestAiReport] = useState(null);

  // Active chat state
  const [activeContactId, setActiveContactId] = useState(null);
  const [contacts, setContacts] = useState([]);

  const activeContactIdRef = useRef(activeContactId);
  const contactsRef = useRef(contacts);

  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Ref to automatically scroll to bottom of chat
  const messageEndRef = useRef(null);
  const aiChatEndRef = useRef(null);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, aiChatLoading]);

  // Audio elements for ringtone
  const ringingAudioRef = useRef(null);

  // Call state and timeout refs to prevent stale closure in event handlers
  const activeCallRef = useRef(activeCall);
  const callStatusRef = useRef(callStatus);
  const incomingCallSignalRef = useRef(incomingCallSignal);
  const callTimeoutRef = useRef(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    incomingCallSignalRef.current = incomingCallSignal;
  }, [incomingCallSignal]);

  // Call duration counter effect
  useEffect(() => {
    let interval = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  // Load basic token & profile info
  useEffect(() => {
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

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
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
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch updated profile for this user to respect privacy settings
        fetch(`http://localhost:8081/api/users/${update.username}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(profileData => {
          setContacts(prev => prev.map(c => {
            const contactUsername = c.username || c.name || '';
            if (contactUsername.toLowerCase().trim() === update.username.toLowerCase().trim()) {
              return {
                ...c,
                avatar: profileData.avatar,
                statusText: profileData.lastSeen,
                isOnline: profileData.isOnline,
                about: profileData.about
              };
            }
            return c;
          }));
        })
        .catch(err => console.error("Error updating presence profile:", err));
      });

      // Subscribe to typing signals
      client.subscribe(`/topic/typing/${currentUser.username}`, (message) => {
        const typingSignal = JSON.parse(message.body);
        setTypingStates(prev => ({
          ...prev,
          [typingSignal.senderUsername]: typingSignal.status
        }));
      });

      // Subscribe to receive real-time WebRTC calling signals
      client.subscribe(`/topic/calls/${currentUser.username}`, async (message) => {
        const signal = JSON.parse(message.body);
        console.log("Received call signal:", signal);

        if (signal.type === 'offer') {
          // Feature 7: Busy State
          if (activeCallRef.current || callStatusRef.current === 'ringing' || callStatusRef.current === 'calling' || callStatusRef.current === 'connecting' || callStatusRef.current === 'connected') {
            stompClientRef.current.publish({
              destination: '/app/call/signal',
              body: JSON.stringify({
                senderUsername: currentUser.username,
                receiverUsername: signal.senderUsername,
                type: 'busy',
                callType: signal.callType
              })
            });
            return;
          }

          setActiveCall(signal.callType);
          setCallStatus('ringing');
          setIncomingCallSignal(signal);
          // Play ringtone on receiver device
          playRingtone();

          // Feature 6: Call Timeout for Receiver (30 seconds)
          if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = setTimeout(() => {
            if (callStatusRef.current === 'ringing') {
              console.log("Receiver call timeout reached");
              stompClientRef.current.publish({
                destination: '/app/call/signal',
                body: JSON.stringify({
                  senderUsername: currentUser.username,
                  receiverUsername: signal.senderUsername,
                  type: 'reject'
                })
              });
              saveCallLog(signal.senderUsername, signal.callType, 'missed', 0);
              cleanupCall();
            }
          }, 30000);

          // Feature 3: Ringing State feedback to caller
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({
              senderUsername: currentUser.username,
              receiverUsername: signal.senderUsername,
              type: 'ringing',
              callType: signal.callType
            })
          });

        } else if (signal.type === 'ringing') {
          // Caller receives ringing notification
          setCallStatus('ringing');
          // Play ringtone on caller side to show it's ringing
          playRingtone();

        } else if (signal.type === 'answer') {
          stopRingtone();
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: signal.sdp
            }));
            setCallStatus('connected');
          }
        } else if (signal.type === 'candidate') {
          if (peerConnectionRef.current && signal.candidate) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.error("Error adding ice candidate:", e);
            }
          }
        } else if (signal.type === 'reject') {
          stopRingtone();
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
          setCallStatus('ended');
          cleanupCall();
          alert("Call Declined");
        } else if (signal.type === 'busy') {
          stopRingtone();
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
          setCallStatus('ended');
          cleanupCall();
          alert("User is currently on another call.");
        } else if (signal.type === 'end') {
          stopRingtone();
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
          // Feature 5: Missed Call Logic (if caller cancels before receiver answers)
          if (callStatusRef.current === 'ringing') {
            saveCallLog(signal.senderUsername, signal.callType || 'audio', 'missed', 0);
          }
          setCallStatus('ended');
          cleanupCall();
        }
      });

      // Subscribe to receive real-time messages
      client.subscribe(`/topic/messages/${currentUser.username}`, (message) => {
        const received = JSON.parse(message.body);
        
        if (received.content === "DELETED") {
          setContacts(prev => prev.map(contact => {
            return {
              ...contact,
              messages: contact.messages.map(m => m.id === received.id ? { ...m, text: "DELETED" } : m)
            };
          }));
          return;
        }

        const formatted = {
          id: received.id,
          text: received.content,
          sender: received.senderUsername === currentUser.username ? 'me' : 'other',
          timestamp: new Date(received.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: received.status,
          parentMessageId: received.parentMessageId,
          parentMessageText: received.parentMessageText,
          parentMessageSender: received.parentMessageSender,
          isForwarded: received.isForwarded,
          isStarred: received.isStarred,
          isPinned: received.isPinned,
          reactions: received.reactions,
          isMedia: received.isMedia,
          mediaUrl: received.mediaUrl,
          mediaType: received.mediaType,
          fileName: received.fileName,
          fileSize: received.fileSize,
          messageType: received.messageType,
          callType: received.callType,
          callStatus: received.callStatus,
          callDuration: received.callDuration,
          callStartedAt: received.callStartedAt,
          callEndedAt: received.callEndedAt
        };

        if (received.groupId) {
          formatted.senderUsername = received.senderUsername;
          setContacts(prev => prev.map(contact => {
            if (contact.isGroup && contact.groupId === received.groupId) {
              if (contact.messages.some(m => m.id === formatted.id)) {
                return {
                  ...contact,
                  messages: contact.messages.map(m => m.id === formatted.id ? formatted : m)
                };
              }
              return {
                ...contact,
                messages: [...contact.messages, formatted]
              };
            }
            return contact;
          }));
        } else {
          const targetContactUsername = received.senderUsername === currentUser.username 
            ? received.receiverUsername 
            : received.senderUsername;

          const contactExists = contactsRef.current.some(c => {
            const cu = c.username || c.name || '';
            return cu.toLowerCase().trim() === targetContactUsername.toLowerCase().trim();
          });

          if (!contactExists) {
            // Fetch contact details from server and add to list!
            fetch(`http://localhost:8081/api/users/${targetContactUsername}/profile`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            .then(res => res.ok ? res.json() : null)
            .then(profileData => {
              const newContact = {
                id: profileData ? profileData.id : Date.now(),
                username: targetContactUsername,
                name: targetContactUsername,
                avatar: (profileData && profileData.avatar) ? profileData.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
                phoneNumber: profileData ? profileData.phoneNumber : '',
                statusText: (profileData && profileData.lastSeen) ? profileData.lastSeen : "Offline",
                isOnline: profileData ? profileData.isOnline : false,
                messages: [formatted],
                isFavorite: false,
                isBlocked: false,
                isPinned: false,
                isArchived: false,
                isMuted: false,
                label: 'NONE'
              };
              setContacts(prev => {
                if (!prev.some(c => (c.username || '').toLowerCase() === targetContactUsername.toLowerCase())) {
                  return [newContact, ...prev];
                }
                return prev;
              });
            })
            .catch(e => console.error("Error fetching incoming contact profile:", e));
          } else {
            setContacts(prev => prev.map(contact => {
              const contactUsername = contact.username || contact.name || '';
              if (contactUsername.toLowerCase().trim() === targetContactUsername.toLowerCase().trim()) {
                // Deduplicate messages
                if (contact.messages.some(m => m.id === formatted.id)) {
                  return {
                    ...contact,
                    messages: contact.messages.map(m => m.id === formatted.id ? formatted : m)
                  };
                }
                return {
                  ...contact,
                  messages: [...contact.messages, formatted]
                };
              }
              return contact;
            }));
          }
        }

        // If we are currently viewing the chat of the sender, mark it read immediately!
        const currentActiveContactId = activeContactIdRef.current;
        if (currentActiveContactId) {
          const activeContact = contactsRef.current.find(c => c.id === currentActiveContactId);
          const activeContactUsername = activeContact ? (activeContact.username || activeContact.name || '') : '';
          if (activeContact && activeContactUsername.toLowerCase().trim() === received.senderUsername.toLowerCase().trim()) {
            fetch(`http://localhost:8081/api/messages/read/${received.senderUsername}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }).catch(e => console.error("Error marking msg read:", e));
          }
        }
      });

      client.subscribe(`/topic/messages/read/${currentUser.username}`, (message) => {
        const readReceipt = JSON.parse(message.body);
        setContacts(prev => prev.map(contact => {
          const contactUsername = contact.username || contact.name || '';
          if (contactUsername.toLowerCase().trim() === readReceipt.receiverUsername.toLowerCase().trim()) {
            return {
              ...contact,
              messages: contact.messages.map(m => m.sender === 'me' ? { ...m, status: 'read' } : m)
            };
          }
          return contact;
        }));
      });

      // Real-time call history updates — server pushes per-user entry
      client.subscribe(`/topic/callhistory/${currentUser.username}`, (message) => {
        const entry = JSON.parse(message.body);
        setCallHistory(prev => {
          const exists = prev.some(e => e.id === entry.id);
          if (exists) return prev;
          return [entry, ...prev];
        });
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

  // Ringtone playing helpers
  const playRingtone = () => {
    try {
      if (!ringingAudioRef.current) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // We will schedule node changes in a loop using an interval
        const playRingSequence = () => {
          const now = audioCtx.currentTime;
          
          // Helper to create a single ring pulse
          const createPulse = (startTime, duration) => {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc1.type = 'sine';
            osc1.frequency.value = 440; // mix 440Hz and 480Hz
            osc2.type = 'sine';
            osc2.frequency.value = 480;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.04, startTime + 0.05); // soft volume
            gainNode.gain.setValueAtTime(0.04, startTime + duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc1.start(startTime);
            osc1.stop(startTime + duration);
            osc2.start(startTime);
            osc2.stop(startTime + duration);
            
            return { osc1, osc2, gainNode };
          };

          // US Telephone Ringback Rhythm: 0.8s ring, 0.4s pause, 0.8s ring
          createPulse(now, 0.8);
          createPulse(now + 1.2, 0.8);
        };

        // Start immediately
        playRingSequence();

        // Loop every 4 seconds
        const ringInterval = setInterval(playRingSequence, 4000);

        ringingAudioRef.current = { audioCtx, ringInterval };
      }
    } catch (e) {
      console.warn("Could not start calling ringtone sound.", e);
    }
  };

  const stopRingtone = () => {
    if (ringingAudioRef.current) {
      try {
        clearInterval(ringingAudioRef.current.ringInterval);
        ringingAudioRef.current.audioCtx.close();
      } catch (e) {}
      ringingAudioRef.current = null;
    }
  };

  // --- WHATSAPP CALL MESSAGES HELPERS ---
  const getCallMessagePreview = (msg) => {
    const isVideo = msg.callType === 'VIDEO';
    const isMissed = msg.callStatus === 'MISSED' || msg.callStatus === 'REJECTED';
    const prefix = isVideo ? '📹' : '📞';
    if (isMissed) {
      return `${prefix} Missed ${isVideo ? 'Video' : 'Voice'} Call`;
    }
    const durationMin = Math.floor((msg.callDuration || 0) / 60);
    const durationSec = (msg.callDuration || 0) % 60;
    const durationStr = `${String(durationMin).padStart(2, '0')}:${String(durationSec).padStart(2, '0')}`;
    return `${prefix} ${isVideo ? 'Video' : 'Voice'} Call • ${durationStr}`;
  };

  const getCallMessageConfig = (msg) => {
    const isVideo = msg.callType === 'VIDEO';
    const isMe = msg.sender === 'me';
    const status = msg.callStatus ? msg.callStatus.toUpperCase() : 'MISSED';

    let icon = isVideo ? <Video size={16} /> : <Phone size={16} />;
    let color = 'var(--text-light)';
    let label = '';
    let showDuration = false;
    let showCallback = false;

    if (status === 'CONNECTED' || status === 'COMPLETED') {
      color = '#22c55e'; // Green
      label = isMe 
        ? (isVideo ? 'Outgoing Video Call' : 'Outgoing Voice Call')
        : (isVideo ? 'Incoming Video Call' : 'Incoming Voice Call');
      showDuration = true;
    } else if (status === 'MISSED') {
      color = '#ef4444'; // Red
      label = isVideo ? 'Missed Video Call' : 'Missed Voice Call';
      showCallback = true;
    } else if (status === 'REJECTED') {
      color = '#ef4444'; // Red
      label = isMe ? 'Declined Call' : (isVideo ? 'Missed Video Call' : 'Missed Voice Call');
      showCallback = !isMe;
    } else if (status === 'CANCELLED') {
      color = '#94a3b8'; // Grey
      label = isMe 
        ? (isVideo ? 'Cancelled Video Call' : 'Cancelled Voice Call')
        : (isVideo ? 'Missed Video Call' : 'Missed Voice Call');
      showCallback = !isMe;
    } else if (status === 'BUSY') {
      color = '#f97316'; // Orange
      label = isMe ? 'User Busy' : (isVideo ? 'Missed Video Call' : 'Missed Voice Call');
      showCallback = true;
    } else if (status === 'NO_ANSWER') {
      color = '#ef4444'; // Red
      label = 'No Answer';
      showCallback = true;
    } else if (status === 'OFFLINE') {
      color = '#94a3b8'; // Grey
      label = 'User Offline';
      showCallback = true;
    } else {
      label = isVideo ? 'Video Call' : 'Voice Call';
    }

    return { icon, color, label, showDuration, showCallback };
  };

  const handleCallCallback = (callType) => {
    startCall(callType.toLowerCase());
  };

  const renderCallMessageCard = (msg) => {
    const { icon, color, label, showDuration, showCallback } = getCallMessageConfig(msg);
    const timeStr = msg.timestamp;
    const durationMin = Math.floor((msg.callDuration || 0) / 60);
    const durationSec = (msg.callDuration || 0) % 60;
    const durationStr = `${String(durationMin).padStart(2, '0')}:${String(durationSec).padStart(2, '0')}`;

    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
          minWidth: '220px',
          cursor: 'pointer',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: '4px',
          marginBottom: '4px'
        }}
        onClick={() => handleCallCallback(msg.callType)}
        title="Click to call again"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color }}>
          {icon}
          <span style={{ fontSize: '13.5px', fontWeight: 'bold' }}>{label}</span>
        </div>
        
        {showDuration && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Duration: {durationStr}
          </div>
        )}
        
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
          {timeStr}
        </div>

        {showCallback && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCallCallback(msg.callType);
            }}
            style={{
              marginTop: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              alignSelf: 'flex-start',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            Call Again
          </button>
        )}
      </div>
    );
  };

  // Load call logs, scheduled messages, and statuses on component load/tab switch
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;

    if (sidebarTab === 'calls') {
      fetchCallHistory();
    } else if (sidebarTab === 'status') {
      fetchStatuses();
    } else if (sidebarTab === 'settings') {
      loadPrivacySettings();
      fetchAiSettings();
      fetchAiTransparency();
    }
  }, [sidebarTab, isAuthenticated, currentUser]);

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
          const onlineUsernamesLower = onlineUsernames.map(u => u.toLowerCase().trim());
          setContacts(prev => prev.map(contact => {
            const usernameLower = (contact.username || contact.name || '').toLowerCase().trim();
            if (onlineUsernamesLower.includes(usernameLower)) {
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

  const fetchAiSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8081/api/ai/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data);
      }
    } catch (e) {
      console.error("Error fetching AI settings:", e);
    }
  };

  const saveAiSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8081/api/ai/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data);
        fetchAiTransparency();
      }
    } catch (e) {
      console.error("Error saving AI settings:", e);
    }
  };

  const fetchAiTransparency = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8081/api/ai/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiTransparencyData(data);
      }
    } catch (e) {
      console.error("Error fetching AI transparency data:", e);
    }
  };

  const executeAiFeature = async (featureName, callback) => {
    try {
      const token = localStorage.getItem('token');
      const preflightRes = await fetch('http://localhost:8081/api/ai/preflight', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (preflightRes.ok) {
        const preflight = await preflightRes.json();
        if (preflight.requiresPermission) {
          setPendingAiFeature({ type: featureName, callback });
          setShowPrivacyPermissionModal(true);
          return;
        }
      }
    } catch (e) {
      console.error("Preflight check failed:", e);
    }
    callback();
  };

  // Fetch active chat partners & saved contacts list from database
  const fetchContactsAndPartners = async () => {
    if (!isAuthenticated || !currentUser || isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch saved contacts
      let savedContacts = [];
      try {
        const res = await fetch('http://localhost:8081/api/contacts', { headers });
        if (res.ok) {
          savedContacts = await res.json();
        }
      } catch (e) {
        console.error("Error fetching saved contacts:", e);
      }

      // Fetch active chat partners
      let partners = [];
      try {
        const res = await fetch(`http://localhost:8081/api/messages/partners/${currentUser.username}`, { headers });
        if (res.ok) {
          partners = await res.json();
        }
      } catch (e) {
        console.error("Error fetching partners:", e);
      }

      // Merge logic keeping unique users by userId
      const mergedMap = new Map();

      // Add saved contacts first
      savedContacts.forEach(c => {
        const partnerInfo = partners.find(p => p.id === c.contactUserId);
        const lastMsgArr = partnerInfo && partnerInfo.lastMessage ? [{
          id: `last-${c.contactUserId}`,
          text: partnerInfo.lastMessage,
          sender: partnerInfo.lastMessageSender === currentUser.username ? 'me' : 'other',
          timestamp: partnerInfo.lastMessageTimestamp ? new Date(partnerInfo.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          messageType: partnerInfo.lastMessageType || 'TEXT',
          callType: partnerInfo.lastCallType,
          callStatus: partnerInfo.lastCallStatus,
          callDuration: partnerInfo.lastCallDuration
        }] : [];

        mergedMap.set(c.contactUserId, {
          id: c.contactUserId,
          contactRecordId: c.id,
          username: c.name,
          name: c.customName || c.name,
          avatar: c.avatar,
          phoneNumber: c.phoneNumber,
          statusText: "Offline",
          isOnline: false,
          messages: lastMsgArr,
          isFavorite: c.favorite,
          isBlocked: c.blocked,
          isPinned: c.pinned,
          isArchived: c.archived,
          isMuted: c.muted,
          label: c.label || 'NONE'
        });
      });

      // Add partners (if not already added as a contact)
      partners.forEach(u => {
        if (!mergedMap.has(u.id)) {
          const lastMsgArr = u.lastMessage ? [{
            id: `last-${u.id}`,
            text: u.lastMessage,
            sender: u.lastMessageSender === currentUser.username ? 'me' : 'other',
            timestamp: u.lastMessageTimestamp ? new Date(u.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            messageType: u.lastMessageType || 'TEXT',
            callType: u.lastCallType,
            callStatus: u.lastCallStatus,
            callDuration: u.lastCallDuration
          }] : [];

          mergedMap.set(u.id, {
            id: u.id,
            contactRecordId: null,
            username: u.username,
            name: u.username,
            avatar: u.profilePicUrl,
            phoneNumber: u.phoneNumber,
            statusText: "Offline",
            isOnline: false,
            messages: lastMsgArr,
            isFavorite: false,
            isBlocked: false,
            isPinned: false,
            isArchived: false,
            isMuted: false,
            label: 'NONE'
          });
        }
      });

      const dbContacts = Array.from(mergedMap.values());

      // Fetch user's groups
      let userGroups = [];
      try {
        const res = await fetch('http://localhost:8081/api/groups', { headers });
        if (res.ok) {
          const rawGroups = await res.json();
          userGroups = rawGroups.map(g => ({
            id: `group-${g.id}`,
            groupId: g.id,
            name: g.name,
            username: `group-${g.id}`,
            avatar: g.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=100",
            statusText: g.members.map(m => m.username).join(', '),
            isOnline: true,
            isGroup: true,
            createdBy: g.createdBy,
            members: g.members,
            messages: g.lastMessage ? [{
              id: `last-g-${g.id}`,
              text: g.lastMessage,
              sender: 'other',
              timestamp: g.lastMessageTimestamp ? new Date(g.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            }] : [],
            isFavorite: false,
            isBlocked: false,
            isPinned: false,
            isArchived: false,
            isMuted: false,
            label: 'NONE'
          }));
        }
      } catch (e) {
        console.error("Error fetching groups:", e);
      }

      // Always add the Ollama AI bot to the list
      const aiBot = {
        id: 9999,
        username: "Ollama AI Assistant",
        name: "Ollama AI Assistant",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100",
        statusText: "Active AI Bot",
        isOnline: true,
        isAi: true,
        messages: [
          { id: 1, text: "Hello! Main local Ollama assistant hoon. Main aapke chats ko analyze aur summarize kar sakta hoon.", sender: "ai", timestamp: "10:00 AM", status: "read" }
        ],
        isFavorite: false,
        isBlocked: false,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        label: 'NONE'
      };

      // Personal Notes self-chat
      const notesChat = {
        id: currentUser.id,
        username: currentUser.username,
        name: `${currentUser.username} (You / Notes)`,
        avatar: currentUser.profilePicUrl,
        phoneNumber: currentUser.phoneNumber,
        statusText: "Personal Space",
        isOnline: true,
        isNotes: true,
        messages: [],
        isFavorite: true,
        isBlocked: false,
        isPinned: true,
        isArchived: false,
        isMuted: false,
        label: 'NONE'
      };

      setContacts([notesChat, ...userGroups, ...dbContacts, aiBot]);
    } catch (err) {
      console.error("Failed to load contacts from database:", err);
    }
  };

  useEffect(() => {
    fetchContactsAndPartners();
  }, [isAuthenticated, currentUser, isDemoMode]);

  // Load chat history from backend REST API
  useEffect(() => {
    if (activeContactId === null || !currentUser || isDemoMode) return;

    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || activeContact.isAi) return;

    const loadHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (activeContact.isGroup) {
          const response = await fetch(`http://localhost:8081/api/groups/${activeContact.groupId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            const formatted = data.map(msg => ({
              id: msg.id,
              text: msg.content,
              sender: msg.senderUsername === currentUser.username ? 'me' : 'other',
              senderUsername: msg.senderUsername,
              timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: msg.status,
              parentMessageId: msg.parentMessageId,
              parentMessageText: msg.parentMessageText,
              parentMessageSender: msg.parentMessageSender,
              isForwarded: msg.isForwarded,
              isStarred: msg.isStarred,
              isPinned: msg.isPinned,
              reactions: msg.reactions,
              isMedia: msg.isMedia,
              mediaUrl: msg.mediaUrl,
              mediaType: msg.mediaType,
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              messageType: msg.messageType
            }));

            setContacts(prev => prev.map(c => {
              if (c.id === activeContactId) {
                return { ...c, messages: formatted };
              }
              return c;
            }));
          }
          return;
        }

        // Fetch contact's profile details with privacy settings
        try {
          const profileResponse = await fetch(`http://localhost:8081/api/users/${activeContact.username || activeContact.name}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setContacts(prev => prev.map(c => {
              if (c.id === activeContactId) {
                return {
                  ...c,
                  avatar: profileData.avatar,
                  phoneNumber: profileData.phoneNumber,
                  statusText: profileData.lastSeen,
                  isOnline: profileData.isOnline,
                  about: profileData.about
                };
              }
              return c;
            }));
          }
        } catch (pe) {
          console.error("Error fetching contact profile:", pe);
        }

        // Fetch message history
        const response = await fetch(`http://localhost:8081/api/messages/${currentUser.username}/${activeContact.username || activeContact.name}`, {
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
            status: msg.status,
            parentMessageId: msg.parentMessageId,
            parentMessageText: msg.parentMessageText,
            parentMessageSender: msg.parentMessageSender,
            isForwarded: msg.isForwarded,
            isStarred: msg.isStarred,
            isPinned: msg.isPinned,
            reactions: msg.reactions,
            isMedia: msg.isMedia,
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaType,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            messageType: msg.messageType,
            callType: msg.callType,
            callStatus: msg.callStatus,
            callDuration: msg.callDuration,
            callStartedAt: msg.callStartedAt,
            callEndedAt: msg.callEndedAt
          }));

          setContacts(prev => prev.map(c => {
            if (c.id === activeContactId) {
              return { ...c, messages: formatted };
            }
            return c;
          }));
        }

        // Mark messages as read
        try {
          await fetch(`http://localhost:8081/api/messages/read/${activeContact.username || activeContact.name}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (re) {
          console.error("Error marking messages read:", re);
        }

        // Fetch conversation analytics
        loadAnalytics(activeContact.username || activeContact.name);
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

  // --- TYPING SIGNAL PUBLISHERS ---
  const sendTypingStatus = (status) => {
    if (isDemoMode || !stompClientRef.current || !stompClientRef.current.connected || activeContactId === null) return;
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || activeContact.isAi) return;

    stompClientRef.current.publish({
      destination: '/app/chat/typing',
      body: JSON.stringify({
        senderUsername: currentUser.username,
        receiverUsername: activeContact.name,
        status: status
      })
    });
  };

  const handleMessageChange = (val) => {
    setMessageInput(val);
    
    // Broadcast typing signal
    sendTypingStatus('typing');
    
    // debounce to idle
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus('idle');
    }, 2500);
  };

  // --- REAL WEBRTC AUDIO/VIDEO CALLING HANDLERS ---
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micMuted;
      });
    }
  }, [micMuted]);

  const startCall = async (type) => {
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;
    if (activeContact.isAi) {
      alert("Ollama AI Assistant does not support calling.");
      return;
    }

    // Feature 1: Offline check before calling
    if (!activeContact.isOnline) {
      alert("This user is currently offline.\nWe'll notify them that you tried to call when they come online.");
      // Save outgoing missed/cancelled call in log
      saveCallLog(activeContact.username || activeContact.name, type, 'missed', 0);
      return;
    }

    setActiveCall(type);
    setCallStatus('calling');
    setMicMuted(false);

    // Feature 6: Call Timeout (30 seconds)
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      if (callStatusRef.current === 'calling' || callStatusRef.current === 'ringing') {
        console.log("Call timeout reached (no answer)");
        if (stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({
              senderUsername: currentUser.username,
              receiverUsername: activeContact.username || activeContact.name,
              type: 'end'
            })
          });
        }
        saveCallLog(activeContact.username || activeContact.name, type, 'missed', 0);
        alert("No Answer");
        cleanupCall();
      }
    }, 30000);

    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      };
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Feature 8: Internet Lost / Connection State Monitor during call
      pc.onconnectionstatechange = (event) => {
        console.log("WebRTC Connection State:", pc.connectionState);
        if (pc.connectionState === 'disconnected') {
          setCallStatus('connecting'); // Pause call and show connecting...
        } else if (pc.connectionState === 'failed') {
          alert("Call ended due to network connection.");
          cleanupCall();
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({
              senderUsername: currentUser.username,
              receiverUsername: activeContact.username || activeContact.name,
              type: 'candidate',
              candidate: event.candidate,
              callType: type
            })
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote track:", event.streams[0]);
        remoteStreamRef.current = event.streams[0];
        
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
        }
        const remoteAudio = document.getElementById("remoteAudio");
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({
          senderUsername: currentUser.username,
          receiverUsername: activeContact.username || activeContact.name,
          type: 'offer',
          sdp: offer.sdp,
          callType: type
        })
      });

    } catch (err) {
      console.error("Failed to start call:", err);
      alert("Microphone/Camera permissions required for calling.");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCallSignal) return;
    stopRingtone();
    setCallStatus('connecting');

    try {
      const type = incomingCallSignal.callType;
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      };
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/call/signal',
            body: JSON.stringify({
              senderUsername: currentUser.username,
              receiverUsername: incomingCallSignal.senderUsername,
              type: 'candidate',
              candidate: event.candidate,
              callType: type
            })
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote track:", event.streams[0]);
        remoteStreamRef.current = event.streams[0];
        
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
        }
        const remoteAudio = document.getElementById("remoteAudio");
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: incomingCallSignal.sdp
      }));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({
          senderUsername: currentUser.username,
          receiverUsername: incomingCallSignal.senderUsername,
          type: 'answer',
          sdp: answer.sdp,
          callType: type
        })
      });

      setCallStatus('connected');
    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    stopRingtone();
    if (incomingCallSignal && stompClientRef.current) {
      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({
          senderUsername: currentUser.username,
          receiverUsername: incomingCallSignal.senderUsername,
          type: 'reject'
        })
      });
      // Save missed call log
      saveCallLog(incomingCallSignal.senderUsername, incomingCallSignal.callType, 'rejected', 0);
    }
    cleanupCall();
  };

  const endCall = () => {
    stopRingtone();
    const remoteUser = incomingCallSignal 
      ? incomingCallSignal.senderUsername 
      : (contacts.find(c => c.id === activeContactId)?.username || contacts.find(c => c.id === activeContactId)?.name || null);

    if (remoteUser && stompClientRef.current) {
      stompClientRef.current.publish({
        destination: '/app/call/signal',
        body: JSON.stringify({
          senderUsername: currentUser.username,
          receiverUsername: remoteUser,
          type: 'end'
        })
      });
      
      // Save connected call log (only caller posts to avoid duplicates)
      if (!incomingCallSignal) {
        saveCallLog(remoteUser, activeCall, 'connected', callDuration);
      }
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    setActiveCall(null);
    setCallStatus('idle');
    setIncomingCallSignal(null);
    setCallDuration(0);
    // refresh logs
    fetchCallHistory();
  };

  const saveCallLog = async (peerName, callType, status, duration) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8081/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverUsername: peerName,
          callType: callType,
          status: status,
          durationSeconds: duration
        })
      });
    } catch (e) {
      console.error("Error saving call record:", e);
    }
  };

  const fetchCallHistory = async () => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/calls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data);
      }
    } catch (e) {
      console.error("Error fetching call history:", e);
    }
  };

  // --- PRIVACY SETTINGS API HANDLERS ---
  const loadPrivacySettings = async () => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/users/privacy', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLastSeenVisibility(data.lastSeenVisibility);
        setOnlineVisibility(data.onlineVisibility);
        setProfilePhotoVisibility(data.profilePhotoVisibility);
        setAboutVisibility(data.aboutVisibility);
        setReadReceipts(data.readReceipts);
        setGroupPrivacy(data.groupPrivacy);
        setCallPrivacy(data.callPrivacy);
      }
    } catch (err) {
      console.error("Failed to load privacy settings:", err);
    }
  };

  const handleSavePrivacySettings = async (e) => {
    if (e) e.preventDefault();
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/users/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lastSeenVisibility,
          onlineVisibility,
          profilePhotoVisibility,
          aboutVisibility,
          readReceipts,
          groupPrivacy,
          callPrivacy
        })
      });
      if (response.ok) {
        alert("Privacy Settings saved successfully!");
      } else {
        alert("Failed to save privacy settings.");
      }
    } catch (err) {
      console.error("Failed to save privacy settings:", err);
    }
  };

  // --- POST STATUS/STORY HANDLERS ---
  const handlePostStatus = async (e) => {
    e.preventDefault();
    if (!newStatusCaption.trim() && !newStatusImg) return;

    if (isDemoMode) {
      const newStory = {
        id: Date.now(),
        name: currentUser?.username || "Guest",
        avatar: currentUser?.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
        time: "Just now",
        image: newStatusImg || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300",
        caption: newStatusCaption,
        type: statusType,
        textBackground: statusType === 'text' ? statusTextBg : null
      };
      setMyStatuses([newStory, ...myStatuses]);
      setNewStatusCaption('');
      setNewStatusImg('');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/statuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mediaUrl: newStatusImg,
          caption: newStatusCaption,
          type: statusType,
          textBackground: statusType === 'text' ? statusTextBg : null
        })
      });

      if (response.ok) {
        setNewStatusCaption('');
        setNewStatusImg('');
        fetchStatuses();
      }
    } catch (e) {
      console.error("Failed to post status:", e);
    }
  };

  const fetchStatuses = async () => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/statuses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Separate my statuses from friends'
        const mine = data.find(g => g.username === currentUser.username);
        const others = data.filter(g => g.username !== currentUser.username);
        
        if (mine) {
          setMyStatuses(mine.updates.map(u => ({
            id: u.id,
            name: mine.username,
            avatar: mine.avatar,
            time: u.createdAt,
            image: u.mediaUrl,
            caption: u.caption,
            type: u.type,
            textBackground: u.textBackground
          })));
        } else {
          setMyStatuses([]);
        }

        setFriendStatuses(others.map(o => ({
          username: o.username,
          avatar: o.avatar,
          updates: o.updates.map(u => ({
            id: u.id,
            name: o.username,
            avatar: o.avatar,
            time: u.createdAt,
            image: u.mediaUrl,
            caption: u.caption,
            type: u.type,
            textBackground: u.textBackground
          }))
        })));
      }
    } catch (e) {
      console.error("Error loading statuses:", e);
    }
  };

  const openStatusViewer = (statusGroup) => {
    setViewingStatusGroup(statusGroup);
    setActiveStatusIndex(0);
  };

  const handleNextStatus = () => {
    if (!viewingStatusGroup) return;
    if (activeStatusIndex < viewingStatusGroup.updates.length - 1) {
      setActiveStatusIndex(prev => prev + 1);
    } else {
      setViewingStatusGroup(null);
    }
  };

  const handlePrevStatus = () => {
    if (activeStatusIndex > 0) {
      setActiveStatusIndex(prev => prev - 1);
    }
  };

  // --- ANALYTICS API FETCH ---
  const loadAnalytics = async (peerName) => {
    if (isDemoMode) return;
    setIsAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/analytics/${peerName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // --- SCHEDULED MESSAGES API HANDLERS ---
  const fetchScheduledMessages = async () => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/messages/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScheduledMessages(data);
      }
    } catch (e) {
      console.error("Error loading scheduled messages:", e);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || !scheduleText.trim() || !scheduleTime) return;

    if (isDemoMode) {
      alert("Scheduled messages are saved to DB (not available in client demo).");
      setShowScheduleModal(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/messages/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverUsername: activeContact.name,
          content: scheduleText,
          scheduledTime: scheduleTime // ISO string format
        })
      });

      if (response.ok) {
        setScheduleText('');
        setScheduleTime('');
        setShowScheduleModal(false);
        fetchScheduledMessages();
        alert("Message scheduled successfully!");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to schedule message");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to schedule message.");
    }
  };

  const deleteScheduledMessage = async (id) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/schedule/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchScheduledMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- CONTACT ATTRIBUTES & labels (PUT requests) ---
  const toggleContactBooleanAttribute = async (contact, attribute) => {
    if (isDemoMode) {
      setContacts(prev => prev.map(c => {
        if (c.id === contact.id) {
          return { ...c, [attribute]: !c[attribute] };
        }
        return c;
      }));
      return;
    }

    let recordId = contact.contactRecordId;
    const token = localStorage.getItem('token');

    // Create record if not exists
    if (!recordId) {
      try {
        const addResponse = await fetch('http://localhost:8081/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ phoneNumber: contact.phoneNumber || contact.name })
        });
        if (addResponse.ok) {
          const savedContact = await addResponse.json();
          recordId = savedContact.id;
        } else {
          return;
        }
      } catch (e) {
        console.error(e);
        return;
      }
    }

    const payload = {};
    if (attribute === 'isFavorite') payload.favorite = !contact.isFavorite;
    if (attribute === 'isBlocked') payload.blocked = !contact.isBlocked;
    if (attribute === 'isPinned') payload.pinned = !contact.isPinned;
    if (attribute === 'isArchived') payload.archived = !contact.isArchived;
    if (attribute === 'isMuted') payload.muted = !contact.isMuted;

    try {
      const response = await fetch(`http://localhost:8081/api/contacts/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setContacts(prev => prev.map(c => {
          if (c.id === contact.id) {
            return {
              ...c,
              contactRecordId: recordId,
              [attribute]: !contact[attribute]
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateContactLabel = async (contact, newLabel) => {
    if (isDemoMode) {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, label: newLabel } : c));
      return;
    }

    let recordId = contact.contactRecordId;
    const token = localStorage.getItem('token');

    if (!recordId) {
      try {
        const addResponse = await fetch('http://localhost:8081/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ phoneNumber: contact.phoneNumber || contact.name })
        });
        if (addResponse.ok) {
          const savedContact = await addResponse.json();
          recordId = savedContact.id;
        } else {
          return;
        }
      } catch (e) {
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:8081/api/contacts/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ label: newLabel })
      });
      if (response.ok) {
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, contactRecordId: recordId, label: newLabel } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- PROFILE EDIT HANDLERS ---
  useEffect(() => {
    if (currentUser) {
      setProfileUsername(currentUser.username || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phoneNumber || '');
      setProfilePic(currentUser.profilePicUrl || '');
      setProfileAbout(currentUser.about || 'Hey there! I am using WhatsApp.');
    }
  }, [currentUser, showProfileModal]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const token = localStorage.getItem('token');
      let finalProfilePicUrl = profilePic;

      // If base64 file upload
      if (profilePic && profilePic.startsWith('data:image')) {
        const res = await fetch(profilePic);
        const blob = await res.blob();
        const file = new File([blob], "profile.png", { type: blob.type });

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch('http://localhost:8081/api/users/profile-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || 'Failed to upload profile image');
        }

        const uploadData = await uploadRes.json();
        finalProfilePicUrl = uploadData.profilePicUrl;
      }

      const response = await fetch('http://localhost:8081/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: profileUsername,
          email: profileEmail,
          phoneNumber: profilePhone,
          profilePicUrl: finalProfilePicUrl
        })
      });

      if (!response.ok) {
        const err = await response.json();
        setProfileError(err.error || 'Failed to update profile');
        return;
      }

      const updatedUser = await response.json();

      // Update About
      const aboutResponse = await fetch('http://localhost:8081/api/users/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ about: profileAbout })
      });

      let updatedAbout = profileAbout;
      if (aboutResponse.ok) {
        const aboutData = await aboutResponse.json();
        updatedAbout = aboutData.about;
      }

      const newUserData = {
        ...currentUser,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        profilePicUrl: updatedUser.profilePicUrl,
        about: updatedAbout
      };
      setCurrentUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setProfileSuccess(true);
      setTimeout(() => setShowProfileModal(false), 1500);
    } catch (err) {
      console.error(err);
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  // --- GENERAL MEDIA FILE CHAT UPLOAD ---
  const handleChatMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || activeContactId === null) return;
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('http://localhost:8081/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to upload file");
        return;
      }

      const data = await res.json();
      
      // Send WebSocket media payload
      if (stompClientRef.current && stompClientRef.current.connected) {
        const payload = {
          senderUsername: currentUser.username,
          receiverUsername: activeContact.username || activeContact.name,
          content: `Shared a ${data.mediaType}: ${data.fileName}`,
          isMedia: true,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          fileName: data.fileName,
          fileSize: data.fileSize
        };

        stompClientRef.current.publish({
          destination: '/app/chat',
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.error("Media upload error:", err);
      alert("Error uploading file.");
    }
  };

  // --- MESSAGE ACTIONS: STAR, PIN, REACT, REPLY, FORWARD ---
  const handleToggleStarMsg = async (msgId) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/star/${msgId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setContacts(prev => prev.map(c => {
          if (c.id === activeContactId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === msgId ? { ...m, isStarred: !m.isStarred } : m)
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePinMsg = async (msgId) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/pin/${msgId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setContacts(prev => prev.map(c => {
          if (c.id === activeContactId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m)
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReactMsg = async (msgId, emoji) => {
    if (isDemoMode) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/react/${msgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction: emoji })
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(prev => prev.map(c => {
          if (c.id === activeContactId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === msgId ? { ...m, reactions: data.reactions } : m)
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitForwardMessage = (targetContact) => {
    if (!forwardingMsg || !targetContact) return;

    if (stompClientRef.current && stompClientRef.current.connected) {
      const payload = {
        senderUsername: currentUser.username,
        receiverUsername: targetContact.username || targetContact.name,
        content: forwardingMsg.text,
        isForwarded: true,
        isMedia: forwardingMsg.isMedia,
        mediaUrl: forwardingMsg.mediaUrl,
        mediaType: forwardingMsg.mediaType,
        fileName: forwardingMsg.fileName,
        fileSize: forwardingMsg.fileSize
      };

      stompClientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload)
      });

      alert(`Message forwarded to ${targetContact.name}`);
      setForwardingMsg(null);
      setShowForwardModal(false);
    }
  };

  // --- DELETE MESSAGE ---
  const handleDeleteMessage = async (msgId) => {
    if (isDemoMode) {
      setContacts(prev => prev.map(c => {
        if (c.id === activeContactId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === msgId ? { ...m, text: "DELETED" } : m)
          };
        }
        return c;
      }));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setContacts(prev => prev.map(c => {
          if (c.id === activeContactId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === msgId ? { ...m, text: "DELETED" } : m)
            };
          }
          return c;
        }));
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to delete message");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditContactName = async (contact) => {
    const newName = prompt("Enter custom name for this contact:", contact.name);
    if (!newName || !newName.trim()) return;

    if (isDemoMode) {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, name: newName } : c));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let recordId = contact.contactRecordId;

      if (!recordId) {
        const addResponse = await fetch('http://localhost:8081/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ phoneNumber: contact.phoneNumber || contact.name })
        });
        if (addResponse.ok) {
          const savedContact = await addResponse.json();
          recordId = savedContact.id;
        } else {
          alert("Failed to save contact for renaming.");
          return;
        }
      }

      const response = await fetch(`http://localhost:8081/api/contacts/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customName: newName })
      });

      if (response.ok) {
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, name: newName, contactRecordId: recordId } : c));
      } else {
        alert("Failed to update custom name on server.");
      }
    } catch (err) {
      console.error("Error editing contact name:", err);
      alert("Error updating contact name.");
    }
  };

  const handleDeleteContact = async (contact) => {
    if (!confirm(`Are you sure you want to delete contact ${contact.name}?`)) return;

    if (isDemoMode) {
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setActiveContactId(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (contact.contactRecordId) {
        const response = await fetch(`http://localhost:8081/api/contacts/${contact.contactRecordId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          alert("Failed to delete contact from server.");
          return;
        }
      }
      
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      if (activeContactId === contact.id) {
        setActiveContactId(null);
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("Error deleting contact.");
    }
  };

  // --- CONTACT SEARCH BY PHONE NUMBER ---
  const handleSearchContact = async (e) => {
    e.preventDefault();
    setSearchError(null);

    const query = searchQuery.trim();
    if (!query) return;

    // Prevent searching yourself
    if (currentUser && (query === currentUser.phoneNumber || query.toLowerCase() === currentUser.username?.toLowerCase())) {
      setSearchError("You cannot search yourself.");
      return;
    }

    // Check if contact already exists in the list (by phone, username or name)
    const existing = contacts.find(c =>
      c.phoneNumber === query ||
      (c.username && c.username.toLowerCase() === query.toLowerCase()) ||
      (c.name && c.name.toLowerCase() === query.toLowerCase())
    );
    if (existing) {
      setActiveContactId(existing.id);
      setSearchQuery('');
      setSearchError(null);
      return;
    }

    if (isDemoMode) {
      if (/^\d+$/.test(query)) {
        const mockNewContact = {
          id: Date.now(),
          name: `User_${query.slice(-4)}`,
          phoneNumber: query,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100`,
          statusText: "Offline",
          isOnline: false,
          messages: [],
          isFavorite: false,
          isBlocked: false,
          isPinned: false,
          isArchived: false,
          isMuted: false,
          label: 'NONE'
        };
        setContacts(prev => [mockNewContact, ...prev]);
        setActiveContactId(mockNewContact.id);
        setSearchQuery('');
      } else {
        setSearchError("User not found. Please enter a valid phone number.");
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/search?phoneNumber=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const foundUser = await response.json();

        // Check if this user is already in our contacts list by ID
        const inList = contacts.find(c => c.id === foundUser.id);
        if (inList) {
          // Conversation already exists — just open it
          setActiveContactId(inList.id);
          setSearchQuery('');
          setSearchError(null);
          return;
        }

        // New contact — save to backend and add to list
        try {
          const addRes = await fetch(`${API_BASE_URL}/api/contacts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ phoneNumber: foundUser.phoneNumber })
          });

          const newContact = {
            id: foundUser.id,
            contactRecordId: null,
            username: foundUser.username,
            name: foundUser.username,
            avatar: foundUser.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
            phoneNumber: foundUser.phoneNumber,
            statusText: "Offline",
            isOnline: false,
            messages: [],
            isFavorite: false,
            isBlocked: false,
            isPinned: false,
            isArchived: false,
            isMuted: false,
            label: 'NONE'
          };

          if (addRes.ok) {
            const savedRec = await addRes.json();
            newContact.contactRecordId = savedRec.id;
            newContact.name = savedRec.customName || foundUser.username;
          }
          // Even if addRes is not ok (e.g. "already exists"), still show in UI
          setContacts(prev => {
            if (!prev.some(c => c.id === newContact.id)) {
              return [newContact, ...prev];
            }
            return prev;
          });
          setActiveContactId(newContact.id);
          setSearchQuery('');
          setSearchError(null);
        } catch (err) {
          console.error("Error adding contact:", err);
          setSearchError("Error saving contact.");
        }
      } else if (response.status === 404) {
        setSearchError("No registered user found with this number.");
      } else {
        const errBody = await response.text();
        console.error("Search API error:", response.status, errBody);
        setSearchError("Search failed. Please try again.");
      }
    } catch (err) {
      console.error("Error searching user:", err);
      setSearchError("Cannot connect to server. Check your connection.");
    }
  };

  // --- HANDLERS FOR AUTHENTICATION API ---
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
        let errorMessage = "Server connection failed!";
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
            errorMessage = "Unauthorized access / Invalid Credentials (ya fir duplicate registration).";
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
        profilePicUrl: data.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
      };
      localStorage.setItem('user', JSON.stringify(profile));
      
      setCurrentUser(profile);
      setIsAuthenticated(true);
      setIsDemoMode(false);
    } catch (err) {
      console.error("Authentication error:", err);
      setErrorMsg(err.message || "Failed to authenticate. Server is unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (stompClientRef.current) {
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
    setActiveContactId(null);
  };

  // --- SEND MESSAGE FLOW ---
  const handleSendMessage = () => {
    if (!messageInput.trim() || activeContactId === null) return;
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact) return;

    // Offline simulation for bot/notes/demo
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
                text: `Mainne aapka ye message padha: "${messageInput}". Main aapki is chat stream ko Ollama Phi-3 AI se summarize karne ke liye ready hoon. Top-Right header mein diye 'Ollama Summarize' button par click karein!`,
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
        receiverUsername: activeContact.isGroup ? null : (activeContact.username || activeContact.name),
        groupId: activeContact.isGroup ? activeContact.groupId : null,
        content: messageInput,
        parentMessageId: replyToMsg ? replyToMsg.id : null,
        parentMessageText: replyToMsg ? replyToMsg.text : null,
        parentMessageSender: replyToMsg ? replyToMsg.senderUsername : null
      };

      stompClientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload)
      });

      setMessageInput('');
      setReplyToMsg(null);
      sendTypingStatus('idle');
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
    setLatestAiReport(null);

    if (isDemoMode || activeContact.isAi) {
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

    executeAiFeature('summarize', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8081/api/ai/summarize/${currentUser.username}/${activeContact.name}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAiSummaryText(data.responseText);
          setLatestAiReport(data);
        } else {
          const errorText = await response.text();
          setAiSummaryText(`Failed to retrieve summary: ${errorText}`);
        }
      } catch (err) {
        setAiSummaryText(`Failed to connect to AI summarizer. Details: ${err.message}`);
      } finally {
        setIsAiLoading(false);
      }
    });
  };

  // --- AI ASSISTANT PANEL LOGIC ---
  const buildTranscript = () => {
    const ac = contacts.find(c => c.id === activeContactId);
    if (!ac || !ac.messages) return '';
    return ac.messages
      .filter(m => m.messageType !== 'CALL' && m.text && m.text !== 'DELETED')
      .slice(-40)
      .map(m => `${m.sender === 'me' ? (currentUser?.username || 'Me') : (ac.name)}: ${m.text}`)
      .join('\n');
  };

  const callAiApi = async (endpoint, body) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8081/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('API error ' + response.status);
    const data = await response.json();
    setLatestAiReport(data);
    return data.responseText;
  };

  const runAiFeature = async (feature) => {
    executeAiFeature(feature, async () => {
      setAiActiveFeature(feature);
      setAiResult('');
      setAiSmartReplies([]);
      setAiLoading(true);
      setAiOffline(false);
      setAiCopied(false);
      setLatestAiReport(null);
      const ac = contacts.find(c => c.id === activeContactId);
      const transcript = buildTranscript();

      try {
        let result = '';
        if (feature === 'summarize') {
          result = await callAiApi('summarize', { text: transcript });
        } else if (feature === 'smart-reply') {
          result = await callAiApi('smart-reply', { text: transcript });
          const lines = result.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
          setAiSmartReplies(lines);
          result = '';
        } else if (feature === 'grammar') {
          const src = aiCustomText || (ac?.messages?.filter(m => m.sender === 'me' && m.text && m.text !== 'DELETED').slice(-1)[0]?.text || '');
          result = await callAiApi('grammar', { text: src });
        } else if (feature === 'translate') {
          const src = aiCustomText || transcript.split('\n').slice(-1)[0] || '';
          result = await callAiApi('translate', { text: src, param: aiTranslateLang });
        } else if (feature === 'rewrite') {
          const src = aiCustomText || (ac?.messages?.filter(m => m.sender === 'me' && m.text && m.text !== 'DELETED').slice(-1)[0]?.text || '');
          result = await callAiApi('rewrite', { text: src, param: aiRewriteMode });
        } else if (feature === 'tasks') {
          result = await callAiApi('tasks', { text: transcript });
        } else if (feature === 'meetings') {
          result = await callAiApi('meetings', { text: transcript });
        } else if (feature === 'reminders') {
          result = await callAiApi('reminders', { text: transcript });
        } else if (feature === 'title') {
          result = await callAiApi('title', { text: transcript });
        } else if (feature === 'mood') {
          result = await callAiApi('mood', { text: transcript });
        } else if (feature === 'notes') {
          result = await callAiApi('notes', { text: transcript });
        } else if (feature === 'explain') {
          const src = aiCustomText || transcript.split('\n').slice(-1)[0] || '';
          result = await callAiApi('explain', { text: src, param: aiExplainLevel });
        } else if (feature === 'email') {
          result = await callAiApi('email', { text: transcript });
        } else if (feature === 'improve') {
          const src = aiCustomText || (ac?.messages?.filter(m => m.sender === 'me' && m.text && m.text !== 'DELETED').slice(-1)[0]?.text || '');
          result = await callAiApi('improve', { text: src });
        } else if (feature === 'daily-summary') {
          const ctx = `Messages in this chat: ${ac?.messages?.length || 0}\nConversation:\n${transcript}`;
          result = await callAiApi('daily-summary', { text: ctx });
        }
        if (result && result.includes('currently unavailable')) setAiOffline(true);
        setAiResult(result);
      } catch (e) {
        setAiOffline(true);
        setAiResult('');
      } finally {
        setAiLoading(false);
      }
    });
  };

  const copyAiResult = () => {
    const text = aiResult || aiSmartReplies.join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
  };

  const insertAiResultIntoChat = (text) => {
    setMessageInput(text);
    setShowAiPanel(false);
  };

  // Send a message to the AI assistant in conversational mode
  const sendAiChat = async () => {
    const msg = aiChatInput.trim();
    if (!msg || aiChatLoading) return;

    executeAiFeature('chat', async () => {
      const userMsg = { role: 'user', text: msg };
      const updatedHistory = [...aiChatMessages, userMsg];
      setAiChatMessages(updatedHistory);
      setAiChatInput('');
      setAiChatLoading(true);
      setLatestAiReport(null);

      // Build history string for multi-turn context (last 10 turns)
      const historyStr = updatedHistory.slice(-10).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
      ).join('\n');

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8081/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ text: msg, param: historyStr })
        });
        const data = await response.json();
        setLatestAiReport(data);
        setAiChatMessages(prev => [...prev, { role: 'assistant', text: data.responseText.trim() }]);
      } catch (e) {
        setAiChatMessages(prev => [...prev, { role: 'assistant', text: 'AI Assistant is currently unavailable.' }]);
      } finally {
        setAiChatLoading(false);
      }
    });
  };

  const activeContact = contacts.find(c => c.id === activeContactId);

  // Filter contacts by label and search query
  const filteredContacts = contacts.filter(c => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(lowerQuery) ||
                          (c.username && c.username.toLowerCase().includes(lowerQuery)) ||
                          (c.customName && c.customName.toLowerCase().includes(lowerQuery)) ||
                          (c.phoneNumber && c.phoneNumber.includes(searchQuery));
    if (!matchesSearch) return false;

    if (selectedLabelFilter === 'ALL') return !c.isArchived;
    if (selectedLabelFilter === 'FAVORITES') return c.isFavorite && !c.isArchived;
    if (selectedLabelFilter === 'ARCHIVED') return c.isArchived;
    if (selectedLabelFilter === 'BLOCKED') return c.isBlocked;
    if (selectedLabelFilter === 'MUTED') return c.isMuted;
    
    return c.label === selectedLabelFilter;
  });

  // Filter messages within current chat
  const activeChatMessages = activeContact ? activeContact.messages.filter(m => {
    if (!chatSearchQuery) return true;
    const query = chatSearchQuery.toLowerCase();
    
    // Normal text match
    if (m.text && m.text.toLowerCase().includes(query)) return true;
    
    // Call-specific search attributes support (Feature 9)
    if (m.messageType === 'CALL') {
      const isVideo = m.callType === 'VIDEO';
      const status = m.callStatus ? m.callStatus.toLowerCase() : '';
      const typeStr = isVideo ? 'video call' : 'audio call voice call';
      const duration = m.callDuration ? String(m.callDuration) : '';
      const timestampStr = m.timestamp ? m.timestamp.toLowerCase() : '';
      
      if (typeStr.includes(query)) return true;
      if (status.includes(query)) return true;
      if (duration.includes(query)) return true;
      if (timestampStr.includes(query)) return true;
      if ('call'.includes(query)) return true;
      if (status === 'missed' && 'missed'.includes(query)) return true;
    }
    
    return false;
  }) : [];

  // Wallpaper backgrounds selection
  const getWallpaperBackground = () => {
    if (chatWallpaper === 'teal') return 'radial-gradient(circle, #0b141a 20%, #075e54 100%)';
    if (chatWallpaper === 'blue') return 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
    if (chatWallpaper === 'purple') return 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)';
    if (chatWallpaper === 'sunset') return 'linear-gradient(135deg, #300d3d 0%, #a83279 100%)';
    if (chatWallpaper === 'minimal') return '#111216';
    return 'radial-gradient(rgba(48, 54, 61, 0.35) 1px, transparent 0)';
  };

  return (
    <div className="app-container">
      
      {/* 1. AUTHENTICATION MODULE VIEW */}
      {!isAuthenticated ? (
        <div className="auth-container glass animate-scale-up">
          <div className="auth-header">
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
                type="text" 
                required 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                placeholder={authMode === 'login' ? '9876543210 or username' : 'student_dev'}
                inputMode={authMode === 'login' ? 'tel' : 'text'}
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
        
        // 2. MONOLITHIC CHAT DASHBOARD VIEW
        <div className="dashboard-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '70px 360px minmax(0, 1fr)', width: '100vw', height: '100vh' }}>
          
          {/* Vertical Navigation Bar (Leftmost) */}
          <div className="nav-sidebar" style={{ backgroundColor: 'var(--bg-darker)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
              <img 
                src={currentUser?.profilePicUrl} 
                alt="avatar" 
                className="avatar" 
                style={{ width: '42px', height: '42px', border: '2px solid var(--primary)', cursor: 'pointer' }}
                onClick={() => setShowProfileModal(true)}
              />
              
              <button 
                onClick={() => setSidebarTab('chats')} 
                style={{ background: 'transparent', border: 'none', color: sidebarTab === 'chats' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
                title="Chats"
              >
                <MessageSquare size={24} />
              </button>

              <button 
                onClick={() => setSidebarTab('status')} 
                style={{ background: 'transparent', border: 'none', color: sidebarTab === 'status' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
                title="Status Updates"
              >
                <Circle size={24} />
              </button>

              <button 
                onClick={() => setSidebarTab('calls')} 
                style={{ background: 'transparent', border: 'none', color: sidebarTab === 'calls' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
                title="Call Logs"
              >
                <Phone size={24} />
              </button>

              <button 
                onClick={() => setSidebarTab('analytics')} 
                style={{ background: 'transparent', border: 'none', color: sidebarTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
                title="Chat Analytics"
              >
                <Activity size={24} />
              </button>

              <button 
                onClick={() => setSidebarTab('settings')} 
                style={{ background: 'transparent', border: 'none', color: sidebarTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
                title="Settings"
              >
                <Settings size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Toggle Theme">
                {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Log Out">
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Secondary Sidebar (Tab Panel) */}
          <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-dark)' }}>
            
            {/* Tab: Chats */}
            {sidebarTab === 'chats' && (
              <>
                <div className="sidebar-header" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Chats</h3>
                  <button onClick={() => setShowScheduleModal(true)} style={{ backgroundColor: 'rgba(0,168,132,0.1)', color: 'var(--primary)', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Schedule Msg
                  </button>
                </div>

                <div className="search-container">
                  <form onSubmit={handleSearchContact} className="search-box">
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search Phone Number + Enter..." 
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        if (searchError) setSearchError(null);
                      }}
                    />
                  </form>
                </div>

                {searchError && (
                  <div className="search-error-banner" style={{ color: '#ef4444', fontSize: '12px', padding: '6px 12px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', margin: '4px 12px 0 12px' }}>
                    {searchError}
                  </div>
                )}

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                  {['ALL', 'FAVORITES', 'ARCHIVED', 'BLOCKED', 'MUTED', 'FAMILY', 'WORK'].map(l => (
                    <button 
                      key={l}
                      onClick={() => setSelectedLabelFilter(l)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        backgroundColor: selectedLabelFilter === l ? 'var(--primary)' : 'var(--bg-light)',
                        color: selectedLabelFilter === l ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                {/* Contact List items */}
                <div className="contact-list" style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredContacts.map(contact => {
                    const latestMsg = contact.messages.length > 0 ? contact.messages[contact.messages.length - 1] : null;
                    const typingStatus = typingStates[contact.username || contact.name];

                    return (
                      <div 
                        key={contact.id} 
                        className={`contact-card ${activeContactId === contact.id ? 'active' : ''}`}
                        onClick={() => setActiveContactId(contact.id)}
                      >
                        <div style={{ position: 'relative' }}>
                          <img src={contact.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} alt={contact.name} className="avatar" />
                          {contact.isOnline && <div className="online-badge" style={{ bottom: '2px', left: '30px' }}></div>}
                        </div>
                        
                        <div className="contact-details">
                          <div className="contact-top-row">
                            <span className="contact-name" style={{ fontWeight: '600' }}>
                              {contact.name}
                              {contact.isFavorite && <span style={{ color: '#eab308', marginLeft: '6px' }}>★</span>}
                            </span>
                            <span className="contact-time">
                              {latestMsg ? latestMsg.timestamp : ''}
                            </span>
                          </div>
                          
                          <div className="contact-msg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontStyle: typingStatus && typingStatus !== 'idle' ? 'italic' : 'normal', color: typingStatus && typingStatus !== 'idle' ? 'var(--primary)' : 'var(--text-muted)' }}>
                              {typingStatus && typingStatus !== 'idle' 
                                ? `${typingStatus}...` 
                                : latestMsg 
                                  ? latestMsg.messageType === 'CALL' 
                                    ? getCallMessagePreview(latestMsg) 
                                    : latestMsg.text 
                                  : 'No messages yet'}
                            </span>
                            
                            {/* Contact Badges */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {contact.isPinned && <span style={{ fontSize: '10px', opacity: 0.7 }}>📌</span>}
                              {contact.label !== 'NONE' && (
                                <span style={{ fontSize: '9px', backgroundColor: 'var(--primary)', color: 'white', padding: '1px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  {contact.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Tab: Status updates */}
            {sidebarTab === 'status' && (
              <div className="status-section" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Status Updates</h3>
                
                {/* Compose Status Form */}
                <form onSubmit={handlePostStatus} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', backgroundColor: 'var(--bg-light)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Share a status update</div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <button 
                      type="button" 
                      onClick={() => setStatusType('text')} 
                      style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: statusType === 'text' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                      Text
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStatusType('image')} 
                      style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: statusType === 'image' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                      Photo
                    </button>
                  </div>

                  {statusType === 'text' ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input 
                        type="text"
                        placeholder="Write status text..."
                        required
                        value={newStatusCaption}
                        onChange={e => setNewStatusCaption(e.target.value)}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', outline: 'none' }}
                      />
                      <input 
                        type="color" 
                        value={statusTextBg} 
                        onChange={e => setStatusTextBg(e.target.value)}
                        style={{ border: 'none', width: '32px', height: '32px', background: 'transparent', cursor: 'pointer' }}
                        title="Background color"
                      />
                    </div>
                  ) : (
                    <>
                      <input 
                        type="text" 
                        placeholder="Add a caption..." 
                        value={newStatusCaption} 
                        onChange={e => setNewStatusCaption(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', outline: 'none' }}
                      />
                      <input 
                        type="url" 
                        placeholder="Image / Video URL..." 
                        value={newStatusImg} 
                        onChange={e => setNewStatusImg(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Or choose photo/video directly:</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewStatusImg(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    </>
                  )}

                  <button type="submit" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Post status
                  </button>
                </form>

                {/* My Status list */}
                {myStatuses.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>My Status</div>
                    <div 
                      className="contact-card" 
                      onClick={() => openStatusViewer({ username: currentUser.username, avatar: currentUser.profilePicUrl, updates: myStatuses })}
                      style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <img src={currentUser.profilePicUrl} alt="my avatar" className="avatar" style={{ border: '2px solid var(--primary)', padding: '2px' }} />
                      <div className="contact-details">
                        <div className="contact-name">{currentUser.username} (You)</div>
                        <div className="contact-msg">{myStatuses.length} updates posted</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Friends Status updates */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Recent Updates</div>
                  {friendStatuses.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>No recent status updates.</div>
                  ) : (
                    friendStatuses.map(group => (
                      <div 
                        key={group.username} 
                        className="contact-card" 
                        onClick={() => openStatusViewer(group)}
                        style={{ padding: '8px', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}
                      >
                        <img src={group.avatar} alt={group.username} className="avatar" style={{ border: '2px solid var(--primary)', padding: '2px' }} />
                        <div className="contact-details">
                          <div className="contact-name">{group.username}</div>
                          <div className="contact-msg">{group.updates.length} updates</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Call History — WhatsApp style */}
            {sidebarTab === 'calls' && (() => {
              // Group calls by date
              const today = new Date(); today.setHours(0,0,0,0);
              const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

              const fmtDuration = (s) => {
                if (!s || s === 0) return '';
                const m = Math.floor(s / 60), sec = s % 60;
                return `${m}:${String(sec).padStart(2,'0')}`;
              };

              const getCallIcon = (log) => {
                const isMissed = ['missed','rejected','no_answer','cancelled','offline','failed','busy'].includes(log.status?.toLowerCase());
                const color = isMissed ? '#ef4444' : '#22c55e';
                if (log.direction === 'incoming') return <ArrowDownLeft size={13} style={{ color }} />;
                return <ArrowUpRight size={13} style={{ color: '#22c55e' }} />;
              };

              const getStatusLabel = (log) => {
                const s = (log.status || '').toLowerCase();
                const label = { missed:'Missed', rejected:'Rejected', cancelled:'Cancelled', busy:'Busy',
                  no_answer:'No Answer', offline:'Offline', failed:'Failed', connected:'', completed:'' }[s] || s;
                const color = ['missed','rejected','cancelled','busy','no_answer','offline','failed'].includes(s) ? '#ef4444' : 'var(--text-muted)';
                return { label, color };
              };

              const groups = callHistory.reduce((acc, log) => {
                const d = new Date(log.timestamp?.replace(' ','T') || Date.now());
                d.setHours(0,0,0,0);
                let key = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
                if (!acc[key]) acc[key] = [];
                acc[key].push(log);
                return acc;
              }, {});

              return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Header */}
                  <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Calls</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { const c = activeContact; if (c) startCall('audio'); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }} title="New Audio Call"><Phone size={16} /></button>
                      <button onClick={() => { const c = activeContact; if (c) startCall('video'); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }} title="New Video Call"><Video size={16} /></button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
                    {callHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: '13px' }}>
                        <Phone size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <div>No calls yet</div>
                      </div>
                    ) : (
                      Object.entries(groups).map(([groupLabel, logs]) => (
                        <div key={groupLabel}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 8px 6px' }}>
                            {groupLabel}
                          </div>
                          {logs.map(log => {
                            const { label: statusLabel, color: statusColor } = getStatusLabel(log);
                            const dur = fmtDuration(log.durationSeconds);
                            const timeStr = log.timestamp ? new Date(log.timestamp.replace(' ','T')).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
                            const isMissed = ['missed','rejected','no_answer','cancelled','offline','failed','busy'].includes((log.status||'').toLowerCase());
                            return (
                              <div
                                key={log.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <img
                                  src={log.peerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                                  alt="avatar"
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: isMissed ? '#ef4444' : 'var(--text-main)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.peerUsername}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: statusColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {getCallIcon(log)}
                                    <span>{log.callType === 'video' ? '📹' : '📞'} {log.direction === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
                                    {statusLabel && <span>• {statusLabel}</span>}
                                    {dur && <span style={{ color: 'var(--text-muted)' }}>• {dur}</span>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{timeStr}</div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      onClick={() => { const c = contacts.find(ct => ct.name === log.peerUsername || ct.username === log.peerUsername); if (c) { setActiveContactId(c.id); startCall('audio'); } }}
                                      style={{ background: 'rgba(0,168,132,0.1)', border: '1px solid rgba(0,168,132,0.2)', borderRadius: '6px', color: 'var(--primary)', cursor: 'pointer', padding: '3px 6px' }}
                                      title="Audio Call"
                                    >
                                      <Phone size={12} />
                                    </button>
                                    <button
                                      onClick={() => { const c = contacts.find(ct => ct.name === log.peerUsername || ct.username === log.peerUsername); if (c) { setActiveContactId(c.id); startCall('video'); } }}
                                      style={{ background: 'rgba(0,168,132,0.1)', border: '1px solid rgba(0,168,132,0.2)', borderRadius: '6px', color: 'var(--primary)', cursor: 'pointer', padding: '3px 6px' }}
                                      title="Video Call"
                                    >
                                      <Video size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Tab: Analytics Dashboard */}
            {sidebarTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Chat Analytics</h3>

                {activeContact ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', backgroundColor: 'var(--bg-light)', padding: '10px', borderRadius: '8px' }}>
                      <img src={activeContact.avatar} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{activeContact.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stats for this chat session</div>
                      </div>
                    </div>

                    {isAnalyticsLoading ? (
                      <div>Loading analytics...</div>
                    ) : analyticsData ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        
                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsData.totalMessages}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Messages</div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsData.averageResponseTimeMinutes}m</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Response Time</div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsData.longestConversationMinutes}m</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Longest Session</div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsData.imagesShared}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Images Shared</div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsData.documentsShared}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Docs Shared</div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{analyticsData.voiceNotes}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voice Notes</div>
                        </div>

                        <div style={{ gridColumn: 'span 2', backgroundColor: 'var(--bg-light)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          Chat started on: {analyticsData.chatStartedOn}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Start chatting to view analytics details.</div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 10px', fontSize: '13px' }}>Select an active contact to see metrics.</div>
                )}
              </div>
            )}

            {/* Tab: Settings Panel */}
            {sidebarTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Settings</h3>
                
                {/* Profile Edit button */}
                <button 
                  onClick={() => setShowProfileModal(true)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', cursor: 'pointer', textAlign: 'left', marginBottom: '16px' }}
                >
                  <img src={currentUser?.profilePicUrl} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentUser?.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Edit Profile, Avatar & About</div>
                  </div>
                </button>

                {/* Privacy Visibility dropdown inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privacy Controls</h4>
                  
                  <div className="input-group">
                    <label style={{ fontSize: '11px' }}>Last Seen Visibility</label>
                    <select 
                      value={lastSeenVisibility} 
                      onChange={e => { setLastSeenVisibility(e.target.value); setTimeout(() => handleSavePrivacySettings(), 100); }}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                      <option value="EVERYONE">Everyone</option>
                      <option value="CONTACTS">My Contacts</option>
                      <option value="NOBODY">Nobody</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label style={{ fontSize: '11px' }}>Online Status Visibility</label>
                    <select 
                      value={onlineVisibility} 
                      onChange={e => { setOnlineVisibility(e.target.value); setTimeout(() => handleSavePrivacySettings(), 100); }}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                      <option value="EVERYONE">Everyone</option>
                      <option value="SAME_AS_LAST_SEEN">Same as Last Seen</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label style={{ fontSize: '11px' }}>Read Receipts</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12.5px' }}>Enable tick receipts</span>
                      <input 
                        type="checkbox" 
                        checked={readReceipts} 
                        onChange={e => { setReadReceipts(e.target.checked); setTimeout(() => handleSavePrivacySettings(), 100); }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personalization</h4>
                  
                  <div className="input-group">
                    <label style={{ fontSize: '11px' }}>Chat Wallpaper</label>
                    <select 
                      value={chatWallpaper} 
                      onChange={e => setChatWallpaper(e.target.value)}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                      <option value="default">Default Dark</option>
                      <option value="teal">WhatsApp Teal</option>
                      <option value="blue">Royal Blue</option>
                      <option value="purple">Soft Indigo</option>
                      <option value="sunset">Sunset Orchid</option>
                      <option value="minimal">Minimal Jetblack</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label style={{ fontSize: '11px' }}>Font Size</label>
                    <select 
                      value={fontSize} 
                      onChange={e => setFontSize(e.target.value)}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label style={{ fontSize: '11px' }}>Bubble Shape Style</label>
                    <select 
                      value={bubbleStyle} 
                      onChange={e => setBubbleStyle(e.target.value)}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                      <option value="standard">Standard WhatsApp</option>
                      <option value="modern">Modern Rounded</option>
                      <option value="minimal">Minimal Sharp</option>
                    </select>
                  </div>

                  {/* AI & Privacy Preferences */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Settings & Privacy</h4>
                    
                    <div className="input-group">
                      <label style={{ fontSize: '11px' }}>Preferred AI Provider</label>
                      <select 
                        value={aiSettings.preferredProvider} 
                        onChange={e => saveAiSettings({ ...aiSettings, preferredProvider: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                      >
                        <option value="AUTO">Auto (Smart Select)</option>
                        <option value="DEVICE">Device AI</option>
                        <option value="LOCAL">Local AI (Ollama)</option>
                        <option value="CLOUD">Cloud AI (Gemini)</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px' }}>Cloud AI Permissions</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="radio" 
                            name="cloudAiOption"
                            checked={aiSettings.askPermissionEveryTime && !aiSettings.alwaysAllowCloud && !aiSettings.disableCloudAi}
                            onChange={() => saveAiSettings({ ...aiSettings, askPermissionEveryTime: true, alwaysAllowCloud: false, disableCloudAi: false })}
                          />
                          Ask Permission Every Time
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="radio" 
                            name="cloudAiOption"
                            checked={aiSettings.alwaysAllowCloud && !aiSettings.disableCloudAi}
                            onChange={() => saveAiSettings({ ...aiSettings, askPermissionEveryTime: false, alwaysAllowCloud: true, disableCloudAi: false })}
                          />
                          Always Allow
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="radio" 
                            name="cloudAiOption"
                            checked={aiSettings.disableCloudAi}
                            onChange={() => saveAiSettings({ ...aiSettings, askPermissionEveryTime: false, alwaysAllowCloud: false, disableCloudAi: true })}
                          />
                          Disable Cloud AI
                        </label>
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px' }}>Privacy Mode</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox"
                            checked={aiSettings.preferLocalProcessing}
                            onChange={e => saveAiSettings({ ...aiSettings, preferLocalProcessing: e.target.checked })}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          Prefer Local Processing
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox"
                            checked={aiSettings.neverAutomaticallySendToCloud}
                            onChange={e => saveAiSettings({ ...aiSettings, neverAutomaticallySendToCloud: e.target.checked })}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          Never Automatically Send Chats to Cloud
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox"
                            checked={aiSettings.showPrivacyNoticeBeforeCloud}
                            onChange={e => saveAiSettings({ ...aiSettings, showPrivacyNoticeBeforeCloud: e.target.checked })}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          Show Privacy Notice Before Cloud Requests
                        </label>
                      </div>
                    </div>

                    {aiTransparencyData && (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>Status Summary</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Active Provider:</span>
                          <span style={{ fontWeight: 'bold' }}>{aiTransparencyData.providerName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Processing Mode:</span>
                          <span>{aiTransparencyData.processingMode}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Response Time:</span>
                          <span>{aiTransparencyData.responseTimeSeconds.toFixed(1)}s</span>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setShowTransparencyModal(true)}
                      style={{ padding: '8px', background: 'rgba(0,168,132,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s', textAlign: 'center' }}
                    >
                      🛡️ Open AI Transparency Center
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Chat Window Panel */}
          <div className="chat-window" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {activeContact ? (
              <>
                {/* Chat Panel Header */}
                <div className="chat-header">
                  <div className="active-contact-profile" onClick={() => setShowContactProfileModal(true)} style={{ cursor: 'pointer' }}>
                    <img src={activeContact.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} alt={activeContact.name} className="avatar" />
                    <div>
                      <div className="user-info-name">{activeContact.name}</div>
                      <div className="user-info-sub">
                        {typingStates[activeContact.username || activeContact.name] && typingStates[activeContact.username || activeContact.name] !== 'idle'
                          ? `${typingStates[activeContact.username || activeContact.name]}...`
                          : activeContact.statusText
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="chat-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!activeContact.isAi && !activeContact.isNotes && (
                      <>
                        <button className="action-btn" title="Voice Call" onClick={() => startCall('audio')} style={{ color: 'var(--primary)' }}>
                          <Phone size={18} />
                        </button>
                        <button className="action-btn" title="Video Call" onClick={() => startCall('video')} style={{ color: 'var(--primary)' }}>
                          <Video size={18} />
                        </button>
                      </>
                    )}
                    <button className="action-btn" title="Search Chat" onClick={() => setShowChatSearch(!showChatSearch)}>
                      <Search size={18} />
                    </button>
                    <button className="ai-summary-pill" onClick={triggerAiSummarize}>
                      <Sparkles size={14} />
                      Ollama Summarize
                    </button>
                  </div>
                </div>

                {/* Inline chat search filter */}
                {showChatSearch && (
                  <div style={{ backgroundColor: 'var(--bg-light)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <Search size={14} style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search messages in this chat..." 
                      value={chatSearchQuery}
                      onChange={e => setChatSearchQuery(e.target.value)}
                      style={{ flex: 1, border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '13px' }}
                    />
                    {chatSearchQuery && (
                      <button onClick={() => setChatSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>Clear</button>
                    )}
                  </div>
                )}

                {/* Messages Feed body */}
                <div 
                  className="message-feed"
                  style={{
                    background: getWallpaperBackground(),
                    fontSize: fontSize === 'small' ? '12.5px' : fontSize === 'large' ? '16px' : '14px'
                  }}
                >
                  {activeChatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`message-wrapper ${msg.sender === 'me' ? 'sent' : 'received'}`}
                      style={{
                        maxWidth: '70%'
                      }}
                    >
                      {/* Parent message Reply reference */}
                      {msg.parentMessageText && (
                        <div style={{
                          backgroundColor: 'rgba(0,0,0,0.15)',
                          borderLeft: '4.5px solid var(--primary)',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          marginBottom: '2px',
                          opacity: 0.85
                        }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            {msg.parentMessageSender === currentUser.username ? 'You' : msg.parentMessageSender}
                          </div>
                          <div style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {msg.parentMessageText}
                          </div>
                        </div>
                      )}

                      <div 
                        className="message-bubble" 
                        style={{ 
                          position: 'relative',
                          borderRadius: bubbleStyle === 'modern' ? '18px' : bubbleStyle === 'minimal' ? '4px' : (msg.sender === 'me' ? '10px 0 10px 10px' : '0 10px 10px 10px')
                        }}
                      >
                        {msg.isForwarded && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                            <Share2 size={9} /> Forwarded
                          </div>
                        )}

                        {msg.text === "DELETED" ? (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>🚫 Message deleted</span>
                        ) : msg.messageType === 'CALL' ? (
                          renderCallMessageCard(msg)
                        ) : msg.isMedia ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.mediaType === 'image' && (
                              <img src={msg.mediaUrl} alt="shared image" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', objectFit: 'cover' }} />
                            )}
                            {msg.mediaType === 'video' && (
                              <video src={msg.mediaUrl} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} />
                            )}
                            {msg.mediaType === 'audio' && (
                              <audio src={msg.mediaUrl} controls style={{ maxWidth: '100%' }} />
                            )}
                            {msg.mediaType === 'document' && (
                              <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                                <FileText size={16} /> Download {msg.fileName || 'Document'}
                              </a>
                            )}
                            <span style={{ fontSize: '12px' }}>{msg.text}</span>
                          </div>
                        ) : (
                          <span>{msg.text}</span>
                        )}

                        {/* Reactions render */}
                        {msg.reactions && (
                          <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '-10px', right: '10px', backgroundColor: 'var(--bg-light)', padding: '2px 6px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '10px', zIndex: 1 }}>
                            {msg.reactions.split(',').map((r, ri) => {
                              const [uname, emoji] = r.split(':');
                              return <span key={ri} title={uname}>{emoji}</span>;
                            })}
                          </div>
                        )}

                         {/* Star/Pin indicators */}
                        {msg.messageType !== 'CALL' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            {msg.isStarred && <span style={{ color: '#eab308', fontSize: '10px' }}>★</span>}
                            {msg.isPinned && <span style={{ fontSize: '10px' }}>📌</span>}
                            
                            <div className="message-meta" style={{ margin: 0 }}>
                              {msg.timestamp}
                              {msg.sender === 'me' && msg.text !== "DELETED" && (
                                msg.status === 'read' ? <CheckCheck size={12} style={{ color: 'var(--primary)' }} /> : <Check size={12} />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Message Hover Actions bar */}
                        {msg.text !== "DELETED" && (
                          <div 
                            className="message-actions-overlay"
                            style={{
                              position: 'absolute',
                              top: '-32px',
                              right: '0',
                              backgroundColor: 'var(--bg-light)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '20px',
                              padding: '2px 8px',
                              display: 'flex',
                              gap: '6px',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              zIndex: 10
                            }}
                          >
                            {/* Quick Reactions */}
                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                              <button key={emoji} onClick={() => handleReactMsg(msg.id, emoji)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                                {emoji}
                              </button>
                            ))}
                            
                            <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>

                            <button onClick={() => setReplyToMsg({ id: msg.id, text: msg.text, senderUsername: msg.sender === 'me' ? currentUser.username : activeContact.name })} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }} title="Reply">Reply</button>
                            <button onClick={() => handleToggleStarMsg(msg.id)} style={{ background: 'transparent', border: 'none', color: msg.isStarred ? '#eab308' : 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }} title="Star">Star</button>
                            <button onClick={() => handleTogglePinMsg(msg.id)} style={{ background: 'transparent', border: 'none', color: msg.isPinned ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }} title="Pin">Pin</button>
                            <button onClick={() => { setForwardingMsg(msg); setShowForwardModal(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }} title="Forward">Fwd</button>
                            
                            {msg.sender === 'me' && (
                              <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} title="Delete for everyone">Del</button>
                            )}
                          </div>
                        )}

                        <style>{`
                          .message-bubble:hover .message-actions-overlay {
                            opacity: 1 !important;
                          }
                        `}</style>
                      </div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>

                {/* Input Area block */}
                <div className="message-input-area" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  {/* Reply preview banner */}
                  {replyToMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-light)', padding: '6px 12px', borderRadius: '6px', borderLeft: '4.5px solid var(--primary)', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>Replying to {replyToMsg.senderUsername}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyToMsg.text}</div>
                      </div>
                      <button onClick={() => setReplyToMsg(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}>×</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    {/* Paperclip attachment buttons */}
                    <button 
                      onClick={() => document.getElementById('chat-media-file').click()}
                      className="action-btn" 
                      title="Attach File"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="file" 
                      id="chat-media-file" 
                      style={{ display: 'none' }} 
                      onChange={handleChatMediaUpload}
                    />

                    <input 
                      type="text" 
                      className="message-input-box" 
                      placeholder="Type a message..." 
                      value={messageInput}
                      onChange={e => handleMessageChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    
                    <button className="send-btn" onClick={handleSendMessage}>
                      <Send size={18} />
                    </button>
                  </div>
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
                  <Lock size={12} /> End-to-end encrypted database logs
                </div>
              </div>
            )}

            {/* AI Summary Modal Overlay */}
            {showSummaryModal && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h4>Local Ollama Insights</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phi-3 Model Summary</span>
                  </div>
                  <div className="modal-content">
                    {isAiLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px' }}>
                        <div className="loader" style={{ border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <span>Analyzing messages stream transiently...</span>
                      </div>
                    ) : (
                      <>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px' }}>{aiSummaryText}</pre>
                        {latestAiReport && (
                          <details style={{ marginTop: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', outline: 'none' }}>
                              📊 View AI Processing Report ({latestAiReport.provider})
                            </summary>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '8px', paddingLeft: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                                <span>{latestAiReport.provider}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Processing Mode:</span>
                                <span>{latestAiReport.processingMode}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Sent Outside Device:</span>
                                <span>{latestAiReport.sentOutsideDevice ? "YES" : "NO"}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Temporary Buffer:</span>
                                <span style={{ color: '#10b981' }}>{latestAiReport.temporaryBufferReleased ? "Released" : "Retained"}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Processing Time:</span>
                                <span>{latestAiReport.processingTimeSeconds.toFixed(2)} Seconds</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                                <span style={{ color: latestAiReport.status === 'Completed' ? '#10b981' : '#ef4444' }}>{latestAiReport.status}</span>
                              </div>
                            </div>
                          </details>
                        )}
                      </>
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

            {showPrivacyPermissionModal && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 10000 }}>
                <div className="modal-card" style={{ padding: '24px', maxWidth: '380px', width: '90%', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#eab308' }}>⚠️ Cloud AI Processing Required</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                    This AI feature requires cloud processing. Only the selected conversation will be securely sent to the configured AI provider. NexusChat does not permanently store AI request data after processing.
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '20px' }}>
                    Your AI provider may process this request according to its own privacy policy. Do you want to continue?
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => {
                        setShowPrivacyPermissionModal(false);
                        if (pendingAiFeature && pendingAiFeature.callback) {
                          pendingAiFeature.callback();
                        }
                      }}
                      style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Continue
                    </button>
                    <button 
                      onClick={() => {
                        setShowPrivacyPermissionModal(false);
                        setPendingAiFeature(null);
                        setIsAiLoading(false);
                        setAiLoading(false);
                      }}
                      style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showTransparencyModal && aiTransparencyData && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 10000 }}>
                <div className="modal-card" style={{ padding: '24px', maxWidth: '400px', width: '90%', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', textAlign: 'center', color: 'var(--primary)' }}>🛡️ AI Transparency Center</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current AI Provider:</span>
                      <span style={{ fontWeight: 'bold' }}>{aiTransparencyData.providerName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Processing Mode:</span>
                      <span>{aiTransparencyData.processingMode}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Conversation Stored:</span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{aiTransparencyData.storedByApp}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Temporary Request Buffer:</span>
                      <span style={{ color: '#10b981' }}>{aiTransparencyData.temporaryBuffer}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cloud AI Used:</span>
                      <span>{aiTransparencyData.isCloud ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  {aiTransparencyData.isCloud && (
                    <div style={{ fontSize: '11.5px', padding: '8px 12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '6px', marginBottom: '20px', lineHeight: '1.4' }}>
                      ℹ️ This conversation was temporarily processed by the configured Cloud AI provider.
                    </div>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => setShowTransparencyModal(false)}
                      style={{ padding: '8px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Calling Modal Overlay */}
            {activeCall && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 1000 }}>
                <div className="modal-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', width: '380px', maxWidth: '90%', textAlign: 'center', borderRadius: '16px', background: 'rgba(20, 20, 20, 0.98)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
                  
                  {activeCall === 'video' && callStatus === 'connected' ? (
                    <div style={{ position: 'relative', width: '100%', height: '300px', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden' }}>
                      <video id="remoteVideo" autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                      <video id="localVideo" autoPlay playsInline muted style={{ position: 'absolute', right: '12px', bottom: '12px', width: '80px', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--primary)', background: '#000' }} />
                    </div>
                  ) : (
                    <img 
                      src={incomingCallSignal ? (contacts.find(c => c.name === incomingCallSignal.senderUsername)?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100") : activeContact?.avatar} 
                      alt="avatar" 
                      className="avatar animate-pulse" 
                      style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '16px', border: '3px solid var(--primary)' }} 
                    />
                  )}

                  <style>{`
                    .animate-pulse {
                      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    @keyframes pulse {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: .7; transform: scale(1.05); }
                    }
                  `}</style>

                  <audio id="remoteAudio" autoPlay style={{ display: 'none' }} />

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: 'white' }}>
                    {incomingCallSignal ? incomingCallSignal.senderUsername : activeContact?.name}
                  </h3>
                  <div style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
                    {activeCall} call • <span style={{ color: callStatus === 'connected' ? 'var(--primary)' : 'var(--text-muted)' }}>{callStatus === 'connected' ? `Connected (${Math.floor(callDuration/60)}:${String(callDuration%60).padStart(2,'0')})` : `${callStatus}...`}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
                    {incomingCallSignal && callStatus === 'ringing' ? (
                      <>
                        <button 
                          onClick={acceptCall} 
                          style={{ background: '#22c55e', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                          title="Accept Call"
                        >
                          <Phone size={24} />
                        </button>
                        
                        <button 
                          onClick={rejectCall} 
                          style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                          title="Reject Call"
                        >
                          <PhoneOff size={24} />
                        </button>
                      </>
                    ) : (
                      <>
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
                          title="End Call"
                        >
                          <PhoneOff size={24} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Story Viewing Modal Overlay */}
            {viewingStatusGroup && (
              <div className="modal-overlay" onClick={() => setViewingStatusGroup(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 1000 }}>
                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '0', maxWidth: '420px', width: '90%', borderRadius: '16px', overflow: 'hidden', background: viewingStatusGroup.updates[activeStatusIndex].type === 'text' ? viewingStatusGroup.updates[activeStatusIndex].textBackground || '#00a884' : 'black', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', height: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  
                  {/* Status header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
                    <img src={viewingStatusGroup.avatar} alt="avatar" className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14.5px' }}>{viewingStatusGroup.username}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11.5px' }}>{viewingStatusGroup.updates[activeStatusIndex].time}</div>
                    </div>
                    <button onClick={() => setViewingStatusGroup(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                  </div>

                  {/* Segment progress indicators */}
                  <div style={{ display: 'flex', gap: '4px', padding: '0 16px', position: 'absolute', top: '72px', left: 0, right: 0, zIndex: 10 }}>
                    {viewingStatusGroup.updates.map((upd, idx) => (
                      <div key={idx} style={{ flex: 1, height: '3px', backgroundColor: idx === activeStatusIndex ? 'var(--primary)' : 'rgba(255,255,255,0.3)', borderRadius: '2px' }}></div>
                    ))}
                  </div>

                  {/* Status content body */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
                    {viewingStatusGroup.updates[activeStatusIndex].type === 'text' ? (
                      <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-word' }}>
                        {viewingStatusGroup.updates[activeStatusIndex].caption}
                      </div>
                    ) : (
                      <>
                        {viewingStatusGroup.updates[activeStatusIndex].type === 'video' ? (
                          <video src={viewingStatusGroup.updates[activeStatusIndex].image} controls autoPlay style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }} />
                        ) : (
                          <img src={viewingStatusGroup.updates[activeStatusIndex].image} alt="status story" style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }} />
                        )}
                      </>
                    )}
                  </div>

                  {/* Status Caption footer for images */}
                  {viewingStatusGroup.updates[activeStatusIndex].type !== 'text' && viewingStatusGroup.updates[activeStatusIndex].caption && (
                    <div style={{ padding: '16px', color: 'white', fontSize: '14px', textAlign: 'center', background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {viewingStatusGroup.updates[activeStatusIndex].caption}
                    </div>
                  )}

                  {/* Next / Prev Controls overlays */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', cursor: 'pointer' }} onClick={handlePrevStatus}></div>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '30%', cursor: 'pointer' }} onClick={handleNextStatus}></div>
                </div>
              </div>
            )}

            {/* Scheduled Message composer Modal Overlay */}
            {showScheduleModal && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 }}>
                <form onSubmit={handleScheduleSubmit} className="modal-card" style={{ padding: '24px', maxWidth: '380px', width: '90%', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', textAlign: 'center' }}>Schedule a Future Message</h3>
                  
                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px' }}>Message Content</label>
                    <textarea 
                      required
                      value={scheduleText}
                      onChange={e => setScheduleText(e.target.value)}
                      placeholder="Type scheduled message..."
                      rows="3"
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontFamily: 'inherit', resize: 'none' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px' }}>Scheduled Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowScheduleModal(false)}
                      style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      style={{ flex: 1, padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Schedule Message
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Message Forward Select Contact Modal Overlay */}
            {showForwardModal && forwardingMsg && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 }}>
                <div className="modal-card" style={{ padding: '24px', maxWidth: '380px', width: '90%', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', textAlign: 'center' }}>Forward Message</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>"{forwardingMsg.text}"</div>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {contacts.filter(c => !c.isAi).map(c => (
                      <button 
                        key={c.id}
                        onClick={() => submitForwardMessage(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-light)', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <img src={c.avatar} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{c.name}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => { setForwardingMsg(null); setShowForwardModal(false); }}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* User Profile View / Edit Modal Overlay */}
            {showProfileModal && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 }}>
                <form onSubmit={handleUpdateProfile} className="modal-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '380px', width: '90%', borderRadius: '16px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', textAlign: 'center', color: 'var(--text-light)' }}>My Profile Settings</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                    <img 
                      src={profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                      alt="Profile preview" 
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', marginBottom: '8px' }} 
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Username</label>
                    <input 
                      type="text" 
                      value={profileUsername} 
                      onChange={e => setProfileUsername(e.target.value)} 
                      required
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Email</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={e => setProfileEmail(e.target.value)} 
                      required
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={profilePhone} 
                      onChange={e => setProfilePhone(e.target.value)} 
                      required
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>About</label>
                    <input 
                      type="text" 
                      value={profileAbout} 
                      onChange={e => setProfileAbout(e.target.value)} 
                      required
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Choose Profile Photo directly:</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfilePic(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    />
                  </div>

                  {profileError && (
                    <div style={{ color: '#ef4444', fontSize: '12.5px', marginBottom: '12px', textAlign: 'center' }}>
                      {profileError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div style={{ color: 'var(--primary)', fontSize: '12.5px', marginBottom: '12px', textAlign: 'center' }}>
                      Profile updated successfully!
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowProfileModal(false)}
                      style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      style={{ flex: 1, padding: '8px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contact Profile Modal Overlay */}
            {showContactProfileModal && activeContact && (
              <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 }}>
                <div className="modal-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '380px', width: '90%', borderRadius: '16px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', textAlign: 'center', color: 'white' }}>Contact Info</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                    <img 
                      src={activeContact.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                      alt="avatar" 
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', marginBottom: '8px' }} 
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Name</label>
                    <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}>
                      {activeContact.name}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Phone / Mobile Number</label>
                    <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}>
                      {activeContact.phoneNumber || 'Not Available'}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>About</label>
                    <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}>
                      {activeContact.about || 'Hey there! I am using WhatsApp.'}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Status / Last Seen</label>
                    <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}>
                      {activeContact.statusText || 'Offline'}
                    </div>
                  </div>

                  {/* Edit Contact Attributes dropdown & checkboxes */}
                  {!activeContact.isAi && !activeContact.isNotes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>Contact Options</span>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px' }}>Mark as Favorite</span>
                        <input 
                          type="checkbox" 
                          checked={!!activeContact.isFavorite} 
                          onChange={() => toggleContactBooleanAttribute(activeContact, 'isFavorite')}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px' }}>Archive Chat</span>
                        <input 
                          type="checkbox" 
                          checked={!!activeContact.isArchived} 
                          onChange={() => toggleContactBooleanAttribute(activeContact, 'isArchived')}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#ef4444' }}>Block User</span>
                        <input 
                          type="checkbox" 
                          checked={!!activeContact.isBlocked} 
                          onChange={() => toggleContactBooleanAttribute(activeContact, 'isBlocked')}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assign Contact Label</label>
                        <select 
                          value={activeContact.label || 'NONE'} 
                          onChange={e => updateContactLabel(activeContact, e.target.value)}
                          style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }}
                        >
                          <option value="NONE">None</option>
                          <option value="FAMILY">Family</option>
                          <option value="WORK">Work</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button 
                          type="button" 
                          onClick={() => { setShowContactProfileModal(false); handleEditContactName(activeContact); }}
                          style={{ flex: 1, padding: '6px', fontSize: '11px', backgroundColor: 'var(--bg-light)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Rename
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setShowContactProfileModal(false); handleDeleteContact(activeContact); }}
                          style={{ flex: 1, padding: '6px', fontSize: '11px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={() => setShowContactProfileModal(false)}
                    style={{ width: '100%', padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== AI ASSISTANT PANEL (Fixed right side, visible when authenticated) ===== */}
      {isAuthenticated && !isDemoMode && (
        <>
          {/* Floating toggle button */}
          {!showAiPanel && (
            <button
              className="ai-panel-toggle"
              onClick={() => { setShowAiPanel(true); setAiActiveFeature(null); setAiResult(''); setAiSmartReplies([]); }}
              title="Open AI Assistant"
            >
              🧠 AI
            </button>
          )}

          {/* Slide-in AI Panel */}
          {showAiPanel && (
            <div className="ai-side-panel">
              {/* Header */}
              <div className="ai-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🧠</span>
                  <h3>AI Assistant</h3>
                </div>
                <button className="ai-close-btn" onClick={() => setShowAiPanel(false)}>✕</button>
              </div>
              {/* Toggle Tabs */}
              <div className="ai-toggle-tabs">
                <button 
                  className={`ai-tab-btn ${!aiChatMode ? 'active' : ''}`}
                  onClick={() => setAiChatMode(false)}
                >
                  🛠️ Features
                </button>
                <button 
                  className={`ai-tab-btn ${aiChatMode ? 'active' : ''}`}
                  onClick={() => setAiChatMode(true)}
                >
                  💬 Chat Mode
                </button>
              </div>

              {/* Offline banner */}
              {aiOffline && (
                <div style={{ padding: '8px 12px' }}>
                  <div className="ai-offline-banner">AI Assistant is currently unavailable. Ensure Ollama is running: <code>ollama run phi3</code></div>
                </div>
              )}

              <div className="ai-panel-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: aiChatMode ? '0' : '12px' }}>
                {!aiChatMode ? (
                  <div className="ai-features-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                    {!activeContact && (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12.5px', padding: '20px 10px' }}>
                        Select a contact to use AI features on your conversation.
                      </div>
                    )}

                    {activeContact && (
                      <>
                    {/* Context indicator */}
                    <div style={{ padding: '8px 10px', background: 'rgba(0,168,132,0.06)', border: '1px solid rgba(0,168,132,0.12)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                      📂 Context: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{activeContact.name}</strong> — {activeContact.messages?.filter(m => m.messageType !== 'CALL' && m.text && m.text !== 'DELETED').length || 0} messages loaded
                    </div>

                    {/* ---- ANALYSIS SECTION ---- */}
                    <div className="ai-section-label">📊 Analysis</div>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('summarize')}>
                      <span className="ai-icon">🧠</span>
                      <span className="ai-label">Summarize Chat</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('mood')}>
                      <span className="ai-icon">😊</span>
                      <span className="ai-label">Mood Detection</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('tasks')}>
                      <span className="ai-icon">✅</span>
                      <span className="ai-label">Extract Action Items</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('meetings')}>
                      <span className="ai-icon">📅</span>
                      <span className="ai-label">Detect Meeting</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('reminders')}>
                      <span className="ai-icon">⏰</span>
                      <span className="ai-label">Detect Reminders</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('title')}>
                      <span className="ai-icon">🏷️</span>
                      <span className="ai-label">Generate Chat Title</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('daily-summary')}>
                      <span className="ai-icon">📋</span>
                      <span className="ai-label">Daily Summary</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    {/* ---- SMART COMPOSE SECTION ---- */}
                    <div className="ai-section-label">✍️ Smart Compose</div>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('smart-reply')}>
                      <span className="ai-icon">💡</span>
                      <span className="ai-label">Smart Reply Suggestions</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    {/* Rewrite with mode selector */}
                    <div>
                      <button className="ai-feature-btn" onClick={() => runAiFeature('rewrite')}>
                        <span className="ai-icon">✍️</span>
                        <span className="ai-label">Rewrite Message</span>
                        <span className="ai-arrow">›</span>
                      </button>
                      <div className="ai-mode-bar" style={{ marginTop: '4px', paddingLeft: '4px' }}>
                        {['professional','friendly','short','detailed','formal','casual'].map(m => (
                          <button key={m} className={`ai-mode-chip ${aiRewriteMode === m ? 'active' : ''}`} onClick={() => setAiRewriteMode(m)}>{m}</button>
                        ))}
                      </div>
                    </div>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('improve')}>
                      <span className="ai-icon">📈</span>
                      <span className="ai-label">Improve Message</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('grammar')}>
                      <span className="ai-icon">📝</span>
                      <span className="ai-label">Grammar Fix</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    {/* Custom text input for single-message features */}
                    <div className="ai-input-row" style={{ marginTop: '2px' }}>
                      <input
                        className="ai-text-input"
                        placeholder="Override text for above features…"
                        value={aiCustomText}
                        onChange={e => setAiCustomText(e.target.value)}
                      />
                      {aiCustomText && (
                        <button className="ai-go-btn" onClick={() => setAiCustomText('')} style={{ background: 'rgba(255,255,255,0.1)' }}>✕</button>
                      )}
                    </div>

                    {/* ---- TOOLS SECTION ---- */}
                    <div className="ai-section-label">🌐 Tools</div>

                    {/* Translate with lang selector */}
                    <div>
                      <button className="ai-feature-btn" onClick={() => runAiFeature('translate')}>
                        <span className="ai-icon">🌍</span>
                        <span className="ai-label">Translate → {aiTranslateLang}</span>
                        <span className="ai-arrow">›</span>
                      </button>
                      <div className="ai-mode-bar" style={{ marginTop: '4px', paddingLeft: '4px' }}>
                        {['Hindi','English','French','Spanish','Arabic','German','Japanese'].map(l => (
                          <button key={l} className={`ai-mode-chip ${aiTranslateLang === l ? 'active' : ''}`} onClick={() => setAiTranslateLang(l)}>{l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Explain with level selector */}
                    <div>
                      <button className="ai-feature-btn" onClick={() => runAiFeature('explain')}>
                        <span className="ai-icon">📖</span>
                        <span className="ai-label">Explain Message</span>
                        <span className="ai-arrow">›</span>
                      </button>
                      <div className="ai-mode-bar" style={{ marginTop: '4px', paddingLeft: '4px' }}>
                        {['beginner','intermediate','advanced'].map(l => (
                          <button key={l} className={`ai-mode-chip ${aiExplainLevel === l ? 'active' : ''}`} onClick={() => setAiExplainLevel(l)}>{l}</button>
                        ))}
                      </div>
                    </div>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('notes')}>
                      <span className="ai-icon">🗒️</span>
                      <span className="ai-label">Convert to Notes</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    <button className="ai-feature-btn" onClick={() => runAiFeature('email')}>
                      <span className="ai-icon">📧</span>
                      <span className="ai-label">Generate Email Draft</span>
                      <span className="ai-arrow">›</span>
                    </button>

                    {/* ---- LOADING STATE ---- */}
                    {aiLoading && (
                      <div className="ai-loading">
                        <div className="ai-spinner" />
                        Generating AI response…
                      </div>
                    )}

                    {/* ---- SMART REPLY CHIPS ---- */}
                    {aiSmartReplies.length > 0 && !aiLoading && (
                      <div className="ai-result-panel">
                        <div className="ai-result-title">💡 Smart Replies</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {aiSmartReplies.map((r, i) => (
                            <button key={i} className="ai-smart-reply-chip" onClick={() => insertAiResultIntoChat(r)}>
                              {r}
                            </button>
                          ))}
                        </div>
                        <div className="ai-result-actions">
                          <button className="ai-action-pill" onClick={copyAiResult}>{aiCopied ? '✅ Copied' : '📋 Copy All'}</button>
                          <button className="ai-action-pill" onClick={() => runAiFeature('smart-reply')}>🔄 Regenerate</button>
                        </div>
                      </div>
                    )}

                    {/* ---- RESULT PANEL ---- */}
                    {aiResult && !aiLoading && (
                      <div className="ai-result-panel">
                        <div className="ai-result-title">
                          {aiActiveFeature === 'summarize' && '🧠 Summary'}
                          {aiActiveFeature === 'mood' && '😊 Mood Analysis'}
                          {aiActiveFeature === 'tasks' && '✅ Action Items'}
                          {aiActiveFeature === 'meetings' && '📅 Meeting Info'}
                          {aiActiveFeature === 'reminders' && '⏰ Reminders'}
                          {aiActiveFeature === 'title' && '🏷️ Chat Title'}
                          {aiActiveFeature === 'daily-summary' && '📋 Daily Summary'}
                          {aiActiveFeature === 'rewrite' && '✍️ Rewritten'}
                          {aiActiveFeature === 'improve' && '📈 Improved'}
                          {aiActiveFeature === 'grammar' && '📝 Grammar Fixed'}
                          {aiActiveFeature === 'translate' && `🌍 Translated → ${aiTranslateLang}`}
                          {aiActiveFeature === 'explain' && '📖 Explanation'}
                          {aiActiveFeature === 'notes' && '🗒️ Notes'}
                          {aiActiveFeature === 'email' && '📧 Email Draft'}
                        </div>
                        <div className="ai-result-content">{aiResult}</div>
                        {latestAiReport && (
                          <details style={{ width: '100%', marginTop: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', outline: 'none' }}>
                              📊 View AI Processing Report ({latestAiReport.provider})
                            </summary>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '8px', paddingLeft: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                                <span>{latestAiReport.provider}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Processing Mode:</span>
                                <span>{latestAiReport.processingMode}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Sent Outside Device:</span>
                                <span>{latestAiReport.sentOutsideDevice ? "YES" : "NO"}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Temporary Buffer:</span>
                                <span style={{ color: '#10b981' }}>{latestAiReport.temporaryBufferReleased ? "Released" : "Retained"}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Processing Time:</span>
                                <span>{latestAiReport.processingTimeSeconds.toFixed(2)} Seconds</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                                <span style={{ color: latestAiReport.status === 'Completed' ? '#10b981' : '#ef4444' }}>{latestAiReport.status}</span>
                              </div>
                            </div>
                          </details>
                        )}
                        <div className="ai-result-actions">
                          <button className="ai-action-pill primary" onClick={() => insertAiResultIntoChat(aiResult)}>📨 Insert into Chat</button>
                          <button className="ai-action-pill" onClick={copyAiResult}>{aiCopied ? '✅ Copied' : '📋 Copy'}</button>
                          <button className="ai-action-pill" onClick={() => runAiFeature(aiActiveFeature)}>🔄 Regenerate</button>
                          <button className="ai-action-pill" onClick={() => { setAiResult(''); setAiActiveFeature(null); }}>✕ Clear</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
                  <div className="ai-chat-container">
                    <div className="ai-chat-messages">
                      {aiChatMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12.5px', marginTop: '40px', padding: '0 20px', lineHeight: '1.5' }}>
                          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>💬</span>
                          Talk to the AI Assistant! Ask anything, write replies, translate, or chat normally.
                        </div>
                      ) : (
                        aiChatMessages.map((msg, index) => (
                          <div key={index} className={`ai-chat-msg ${msg.role}`}>
                            {msg.text}
                          </div>
                        ))
                      )}
                      {aiChatLoading && (
                        <div className="ai-loading" style={{ alignSelf: 'flex-start', paddingLeft: '12px' }}>
                          <div className="ai-spinner" />
                          AI is thinking…
                        </div>
                      )}
                      <div ref={aiChatEndRef} />
                    </div>
                    
                    {latestAiReport && (
                      <div style={{ padding: '4px 12px 12px 12px' }}>
                        <details style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', outline: 'none' }}>
                            📊 View AI Chat Processing Report ({latestAiReport.provider})
                          </summary>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', marginTop: '8px', paddingLeft: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                              <span>{latestAiReport.provider}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Processing Mode:</span>
                              <span>{latestAiReport.processingMode}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Sent Outside Device:</span>
                              <span>{latestAiReport.sentOutsideDevice ? "YES" : "NO"}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Temporary Buffer:</span>
                              <span style={{ color: '#10b981' }}>{latestAiReport.temporaryBufferReleased ? "Released" : "Retained"}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Processing Time:</span>
                              <span>{latestAiReport.processingTimeSeconds.toFixed(2)} Seconds</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                              <span style={{ color: latestAiReport.status === 'Completed' ? '#10b981' : '#ef4444' }}>{latestAiReport.status}</span>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}

                    <div className="ai-chat-input-area">
                      <input
                        type="text"
                        placeholder="Ask the AI Assistant..."
                        value={aiChatInput}
                        onChange={e => setAiChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendAiChat(); }}
                      />
                      <button 
                        className="ai-chat-send-btn"
                        onClick={sendAiChat}
                        disabled={aiChatLoading || !aiChatInput.trim()}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
