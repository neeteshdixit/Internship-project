const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

const lines = content.split('\n');
const startLine = 3443;
const endLine = 4149; // Before {/* Active Chat Window Panel */}

const sidebarLines = lines.slice(startLine, endLine);

const sidebarContent = `import React from 'react';
import { 
  MessageSquare, Circle, Phone, Activity, Settings, Sun, Moon, LogOut, 
  Search, Check, CheckCheck, ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';

const Sidebar = (props) => {
  const {
    currentUser, sidebarTab, setSidebarTab, setShowProfileModal, themeMode, toggleTheme, handleLogout,
    setShowScheduleModal, handleSearchContact, searchQuery, setSearchQuery, searchError, setSearchError,
    selectedLabelFilter, setSelectedLabelFilter, contacts, activeContactId, setActiveContactId,
    getCallMessagePreview, statusType, setStatusType, newStatusCaption, setNewStatusCaption,
    statusTextBg, setStatusTextBg, newStatusImg, setNewStatusImg, handlePostStatus, myStatuses,
    openStatusViewer, friendStatuses, callHistory, startCall, analyticsData, isAnalyticsLoading,
    lastSeenVisibility, setLastSeenVisibility, onlineVisibility, setOnlineVisibility, readReceipts,
    setReadReceipts, handleSavePrivacySettings, chatWallpaper, setChatWallpaper, fontSize, setFontSize,
    bubbleStyle, setBubbleStyle, aiSettings, saveAiSettings, aiTransparencyData, setShowTransparencyModal,
    typingStates, messageClock
  } = props;

  // Additional helpers needed in Sidebar
  const getCallIcon = (direction) => {
    return direction === 'incoming' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'missed': return 'Missed Call';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      case 'busy': return 'Busy';
      case 'no_answer': return 'No Answer';
      case 'offline': return 'Offline';
      case 'failed': return 'Failed';
      case 'connected': return 'Call completed';
      default: return status;
    }
  };

  const fmtDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return \`\${m}:\${String(s).padStart(2, '0')}\`;
  };

  return (
\${sidebarLines.join('\n')}
  );
};

export default Sidebar;
`;

fs.writeFileSync('src/components/Sidebar/Sidebar.jsx', sidebarContent, 'utf8');

// Replace the block in App.jsx
const newAppLines = [
  ...lines.slice(0, startLine),
  `          <Sidebar 
            currentUser={currentUser} sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} 
            setShowProfileModal={setShowProfileModal} themeMode={themeMode} toggleTheme={toggleTheme} 
            handleLogout={handleLogout} setShowScheduleModal={setShowScheduleModal} 
            handleSearchContact={handleSearchContact} searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} searchError={searchError} setSearchError={setSearchError} 
            selectedLabelFilter={selectedLabelFilter} setSelectedLabelFilter={setSelectedLabelFilter} 
            contacts={contacts} activeContactId={activeContactId} setActiveContactId={setActiveContactId} 
            getCallMessagePreview={getCallMessagePreview} statusType={statusType} setStatusType={setStatusType} 
            newStatusCaption={newStatusCaption} setNewStatusCaption={setNewStatusCaption} 
            statusTextBg={statusTextBg} setStatusTextBg={setStatusTextBg} newStatusImg={newStatusImg} 
            setNewStatusImg={setNewStatusImg} handlePostStatus={handlePostStatus} myStatuses={myStatuses} 
            openStatusViewer={openStatusViewer} friendStatuses={friendStatuses} callHistory={callHistory} 
            startCall={startCall} analyticsData={analyticsData} isAnalyticsLoading={isAnalyticsLoading} 
            lastSeenVisibility={lastSeenVisibility} setLastSeenVisibility={setLastSeenVisibility} 
            onlineVisibility={onlineVisibility} setOnlineVisibility={setOnlineVisibility} 
            readReceipts={readReceipts} setReadReceipts={setReadReceipts} 
            handleSavePrivacySettings={handleSavePrivacySettings} chatWallpaper={chatWallpaper} 
            setChatWallpaper={setChatWallpaper} fontSize={fontSize} setFontSize={setFontSize} 
            bubbleStyle={bubbleStyle} setBubbleStyle={setBubbleStyle} aiSettings={aiSettings} 
            saveAiSettings={saveAiSettings} aiTransparencyData={aiTransparencyData} 
            setShowTransparencyModal={setShowTransparencyModal} typingStates={typingStates} 
            messageClock={messageClock}
          />`,
  ...lines.slice(endLine)
];

// We need to add the import statement for Sidebar
const importIndex = newAppLines.findIndex(line => line.includes('import Auth from'));
newAppLines.splice(importIndex + 1, 0, "import Sidebar from './components/Sidebar/Sidebar';");

// We need to remove getCallIcon, getStatusLabel, fmtDuration from App.jsx if they exist and are not used elsewhere.
// Actually, it's safer to leave them in App.jsx and let them be shadowed, or remove them manually later if eslint complains.

fs.writeFileSync(appFile, newAppLines.join('\n'), 'utf8');

console.log('Sidebar extracted successfully');
