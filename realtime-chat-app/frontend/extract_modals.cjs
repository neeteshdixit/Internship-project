const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

const startLine = 3489; // showSummaryModal
const endLine = 4447; // before closing div of dashboard-layout

const modalsLines = lines.slice(startLine, endLine);

const modalsContent = `import React from 'react';
import { 
  X, Phone, Video, Mic, MicOff, PhoneOff, AlertCircle, Trash2, 
  Settings, Lock, MessageSquare, Send, Check
} from 'lucide-react';

const Modals = (props) => {
  const {
    showSummaryModal, setShowSummaryModal, isAiLoading, aiSummaryText, latestAiReport,
    activeCall, callStatus, callDuration, incomingCallSignal, cameraOn, micMuted, setCameraOn, setMicMuted,
    acceptCall, rejectCall, endCall, peerConnectionRef, localVideoRef, remoteVideoRef,
    viewingStatusGroup, setViewingStatusGroup, activeStatusIndex, setActiveStatusIndex,
    showScheduleModal, setShowScheduleModal, scheduleText, setScheduleText, scheduleTime, setScheduleTime, handleScheduleMessage,
    showForwardModal, setShowForwardModal, forwardingMsg, contacts, handleForwardSubmit,
    showProfileModal, setShowProfileModal, currentUser, profileUsername, setProfileUsername, profileEmail, setProfileEmail,
    profilePhone, setProfilePhone, profilePic, setProfilePic, handleProfileUpdate, profileError, profileSuccess, setProfileError, setProfileSuccess,
    showContactProfileModal, setShowContactProfileModal, activeContactId, getConversationVanishConfig, disappearingModes,
    handleToggleVanishMode,
    showCreateGroupModal, setShowCreateGroupModal, groupNameInput, setGroupNameInput, selectedGroupMembers, setSelectedGroupMembers,
    handleCreateGroup,
    showTransparencyModal, setShowTransparencyModal, aiTransparencyData, aiSettings,
    showPrivacyPermissionModal, setShowPrivacyPermissionModal, pendingAiFeature, handlePrivacyPermission,
    showAiPanel, setShowAiPanel, aiActiveFeature, setAiActiveFeature, aiChatMode, setAiChatMode, aiOffline, aiResult,
    aiRewriteMode, setAiRewriteMode, aiCustomText, setAiCustomText, handleAiRewrite, aiCopied, setAiCopied,
    aiTranslateLang, setAiTranslateLang, handleAiTranslate, aiExplainLevel, setAiExplainLevel, handleAiExplain,
    aiSmartReplies, handleAiSmartReply,
    aiChatMessages, aiChatInput, setAiChatInput, aiChatLoading, sendAiChat, aiChatEndRef
  } = props;

  // Render component
  return (
    <>
\${modalsLines.join('\n')}
    </>
  );
};

export default Modals;
`;

fs.writeFileSync('src/components/Modals/Modals.jsx', modalsContent, 'utf8');

