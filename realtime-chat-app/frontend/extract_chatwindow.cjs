const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

const startLine = 3469; // Active Chat Window Panel
const endLine = 3851; // AI Summary Modal Overlay

const chatLines = lines.slice(startLine, endLine);

const chatContent = `import React, { useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Paperclip, Smile, Search, Phone, Video, 
  Trash2, Edit2, Zap, Shield, AlertCircle, Share2, MoreVertical, X, Lock, Check, CheckCheck
} from 'lucide-react';

const ChatWindow = (props) => {
  const {
    activeContactId, contacts, isScreenBlurred, disappearingModes, disappearingModeOwners, currentUser, 
    handleToggleVanishMode, chatSearchQuery, setChatSearchQuery, showChatSearch, setShowChatSearch,
    handleDeleteMessage, handleEditMessage, handleForwardMessage, handlePinMessage, 
    messageInput, setMessageInput, handleSendMessage, replyToMsg, setReplyToMsg,
    typingStates, showAiPanel, setShowAiPanel, setAiActiveFeature, showCreateGroupModal,
    setShowCreateGroupModal, messageEndRef, aiLoading, aiResult, getMessageExpiryTimestamp,
    isExpiredMessage, applyLocalVanishExpiry, handleReaction, setForwardingMsg, setShowForwardModal
  } = props;

  // Render component
  return (
\${chatLines.join('\n')}
  );
};

export default ChatWindow;
`;

fs.writeFileSync('src/components/ChatWindow/ChatWindow.jsx', chatContent, 'utf8');

const newAppLines = [
  ...lines.slice(0, startLine),
  `          <ChatWindow 
            activeContactId={activeContactId} contacts={contacts} isScreenBlurred={isScreenBlurred} 
            disappearingModes={disappearingModes} disappearingModeOwners={disappearingModeOwners} 
            currentUser={currentUser} handleToggleVanishMode={handleToggleVanishMode} 
            chatSearchQuery={chatSearchQuery} setChatSearchQuery={setChatSearchQuery} 
            showChatSearch={showChatSearch} setShowChatSearch={setShowChatSearch} 
            handleDeleteMessage={handleDeleteMessage} handleEditMessage={handleEditMessage} 
            handleForwardMessage={handleForwardMessage} handlePinMessage={handlePinMessage} 
            messageInput={messageInput} setMessageInput={setMessageInput} 
            handleSendMessage={handleSendMessage} replyToMsg={replyToMsg} setReplyToMsg={setReplyToMsg} 
            typingStates={typingStates} showAiPanel={showAiPanel} setShowAiPanel={setShowAiPanel} 
            setAiActiveFeature={setAiActiveFeature} showCreateGroupModal={showCreateGroupModal} 
            setShowCreateGroupModal={setShowCreateGroupModal} messageEndRef={messageEndRef} 
            aiLoading={aiLoading} aiResult={aiResult} getMessageExpiryTimestamp={getMessageExpiryTimestamp} 
            isExpiredMessage={isExpiredMessage} applyLocalVanishExpiry={applyLocalVanishExpiry} 
            handleReaction={handleReaction} setForwardingMsg={setForwardingMsg} setShowForwardModal={setShowForwardModal}
            {...props} // pass everything else dynamically in case something is missing
          />`,
  ...lines.slice(endLine)
];

const importIndex = newAppLines.findIndex(line => line.includes('import Sidebar from'));
newAppLines.splice(importIndex + 1, 0, "import ChatWindow from './components/ChatWindow/ChatWindow';");

fs.writeFileSync(appFile, newAppLines.join('\n'), 'utf8');
console.log('ChatWindow extracted successfully');
