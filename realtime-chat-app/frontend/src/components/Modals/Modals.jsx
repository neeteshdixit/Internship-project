import React, { useState, useEffect } from 'react';
import {
  X, Phone, Video, Mic, MicOff, PhoneOff, Camera, CameraOff,
  Shield, Lock, Bot, Send, Copy, Check, RefreshCw, MessageSquare,
  Calendar, Star, AlertTriangle, User, Users, Image, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useChat, getConversationVanishConfig } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import {
  useScheduledMessages, useScheduleMessage, useDeleteScheduledMessage,
  useUpdateProfile, useRunAiFeature, useAiChat
} from '../../hooks/useAiSettings';
import { useAnalytics } from '../../hooks/useAnalytics';
import { apiFetch } from '../../lib/apiFetch';

const Modals = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const {
    showSummaryModal, setShowSummaryModal,
    showScheduleModal, setShowScheduleModal,
    showForwardModal, setShowForwardModal,
    showProfileModal, setShowProfileModal,
    showContactProfileModal, setShowContactProfileModal,
    showCreateGroupModal, setShowCreateGroupModal,
    showTransparencyModal, setShowTransparencyModal,
    showPrivacyPermissionModal, setShowPrivacyPermissionModal,
    showAiPanel, setShowAiPanel,
    replyToMsg, setReplyToMsg,
    forwardingMsg, setForwardingMsg,
    groupNameInput, setGroupNameInput,
    selectedGroupMembers, setSelectedGroupMembers,
    scheduleText, setScheduleText,
    scheduleTime, setScheduleTime,
    profileUsername, setProfileUsername,
    profileEmail, setProfileEmail,
    profilePhone, setProfilePhone,
    profilePic, setProfilePic,
    profileAbout, setProfileAbout,
    profileError, setProfileError,
    profileSuccess, setProfileSuccess,
    pendingAiFeature, setPendingAiFeature,
  } = useUI();
  const {
    contacts, activeContactId, setActiveContactId,
    disappearingModes,
    stompClientRef, aiChatEndRef,
    aiTransparencyData, aiSettings,
    queryClient,
    handleToggleVanishMode,
  } = useChat();
  const {
    activeCall, callStatus, callDuration,
    incomingCallSignal, cameraOn, setCameraOn,
    micMuted, setMicMuted,
    acceptCall, rejectCall, endCall,
    peerConnectionRef, localStreamRef,
  } = useCall();

  const activeContact = contacts.find(c => c.id === activeContactId);

  // ─── LOCAL AI PANEL STATE ───
  const [aiActiveFeature, setAiActiveFeature] = useState('summarize');
  const [aiChatMode, setAiChatMode] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiCopied, setAiCopied] = useState(false);
  const [aiOffline, setAiOffline] = useState(false);
  const [aiSmartReplies, setAiSmartReplies] = useState([]);
  const [aiCustomText, setAiCustomText] = useState('');
  const [aiRewriteMode, setAiRewriteMode] = useState('formal');
  const [aiTranslateLang, setAiTranslateLang] = useState('Hindi');
  const [aiExplainLevel, setAiExplainLevel] = useState('simple');
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiSummaryText, setAiSummaryText] = useState('');

  // React Query mutations
  const runAiFeatureMutation = useRunAiFeature();
  const aiChatMutation = useAiChat();
  const scheduleMessageMutation = useScheduleMessage();
  const deleteScheduledMutation = useDeleteScheduledMessage();
  const updateProfileMutation = useUpdateProfile();

  const scheduledMessagesQuery = useScheduledMessages(showScheduleModal);

  // Analytics for active contact
  const analyticsQuery = useAnalytics(
    activeContact?.username || activeContact?.name,
    Boolean(activeContact && !activeContact.isAi)
  );

  // Populate profile form when modal opens
  useEffect(() => {
    if (showProfileModal && currentUser) {
      setProfileUsername(currentUser.username || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phoneNumber || '');
      setProfilePic(currentUser.profilePicUrl || '');
      setProfileAbout(currentUser.about || 'Hey there! I am using WhatsApp.');
      setProfileError(null);
      setProfileSuccess(false);
    }
  }, [showProfileModal, currentUser]);

  // AI: build transcript from active chat
  const buildTranscript = () => {
    const ac = contacts.find(c => c.id === activeContactId);
    if (!ac || !ac.messages) return '';
    return ac.messages
      .filter(m => m.messageType !== 'CALL' && m.text && m.text !== 'DELETED')
      .slice(-40)
      .map(m => `${m.sender === 'me' ? (currentUser?.username || 'Me') : ac.name}: ${m.text}`)
      .join('\n');
  };

  const runAiFeature = async (feature) => {
    setAiActiveFeature(feature);
    setAiResult('');
    setAiSmartReplies([]);
    setAiOffline(false);
    setAiCopied(false);
    const ac = contacts.find(c => c.id === activeContactId);
    const transcript = buildTranscript();

    try {
      let endpoint = feature;
      let body = { text: transcript };

      if (feature === 'grammar') body.text = aiCustomText || ac?.messages?.filter(m => m.sender === 'me' && m.text && m.text !== 'DELETED').slice(-1)[0]?.text || '';
      if (feature === 'translate') { body.text = aiCustomText || transcript.split('\n').slice(-1)[0] || ''; body.param = aiTranslateLang; }
      if (feature === 'rewrite') { body.text = aiCustomText || ac?.messages?.filter(m => m.sender === 'me' && m.text && m.text !== 'DELETED').slice(-1)[0]?.text || ''; body.param = aiRewriteMode; }
      if (feature === 'explain') { body.text = aiCustomText || transcript.split('\n').slice(-1)[0] || ''; body.param = aiExplainLevel; }
      if (feature === 'improve') body.text = aiCustomText || ac?.messages?.filter(m => m.sender === 'me' && m.text && m.text !== 'DELETED').slice(-1)[0]?.text || '';

      const data = await runAiFeatureMutation.mutateAsync({ endpoint, body });
      const result = data.responseText || '';

      if (feature === 'smart-reply') {
        const lines = result.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
        setAiSmartReplies(lines);
      } else {
        setAiResult(result);
      }
      if (result.includes('currently unavailable')) setAiOffline(true);
    } catch (e) {
      setAiOffline(true);
    }
  };

  const sendAiChat = async () => {
    const msg = aiChatInput.trim();
    if (!msg || aiChatMutation.isPending) return;
    const userMsg = { role: 'user', text: msg };
    const updated = [...aiChatMessages, userMsg];
    setAiChatMessages(updated);
    setAiChatInput('');

    const historyStr = updated.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    try {
      const data = await aiChatMutation.mutateAsync({ message: msg, historyStr });
      setAiChatMessages(prev => [...prev, { role: 'assistant', text: data.responseText?.trim() || '' }]);
    } catch (e) {
      setAiChatMessages(prev => [...prev, { role: 'assistant', text: 'AI Assistant is currently unavailable.' }]);
    }
    setTimeout(() => aiChatEndRef?.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const updatedUser = await updateProfileMutation.mutateAsync({ profileUsername, profileEmail, profilePhone, profilePic, profileAbout, token });
      const newUserData = { ...currentUser, username: updatedUser.username, email: updatedUser.email, phoneNumber: updatedUser.phoneNumber, profilePicUrl: updatedUser.profilePicUrl, about: updatedUser.about };
      setCurrentUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setProfileSuccess(true);
      setTimeout(() => setShowProfileModal(false), 1500);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupNameInput.trim() || selectedGroupMembers.length === 0) return;
    try {
      await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupNameInput, memberUsernames: selectedGroupMembers }),
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowCreateGroupModal(false);
      setGroupNameInput('');
      setSelectedGroupMembers([]);
    } catch (err) {
      alert('Failed to create group: ' + err.message);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!activeContact || !scheduleText.trim() || !scheduleTime) return;
    try {
      await scheduleMessageMutation.mutateAsync({ receiverUsername: activeContact.name, content: scheduleText, scheduledTime: scheduleTime });
      setScheduleText(''); setScheduleTime('');
      setShowScheduleModal(false);
      alert('Message scheduled successfully!');
    } catch (err) {
      alert(err.message || 'Failed to schedule message');
    }
  };

  const fmtCallDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══ INCOMING CALL MODAL ═══ */}
      {incomingCallSignal && callStatus === 'ringing' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '20px', padding: '32px', textAlign: 'center', minWidth: '300px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
              📞
            </div>
            <p style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>{incomingCallSignal.senderUsername}</p>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Incoming {incomingCallSignal.callType === 'VIDEO' ? 'Video' : 'Audio'} Call
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={rejectCall} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ff4d4f', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <PhoneOff size={24} />
              </button>
              <button onClick={acceptCall} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#00e676', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                <Phone size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ACTIVE CALL MODAL ═══ */}
      {activeCall && callStatus !== 'ringing' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {activeCall === 'video' && (
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', aspectRatio: '16/9', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
              <video id="remoteVideo" autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <video id="localVideo" autoPlay playsInline muted style={{ position: 'absolute', bottom: '12px', right: '12px', width: '120px', borderRadius: '10px', objectFit: 'cover' }} />
            </div>
          )}
          {activeCall === 'audio' && <audio id="remoteAudio" autoPlay />}

          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>{activeContact?.name}</p>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
              {callStatus === 'calling' ? 'Calling...' : callStatus === 'ringing' ? 'Ringing...' : callStatus === 'connecting' ? 'Connecting...' : fmtCallDuration(callDuration)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={() => setMicMuted(m => !m)}
              style={{ width: '54px', height: '54px', borderRadius: '50%', background: micMuted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {micMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            {activeCall === 'video' && (
              <button onClick={() => {
                setCameraOn(v => !v);
                const track = localStreamRef?.current?.getVideoTracks()[0];
                if (track) track.enabled = cameraOn;
              }}
                style={{ width: '54px', height: '54px', borderRadius: '50%', background: !cameraOn ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cameraOn ? <Camera size={22} /> : <CameraOff size={22} />}
              </button>
            )}
            <button onClick={endCall}
              style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ff4d4f', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ PROFILE EDIT MODAL ═══ */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowProfileModal(false)}>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '28px', minWidth: '360px', maxWidth: '440px', width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Edit Profile</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <img src={profilePic || currentUser?.profilePicUrl || '/image.png'} alt="profile"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
              </div>
              {[
                { label: 'Username', val: profileUsername, set: setProfileUsername, type: 'text' },
                { label: 'Email', val: profileEmail, set: setProfileEmail, type: 'email' },
                { label: 'Phone', val: profilePhone, set: setProfilePhone, type: 'tel' },
                { label: 'Profile Picture URL', val: profilePic, set: setProfilePic, type: 'url' },
              ].map(({ label, val, set, type }) => (
                <div key={label}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>About</label>
                <input type="text" value={profileAbout} onChange={e => setProfileAbout(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              {profileError && <p style={{ color: '#ff4d4f', fontSize: '12px', margin: 0 }}>{profileError}</p>}
              {profileSuccess && <p style={{ color: '#00e676', fontSize: '12px', margin: 0 }}>✅ Profile updated!</p>}
              <button type="submit" disabled={updateProfileMutation.isPending}
                style={{ padding: '11px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ SCHEDULE MESSAGE MODAL ═══ */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowScheduleModal(false)}>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '28px', minWidth: '360px', maxWidth: '440px', width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                <Calendar size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Schedule Message
              </h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea value={scheduleText} onChange={e => setScheduleText(e.target.value)} placeholder="Message content..." required rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
              <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
              <button type="submit" disabled={scheduleMessageMutation.isPending}
                style={{ padding: '11px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                {scheduleMessageMutation.isPending ? 'Scheduling...' : 'Schedule'}
              </button>
            </form>

            {/* Existing scheduled messages */}
            {scheduledMessagesQuery.data && scheduledMessagesQuery.data.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Scheduled ({scheduledMessagesQuery.data.length})</p>
                {scheduledMessagesQuery.data.map(sm => (
                  <div key={sm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>{sm.content}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(sm.scheduledTime).toLocaleString()}</p>
                    </div>
                    <button onClick={() => deleteScheduledMutation.mutate(sm.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FORWARD MESSAGE MODAL ═══ */}
      {showForwardModal && forwardingMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForwardModal(false)}>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '24px', minWidth: '340px', maxWidth: '420px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Forward Message</h3>
              <button onClick={() => setShowForwardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent)', paddingLeft: '8px' }}>
              {forwardingMsg.text}
            </p>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {contacts.filter(c => c.id !== activeContactId && !c.isAi).map(c => (
                <div key={c.id} onClick={() => {
                  if (stompClientRef.current?.connected) {
                    stompClientRef.current.publish({
                      destination: '/app/chat',
                      body: JSON.stringify({ senderUsername: currentUser.username, receiverUsername: c.username || c.name, content: forwardingMsg.text, isForwarded: true })
                    });
                    alert(`Forwarded to ${c.name}`);
                  }
                  setForwardingMsg(null);
                  setShowForwardModal(false);
                }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <img src={c.avatar || '/image.png'} alt={c.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE GROUP MODAL ═══ */}
      {showCreateGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowCreateGroupModal(false)}>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '28px', minWidth: '360px', maxWidth: '440px', width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                New Group
              </h3>
              <button onClick={() => setShowCreateGroupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <input value={groupNameInput} onChange={e => setGroupNameInput(e.target.value)} placeholder="Group name..."
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px', fontWeight: 600 }}>SELECT MEMBERS</p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {contacts.filter(c => !c.isAi && !c.isNotes && !c.isGroup && c.id !== currentUser?.id).map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}>
                  <input type="checkbox" checked={selectedGroupMembers.includes(c.username || c.name)}
                    onChange={e => {
                      const un = c.username || c.name;
                      setSelectedGroupMembers(prev => e.target.checked ? [...prev, un] : prev.filter(m => m !== un));
                    }} />
                  <img src={c.avatar || '/image.png'} alt={c.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: '14px' }}>{c.name}</span>
                </label>
              ))}
            </div>
            <button onClick={handleCreateGroup} disabled={!groupNameInput.trim() || selectedGroupMembers.length === 0}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px', opacity: (!groupNameInput.trim() || selectedGroupMembers.length === 0) ? 0.5 : 1 }}>
              Create Group ({selectedGroupMembers.length} members)
            </button>
          </div>
        </div>
      )}

      {/* ═══ AI TRANSPARENCY MODAL ═══ */}
      {showTransparencyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowTransparencyModal(false)}>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '28px', minWidth: '360px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                <Shield size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                AI Transparency Report
              </h3>
              <button onClick={() => setShowTransparencyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            {aiTransparencyData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Active Model', value: aiTransparencyData.activeModel },
                  { label: 'Processing Mode', value: aiTransparencyData.processingMode },
                  { label: 'Data Sent to Cloud', value: aiTransparencyData.cloudDataSent ? 'Yes' : 'No' },
                  { label: 'Local Processing', value: aiTransparencyData.localProcessing ? 'Enabled' : 'Disabled' },
                  { label: 'Session Requests', value: aiTransparencyData.sessionRequests },
                ].filter(d => d.value !== undefined).map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No AI transparency data available yet.</p>
            )}
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(var(--accent-rgb),0.1)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Lock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              AI features use your conversation content only for the requested feature. No data is permanently stored by cloud AI providers.
            </div>
          </div>
        </div>
      )}

      {/* ═══ AI PANEL (SIDE DRAWER) ═══ */}
      {showAiPanel && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px', background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--border-color)', zIndex: 7000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
              <Bot size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--accent)' }} />
              Ollama AI Assistant
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setAiChatMode(m => !m)}
                style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: aiChatMode ? 'var(--accent)' : 'none', color: aiChatMode ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                {aiChatMode ? 'Features' : 'Chat Mode'}
              </button>
              <button onClick={() => setShowAiPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
          </div>

          {aiChatMode ? (
            /* Chat Mode */
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiChatMessages.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Ask me anything about this conversation or type a question...</p>
                )}
                {aiChatMessages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'var(--msg-sent-bg)' : 'var(--input-bg)', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiChatMutation.isPending && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'bounce 1s infinite' }} />
                    AI is thinking...
                  </div>
                )}
                <div ref={aiChatEndRef} />
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea value={aiChatInput} onChange={e => setAiChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiChat(); } }}
                  placeholder="Ask AI..." rows={2}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px', resize: 'none', outline: 'none' }} />
                <button onClick={sendAiChat} disabled={!aiChatInput.trim() || aiChatMutation.isPending}
                  style={{ padding: '10px', borderRadius: '50%', background: aiChatInput.trim() ? 'var(--accent)' : 'var(--input-bg)', border: 'none', cursor: 'pointer', color: aiChatInput.trim() ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            /* Features Mode */
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Feature buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['summarize','smart-reply','grammar','translate','rewrite','tasks','meetings','mood','explain','email','improve'].map(f => (
                  <button key={f} onClick={() => runAiFeature(f)}
                    disabled={runAiFeatureMutation.isPending}
                    style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', background: aiActiveFeature === f ? 'var(--accent)' : 'var(--input-bg)', color: aiActiveFeature === f ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s' }}>
                    {f.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Custom text input for some features */}
              {['grammar','translate','rewrite','explain','improve'].includes(aiActiveFeature) && (
                <textarea value={aiCustomText} onChange={e => setAiCustomText(e.target.value)} placeholder="Custom text (leave empty to use last message)..." rows={2}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
              )}

              {/* Feature-specific params */}
              {aiActiveFeature === 'translate' && (
                <select value={aiTranslateLang} onChange={e => setAiTranslateLang(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}>
                  {['Hindi', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
              {aiActiveFeature === 'rewrite' && (
                <select value={aiRewriteMode} onChange={e => setAiRewriteMode(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}>
                  {['formal', 'casual', 'concise', 'elaborate', 'professional'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              )}

              {/* Loading state */}
              {runAiFeatureMutation.isPending && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                  AI is processing...
                </div>
              )}

              {/* Offline notice */}
              {aiOffline && (
                <div style={{ background: 'rgba(255,77,79,0.1)', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#ff4d4f' }}>
                  <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  AI service is currently unavailable. Make sure Ollama is running locally.
                </div>
              )}

              {/* Smart replies */}
              {aiSmartReplies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Suggested Replies</p>
                  {aiSmartReplies.map((reply, i) => (
                    <button key={i} onClick={() => {
                      // Insert into chat input via context would need useUI's setMessageInput
                      // For now, copy to clipboard
                      navigator.clipboard.writeText(reply).catch(() => {});
                      alert(`Copied: "${reply}"`);
                    }}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--accent)', background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}>
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Result */}
              {aiResult && (
                <div style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '14px', position: 'relative' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>AI Result</p>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{aiResult}</p>
                  <button onClick={() => {
                    navigator.clipboard.writeText(aiResult).catch(() => {});
                    setAiCopied(true);
                    setTimeout(() => setAiCopied(false), 2000);
                  }}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    {aiCopied ? <Check size={14} style={{ color: '#00e676' }} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Modals;