const newAppLines = [
  ...lines.slice(0, startLine),
  `          <Modals 
            showSummaryModal={showSummaryModal} setShowSummaryModal={setShowSummaryModal} isAiLoading={isAiLoading} 
            aiSummaryText={aiSummaryText} latestAiReport={latestAiReport} activeCall={activeCall} 
            callStatus={callStatus} callDuration={callDuration} incomingCallSignal={incomingCallSignal} 
            cameraOn={cameraOn} micMuted={micMuted} setCameraOn={setCameraOn} setMicMuted={setMicMuted} 
            acceptCall={acceptCall} rejectCall={rejectCall} endCall={endCall} peerConnectionRef={peerConnectionRef} 
            localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef} viewingStatusGroup={viewingStatusGroup} 
            setViewingStatusGroup={setViewingStatusGroup} activeStatusIndex={activeStatusIndex} 
            setActiveStatusIndex={setActiveStatusIndex} showScheduleModal={showScheduleModal} 
            setShowScheduleModal={setShowScheduleModal} scheduleText={scheduleText} setScheduleText={setScheduleText} 
            scheduleTime={scheduleTime} setScheduleTime={setScheduleTime} handleScheduleMessage={handleScheduleMessage} 
            showForwardModal={showForwardModal} setShowForwardModal={setShowForwardModal} 
            forwardingMsg={forwardingMsg} contacts={contacts} handleForwardSubmit={handleForwardSubmit} 
            showProfileModal={showProfileModal} setShowProfileModal={setShowProfileModal} currentUser={currentUser} 
            profileUsername={profileUsername} setProfileUsername={setProfileUsername} profileEmail={profileEmail} 
            setProfileEmail={setProfileEmail} profilePhone={profilePhone} setProfilePhone={setProfilePhone} 
            profilePic={profilePic} setProfilePic={setProfilePic} handleProfileUpdate={handleProfileUpdate} 
            profileError={profileError} profileSuccess={profileSuccess} setProfileError={setProfileError} 
            setProfileSuccess={setProfileSuccess} showContactProfileModal={showContactProfileModal} 
            setShowContactProfileModal={setShowContactProfileModal} activeContactId={activeContactId} 
            getConversationVanishConfig={getConversationVanishConfig} disappearingModes={disappearingModes} 
            handleToggleVanishMode={handleToggleVanishMode} showCreateGroupModal={showCreateGroupModal} 
            setShowCreateGroupModal={setShowCreateGroupModal} groupNameInput={groupNameInput} 
            setGroupNameInput={setGroupNameInput} selectedGroupMembers={selectedGroupMembers} 
            setSelectedGroupMembers={setSelectedGroupMembers} handleCreateGroup={handleCreateGroup} 
            showTransparencyModal={showTransparencyModal} setShowTransparencyModal={setShowTransparencyModal} 
            aiTransparencyData={aiTransparencyData} aiSettings={aiSettings} 
            showPrivacyPermissionModal={showPrivacyPermissionModal} 
            setShowPrivacyPermissionModal={setShowPrivacyPermissionModal} pendingAiFeature={pendingAiFeature} 
            handlePrivacyPermission={handlePrivacyPermission} showAiPanel={showAiPanel} 
            setShowAiPanel={setShowAiPanel} aiActiveFeature={aiActiveFeature} setAiActiveFeature={setAiActiveFeature} 
            aiChatMode={aiChatMode} setAiChatMode={setAiChatMode} aiOffline={aiOffline} aiResult={aiResult} 
            aiRewriteMode={aiRewriteMode} setAiRewriteMode={setAiRewriteMode} aiCustomText={aiCustomText} 
            setAiCustomText={setAiCustomText} handleAiRewrite={handleAiRewrite} aiCopied={aiCopied} 
            setAiCopied={setAiCopied} aiTranslateLang={aiTranslateLang} setAiTranslateLang={setAiTranslateLang} 
            handleAiTranslate={handleAiTranslate} aiExplainLevel={aiExplainLevel} 
            setAiExplainLevel={setAiExplainLevel} handleAiExplain={handleAiExplain} aiSmartReplies={aiSmartReplies} 
            handleAiSmartReply={handleAiSmartReply} aiChatMessages={aiChatMessages} aiChatInput={aiChatInput} 
            setAiChatInput={setAiChatInput} aiChatLoading={aiChatLoading} sendAiChat={sendAiChat} 
            aiChatEndRef={aiChatEndRef}
            {...props} // pass everything else dynamically in case something is missing
          />`,
  ...lines.slice(endLine)
];

const importIndex = newAppLines.findIndex(line => line.includes('import ChatWindow from'));
newAppLines.splice(importIndex + 1, 0, "import Modals from './components/Modals/Modals';");

fs.writeFileSync(appFile, newAppLines.join('\n'), 'utf8');
console.log('Modals extracted successfully');
