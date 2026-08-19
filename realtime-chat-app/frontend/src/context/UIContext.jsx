import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  // Sidebar active panel / tab: 'chats' | 'status' | 'calls' | 'analytics' | 'settings'
  const [activePanel, setActivePanel] = useState('chats');
  const [activeTab, setActiveTab] = useState('chats');

  // Modals visibility state
  const [modals, setModals] = useState({
    group: false,
    profile: false,
    media: false,
    forward: false,
    scheduled: false,
    ai: false,
    aiSettings: false,
  });

  // Media modal data (for image/video preview)
  const [mediaData, setMediaData] = useState(null);

  // Open modal helper
  const openModal = (modalName, data = null) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
    if (data && modalName === 'media') {
      setMediaData(data);
    }
  };

  // Close modal helper
  const closeModal = (modalName = null) => {
    if (modalName) {
      setModals((prev) => ({ ...prev, [modalName]: false }));
    } else {
      // Close all modals if no name specified
      setModals({
        group: false,
        profile: false,
        media: false,
        forward: false,
        scheduled: false,
        ai: false,
        aiSettings: false,
      });
    }
    setMediaData(null);
  };

  // Toggle modal helper
  const toggleModal = (modalName, isOpen, data = null) => {
    if (isOpen) {
      openModal(modalName, data);
    } else {
      closeModal(modalName);
    }
  };

  return (
    <UIContext.Provider
      value={{
        activePanel,
        setActivePanel,
        activeTab,
        setActiveTab,
        modals,
        openModal,
        closeModal,
        toggleModal,
        mediaData,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};