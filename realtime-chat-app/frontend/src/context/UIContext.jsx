import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  // Theme
  const [themeMode, setThemeMode] = useState('dark');

  // Sidebar tab
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats'|'status'|'calls'|'analytics'|'settings'

  // Appearance & Personalization
  const [chatWallpaper, setChatWallpaper] = useState('default');
  const [fontSize, setFontSize] = useState('medium');
  const [bubbleStyle, setBubbleStyle] = useState('standard');

  // Modal visibilities
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactProfileModal, setShowContactProfileModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);
  const [showPrivacyPermissionModal, setShowPrivacyPermissionModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Chat search
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Contact label & filter
  const [selectedLabelFilter, setSelectedLabelFilter] = useState('ALL');
  const [contactLabelInput, setContactLabelInput] = useState('');

  // Reply / Forward message
  const [replyToMsg, setReplyToMsg] = useState(null);
  const [forwardingMsg, setForwardingMsg] = useState(null);

  // Group creation
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // Scheduled messages
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Profile edit form
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [profileAbout, setProfileAbout] = useState('Hey there! I am using WhatsApp.');
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Offline indicator
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Pending AI feature for permission modal
  const [pendingAiFeature, setPendingAiFeature] = useState(null);

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

  const getWallpaperBackground = () => {
    if (chatWallpaper === 'teal') return 'radial-gradient(circle, #0b141a 20%, #075e54 100%)';
    if (chatWallpaper === 'blue') return 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
    if (chatWallpaper === 'purple') return 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)';
    if (chatWallpaper === 'sunset') return 'linear-gradient(135deg, #300d3d 0%, #a83279 100%)';
    if (chatWallpaper === 'minimal') return '#111216';
    return 'radial-gradient(rgba(48, 54, 61, 0.35) 1px, transparent 0)';
  };

  return (
    <UIContext.Provider value={{
      themeMode, setThemeMode, toggleTheme,
      sidebarTab, setSidebarTab,
      chatWallpaper, setChatWallpaper,
      fontSize, setFontSize,
      bubbleStyle, setBubbleStyle,
      showScheduleModal, setShowScheduleModal,
      showForwardModal, setShowForwardModal,
      showProfileModal, setShowProfileModal,
      showContactProfileModal, setShowContactProfileModal,
      showCreateGroupModal, setShowCreateGroupModal,
      showSummaryModal, setShowSummaryModal,
      showTransparencyModal, setShowTransparencyModal,
      showPrivacyPermissionModal, setShowPrivacyPermissionModal,
      showAiPanel, setShowAiPanel,
      chatSearchQuery, setChatSearchQuery,
      showChatSearch, setShowChatSearch,
      selectedLabelFilter, setSelectedLabelFilter,
      contactLabelInput, setContactLabelInput,
      replyToMsg, setReplyToMsg,
      forwardingMsg, setForwardingMsg,
      groupNameInput, setGroupNameInput,
      selectedGroupMembers, setSelectedGroupMembers,
      scheduledMessages, setScheduledMessages,
      scheduleText, setScheduleText,
      scheduleTime, setScheduleTime,
      profileUsername, setProfileUsername,
      profileEmail, setProfileEmail,
      profilePhone, setProfilePhone,
      profilePic, setProfilePic,
      profileAbout, setProfileAbout,
      profileError, setProfileError,
      profileSuccess, setProfileSuccess,
      isOnline, setIsOnline,
      pendingAiFeature, setPendingAiFeature,
      getWallpaperBackground
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
