import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Trash2, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye, Users } from 'lucide-react';
import { apiFetch } from '../../lib/apiFetch';

export default function StatusViewerModal({
  isOpen,
  onClose,
  initialUserIndex = 0,
  storyGroups = [],
  currentUser,
  onDeleteStatus,
}) {
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [updateIndex, setUpdateIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);

  const videoRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Sync initial user index when modal opens
  useEffect(() => {
    if (isOpen) {
      setUserIndex(initialUserIndex);
      setUpdateIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialUserIndex]);

  const currentGroup = storyGroups[userIndex] || null;
  const updates = currentGroup?.updates || [];
  const currentUpdate = updates[updateIndex] || null;

  const isMyStatus = currentGroup?.username?.toLowerCase() === currentUser?.username?.toLowerCase();

  // Next story handler
  const goToNext = useCallback(() => {
    if (updateIndex < updates.length - 1) {
      setUpdateIndex(prev => prev + 1);
      setProgress(0);
    } else if (userIndex < storyGroups.length - 1) {
      setUserIndex(prev => prev + 1);
      setUpdateIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [updateIndex, updates.length, userIndex, storyGroups.length, onClose]);

  // Previous story handler
  const goToPrev = useCallback(() => {
    if (updateIndex > 0) {
      setUpdateIndex(prev => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      const prevGroup = storyGroups[userIndex - 1];
      setUserIndex(prev => prev - 1);
      setUpdateIndex((prevGroup?.updates?.length || 1) - 1);
      setProgress(0);
    }
  }, [updateIndex, userIndex, storyGroups]);

  // Story progression timer (5000ms for images/text, or driven by video duration)
  useEffect(() => {
    if (!isOpen || !currentUpdate || isPaused) return;

    const isVid = (currentUpdate.type || '').toLowerCase() === 'video';
    if (isVid) return; // Video progress handled by timeupdate

    const interval = 50; // update progress every 50ms
    const totalDuration = 5000;
    const step = (interval / totalDuration) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimerRef.current);
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(progressTimerRef.current);
  }, [isOpen, currentUpdate, isPaused, goToNext]);

  // Video timeupdate handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  // Auto record view when watching a contact's status
  useEffect(() => {
    if (isOpen && currentUpdate && !isMyStatus && currentUpdate.id) {
      apiFetch(`/api/statuses/${currentUpdate.id}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [isOpen, currentUpdate?.id, isMyStatus]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, goToNext, goToPrev, onClose]);

  if (!isOpen || !currentGroup || !currentUpdate) return null;

  const isText = (currentUpdate.type || '').toLowerCase() === 'text';
  const isVideo = (currentUpdate.type || '').toLowerCase() === 'video';

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this status update?')) return;
    if (onDeleteStatus) {
      await onDeleteStatus(currentUpdate.id);
      if (updates.length <= 1) {
        onClose();
      } else {
        goToNext();
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b141a',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Central Story Canvas */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          maxHeight: '94vh',
          backgroundColor: isText ? (currentUpdate.textBackground || '#00a884') : '#000',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top Progress Bars (Segmented) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '4px',
            zIndex: 30,
          }}
        >
          {updates.map((u, i) => {
            let width = '0%';
            if (i < updateIndex) width = '100%';
            else if (i === updateIndex) width = `${progress}%`;
            return (
              <div
                key={u.id || i}
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width,
                    backgroundColor: '#ffffff',
                    transition: i === updateIndex ? 'width 0.05s linear' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Header (Avatar, Username, Time, Actions) */}
        <div
          style={{
            position: 'absolute',
            top: '22px',
            left: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30,
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={currentGroup.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #00a884',
              }}
            />
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {isMyStatus ? 'My Status' : `@${currentGroup.username}`}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {currentUpdate.createdAt || 'Recent'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>

            {isMyStatus && (
              <button
                type="button"
                onClick={handleDelete}
                title="Delete this status"
                style={{
                  background: 'rgba(220,38,38,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Click Zones (Left for prev, Right for next) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          style={{
            position: 'absolute',
            top: '70px',
            bottom: '70px',
            left: 0,
            width: '35%',
            zIndex: 20,
            cursor: 'pointer',
          }}
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          style={{
            position: 'absolute',
            top: '70px',
            bottom: '70px',
            right: 0,
            width: '65%',
            zIndex: 20,
            cursor: 'pointer',
          }}
        />

        {/* Media Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {isText ? (
            <div
              style={{
                padding: '40px 28px',
                textAlign: 'center',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 600,
                lineHeight: 1.4,
                wordBreak: 'break-word',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              {currentUpdate.caption || currentUpdate.content}
            </div>
          ) : isVideo ? (
            <video
              ref={videoRef}
              src={currentUpdate.mediaUrl}
              autoPlay
              muted={isMuted}
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={goToNext}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <img
              src={currentUpdate.mediaUrl}
              alt="Status"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </div>

        {/* Caption Banner at Bottom (for images / videos) */}
        {!isText && currentUpdate.caption && (
          <div
            style={{
              position: 'absolute',
              bottom: isMyStatus ? '50px' : 0,
              left: 0,
              right: 0,
              padding: '16px 20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
              color: '#ffffff',
              fontSize: '15px',
              textAlign: 'center',
              zIndex: 25,
            }}
          >
            {currentUpdate.caption}
          </div>
        )}

        {/* Seen By / Views Badge for My Status */}
        {isMyStatus && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowViewersSheet(true);
              setIsPaused(true);
            }}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 35,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: '6px 16px',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Eye size={15} color="#00a884" />
            <span>{currentUpdate.viewsCount || (currentUpdate.viewers ? currentUpdate.viewers.length : 0)} views</span>
          </div>
        )}

        {/* WhatsApp-Style Viewers Sliding Bottom Sheet */}
        {showViewersSheet && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '60%',
              backgroundColor: '#111b21',
              borderTop: '1px solid #222d34',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #222d34',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '15px', fontWeight: 600 }}>
                <Eye size={17} color="#00a884" />
                <span>Viewed by {currentUpdate.viewsCount || (currentUpdate.viewers ? currentUpdate.viewers.length : 0)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowViewersSheet(false);
                  setIsPaused(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {(!currentUpdate.viewers || currentUpdate.viewers.length === 0) ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8696a0', fontSize: '13px' }}>
                  No views yet
                </div>
              ) : (
                Array.from(currentUpdate.viewers).map((viewerUsername) => (
                  <div
                    key={viewerUsername}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      borderBottom: '1px solid #1a2630',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#202c33',
                        color: '#00a884',
                        fontWeight: 700,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid #00a884',
                      }}
                    >
                      {viewerUsername.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: 500 }}>
                        @{viewerUsername}
                      </div>
                      <div style={{ color: '#8696a0', fontSize: '11px' }}>
                        Viewed
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Next / Prev Arrows for Desktop */}
      {userIndex > 0 || updateIndex > 0 ? (
        <button
          onClick={goToPrev}
          style={{
            position: 'absolute',
            left: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={28} />
        </button>
      ) : null}

      {userIndex < storyGroups.length - 1 || updateIndex < updates.length - 1 ? (
        <button
          onClick={goToNext}
          style={{
            position: 'absolute',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={28} />
        </button>
      ) : null}
    </div>
  );
}
