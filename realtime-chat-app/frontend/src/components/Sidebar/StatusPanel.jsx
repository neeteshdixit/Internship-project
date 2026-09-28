import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Edit3, Plus, Link, MoreVertical, Eye, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiFetch';
import StatusViewerModal from '../status/StatusViewerModal';
import StatusUploadModal from '../status/StatusUploadModal';

export default function StatusPanel() {
  const { currentUser } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState(0);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialTab, setUploadInitialTab] = useState('upload'); // 'upload' | 'link' | 'text'

  const myAvatar = currentUser?.profilePicUrl || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';

  // Fetch all statuses
  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, mineRes] = await Promise.allSettled([
        apiFetch('/api/statuses'),
        apiFetch('/api/statuses/mine'),
      ]);

      let allGroups = allRes.status === 'fulfilled' && Array.isArray(allRes.value) ? allRes.value : [];
      let mineList = mineRes.status === 'fulfilled' && Array.isArray(mineRes.value) ? mineRes.value : [];

      // Filter out self from allGroups if present, or extract my group
      const myGroup = allGroups.find(g => g.username?.toLowerCase() === currentUser?.username?.toLowerCase());
      if (myGroup && myGroup.updates) {
        setMyStatuses(myGroup.updates);
      } else if (mineList.length > 0) {
        setMyStatuses(mineList);
      } else {
        setMyStatuses([]);
      }

      // Contact groups (excluding self)
      const contactGroups = allGroups.filter(g => g.username?.toLowerCase() !== currentUser?.username?.toLowerCase());
      setStoryGroups(contactGroups);
    } catch (e) {
      console.error('Error fetching statuses:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Open viewer for My Status
  const openMyStatus = () => {
    if (myStatuses.length === 0) {
      setUploadInitialTab('upload');
      setIsUploadOpen(true);
      return;
    }
    const myGroup = {
      username: currentUser?.username || 'me',
      avatar: myAvatar,
      updates: myStatuses,
    };
    // Put myGroup at index 0 of the viewer list
    setViewerList([myGroup, ...storyGroups]);
    setActiveStoryGroupIndex(0);
    setIsViewerOpen(true);
  };

  // Open viewer for a specific contact
  const [viewerList, setViewerList] = useState([]);
  const openContactStatus = (contactIndex) => {
    setViewerList(storyGroups);
    setActiveStoryGroupIndex(contactIndex);
    setIsViewerOpen(true);
  };

  // Delete status handler
  const handleDeleteStatus = async (statusId) => {
    try {
      await apiFetch(`/api/statuses/${statusId}`, { method: 'DELETE' });
      fetchStatuses();
    } catch (e) {
      console.error('Failed to delete status:', e);
    }
  };

  const hasMyStatus = myStatuses.length > 0;
  const lastMyStatus = hasMyStatus ? myStatuses[myStatuses.length - 1] : null;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#111b21',
        color: '#e9edef',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: '#202c33',
          borderBottom: '1px solid #222d34',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#e9edef' }}>Status</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Direct Photo/Video Upload */}
          <button
            type="button"
            onClick={() => {
              setUploadInitialTab('upload');
              setIsUploadOpen(true);
            }}
            title="Upload Photo or Video Status"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00a884',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={20} />
          </button>

          {/* Text Status */}
          <button
            type="button"
            onClick={() => {
              setUploadInitialTab('text');
              setIsUploadOpen(true);
            }}
            title="Write Text Status"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696a0',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit3 size={19} />
          </button>

          {/* Media Link */}
          <button
            type="button"
            onClick={() => {
              setUploadInitialTab('link');
              setIsUploadOpen(true);
            }}
            title="Add Media via Link"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696a0',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Link size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* 1. My Status Row */}
        <div
          onClick={openMyStatus}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #1e2d35',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#182229')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {/* Avatar with WhatsApp Status Ring or Plus Badge */}
          <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
            <img
              src={myAvatar}
              alt=""
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: hasMyStatus ? '2.5px solid #00a884' : '2px solid transparent',
                padding: hasMyStatus ? '2px' : '0',
                boxSizing: 'border-box',
              }}
            />
            {!hasMyStatus && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#00a884',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #111b21',
                }}
              >
                <Plus size={13} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#e9edef' }}>
              My status
            </div>
            <div style={{ fontSize: '13px', color: '#8696a0', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hasMyStatus
                ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''} • ${lastMyStatus?.createdAt || 'Tap to view'}`
                : 'Tap to add status update'}
            </div>
          </div>

          {/* Quick Action Icons */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setUploadInitialTab('upload');
                setIsUploadOpen(true);
              }}
              title="Add Photo / Video"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#202c33',
                border: 'none',
                color: '#00a884',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Camera size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadInitialTab('text');
                setIsUploadOpen(true);
              }}
              title="Add Text Status"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#202c33',
                border: 'none',
                color: '#8696a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Edit3 size={15} />
            </button>
          </div>
        </div>

        {/* 2. Recent Updates Section */}
        <div
          style={{
            padding: '14px 16px 8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#00a884',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          Recent Updates
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>
            Loading status updates...
          </div>
        ) : storyGroups.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8696a0' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#e9edef', marginBottom: '6px' }}>
              No status updates
            </div>
            <div style={{ fontSize: '12px' }}>
              Status updates from your contacts will appear here
            </div>
          </div>
        ) : (
          storyGroups.map((group, idx) => {
            const latestUpdate = group.updates[group.updates.length - 1];
            const updatesCount = group.updates.length;

            return (
              <div
                key={group.username}
                onClick={() => openContactStatus(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #1a2630',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#182229')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Contact Avatar with WhatsApp Green Ring */}
                <div style={{ width: '48px', height: '48px', position: 'relative', flexShrink: 0 }}>
                  <img
                    src={group.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                    alt=""
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid #00a884',
                      padding: '2px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {updatesCount > 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#00a884',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        padding: '1px 5px',
                        border: '1.5px solid #111b21',
                      }}
                    >
                      {updatesCount}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#e9edef' }}>
                    @{group.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8696a0', marginTop: '2px' }}>
                    {latestUpdate?.createdAt || 'Recent update'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Fullscreen Story Viewer Modal */}
      <StatusViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        initialUserIndex={activeStoryGroupIndex}
        storyGroups={viewerList}
        currentUser={currentUser}
        onDeleteStatus={handleDeleteStatus}
      />

      {/* WhatsApp Status Creator Modal (Direct upload, link, text) */}
      <StatusUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        initialTab={uploadInitialTab}
        onStatusPosted={fetchStatuses}
      />
    </div>
  );
}
