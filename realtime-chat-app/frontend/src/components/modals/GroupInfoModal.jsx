import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, ShieldCheck, LogOut, Search, Check, AlertCircle, Phone, Video } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiFetch';

export default function GroupInfoModal() {
  const { closeModal } = useUI();
  const { selectedContact, contacts, refreshContacts, selectContact } = useChat();
  const { user: currentUser } = useAuth();

  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add participant view state
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchContactTerm, setSearchContactTerm] = useState('');
  const [selectedUsernames, setSelectedUsernames] = useState([]);

  // Confirmation modals
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const groupId = selectedContact?.id;

  const fetchGroupDetails = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch(`/api/groups/${groupId}/members`);
      setGroupDetails(data);
    } catch (err) {
      if (err.message && err.message.includes('No static resource')) {
        setError('Backend restart required: Naye group endpoints activate karne ke liye backend terminal mein Ctrl+C dabakar "mvn spring-boot:run" chalayein.');
      } else {
        setError(err.message || 'Failed to load group info');
      }
      setGroupDetails((prev) => prev || {
        id: groupId,
        name: selectedContact?.customName || selectedContact?.name || 'Group',
        avatar: selectedContact?.avatar,
        members: [],
        memberCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Determine existing member usernames/ids to filter available contacts
  const existingMemberUsernames = (groupDetails?.members || []).map((m) =>
    (m.username || '').toLowerCase()
  );

  const availableContacts = contacts.filter((c) => {
    if (c.isGroup) return false;
    const name = (c.username || c.name || '').toLowerCase();
    if (existingMemberUsernames.includes(name)) return false;
    if (c.contactUserId && groupDetails?.members?.some((m) => m.id === c.contactUserId)) return false;
    if (searchContactTerm) {
      const matchName = (c.customName || c.name || c.username || '').toLowerCase();
      const matchPhone = (c.phoneNumber || '').toLowerCase();
      return matchName.includes(searchContactTerm.toLowerCase()) || matchPhone.includes(searchContactTerm.toLowerCase());
    }
    return true;
  });

  const toggleSelectMember = (username) => {
    if (selectedUsernames.includes(username)) {
      setSelectedUsernames(selectedUsernames.filter((u) => u !== username));
    } else {
      setSelectedUsernames([...selectedUsernames, username]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsernames.length === 0) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiFetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ members: selectedUsernames }),
      });
      setGroupDetails(updated);
      setIsAddingMembers(false);
      setSelectedUsernames([]);
      setSearchContactTerm('');
      await refreshContacts();
    } catch (err) {
      setError(err.message || 'Failed to add members');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionLoading(true);
    setError('');
    try {
      const identifier = memberToRemove.username || memberToRemove.id;
      const updated = await apiFetch(`/api/groups/${groupId}/members/${encodeURIComponent(identifier)}`, {
        method: 'DELETE',
      });
      setGroupDetails(updated);
      setMemberToRemove(null);
      await refreshContacts();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExitGroup = async () => {
    setActionLoading(true);
    setError('');
    try {
      await apiFetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      });
      setShowExitConfirm(false);
      closeModal('groupInfo');
      await refreshContacts();
      selectContact(null);
    } catch (err) {
      setError(err.message || 'Failed to exit group');
    } finally {
      setActionLoading(false);
    }
  };

  const isAdmin = groupDetails?.isAdmin;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
      }}
      onClick={() => closeModal('groupInfo')}
    >
      <div
        style={{
          backgroundColor: '#111b21',
          width: 'min(440px, calc(100vw - 20px))',
          maxHeight: 'min(640px, calc(100dvh - 30px))',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #202c33',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#202c33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #222d34',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            {isAddingMembers ? (
              <button
                onClick={() => {
                  setIsAddingMembers(false);
                  setSelectedUsernames([]);
                }}
                style={{ background: 'transparent', border: 'none', color: '#00a884', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            ) : (
              <Users size={18} color="#00a884" />
            )}
            <span>{isAddingMembers ? 'Add Participants' : 'Group Info'}</span>
          </div>
          <button
            onClick={() => closeModal('groupInfo')}
            style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#111b21' }}>
          {error && (
            <div style={{ margin: '12px 16px 0', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isAddingMembers ? (
            /* --- ADD PARTICIPANTS SUB-VIEW --- */
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#202c33',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              >
                <Search size={16} color="#8696a0" />
                <input
                  type="text"
                  placeholder="Search name or number..."
                  value={searchContactTerm}
                  onChange={(e) => setSearchContactTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#e9edef',
                    fontSize: '13px',
                    width: '100%',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              {/* Selected Pills */}
              {selectedUsernames.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {selectedUsernames.map((uname) => (
                    <span
                      key={uname}
                      onClick={() => toggleSelectMember(uname)}
                      style={{
                        backgroundColor: '#00a884',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {uname} <X size={12} />
                    </span>
                  ))}
                </div>
              )}

              {/* Contact list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {availableContacts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8696a0', fontSize: '13px', padding: '30px 10px' }}>
                    No more contacts available to add
                  </div>
                ) : (
                  availableContacts.map((contact) => {
                    const identifier = contact.username || contact.name;
                    const isSelected = selectedUsernames.includes(identifier);
                    const name = contact.customName || contact.name || contact.username;
                    return (
                      <div
                        key={contact.id || contact.username}
                        onClick={() => toggleSelectMember(identifier)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#202c33' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={contact.avatar || contact.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a3942&color=aebac1&size=36`}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: 500 }}>{name}</div>
                            <div style={{ color: '#8696a0', fontSize: '12px' }}>{contact.phoneNumber || contact.about || 'Available'}</div>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '1px solid #8696a0',
                            backgroundColor: isSelected ? '#00a884' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <Check size={12} color="#fff" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add CTA */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #202c33' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMembers(false);
                    setSelectedUsernames([]);
                  }}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={actionLoading || selectedUsernames.length === 0}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: selectedUsernames.length > 0 ? '#00a884' : '#2a3942',
                    color: selectedUsernames.length > 0 ? '#fff' : '#8696a0',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: selectedUsernames.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <UserPlus size={16} />
                  <span>{actionLoading ? 'Adding...' : `Add (${selectedUsernames.length})`}</span>
                </button>
              </div>
            </div>
          ) : (
            /* --- GROUP DETAILS & PARTICIPANTS VIEW --- */
            <div>
              {/* Profile Card Header */}
              <div style={{ padding: '24px 20px', backgroundColor: '#111b21', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '8px solid #0c1317' }}>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <img
                    src={groupDetails?.avatar || selectedContact?.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=150'}
                    alt=""
                    style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #202c33' }}
                  />
                </div>
                <h2 style={{ color: '#e9edef', fontSize: '19px', fontWeight: 600, margin: '0 0 4px 0', textAlign: 'center' }}>
                  {groupDetails?.name || selectedContact?.name}
                </h2>
                <p style={{ color: '#8696a0', fontSize: '13px', margin: 0 }}>
                  Group · {groupDetails?.memberCount || groupDetails?.members?.length || 0} participants
                </p>
                {groupDetails?.createdByUsername && (
                  <p style={{ color: '#667781', fontSize: '11px', marginTop: '6px' }}>
                    Created by {groupDetails.createdByUsername}
                  </p>
                )}
              </div>

              {/* Participants Section */}
              <div style={{ padding: '16px 20px', borderBottom: '8px solid #0c1317' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#8696a0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {groupDetails?.members?.length || 0} PARTICIPANTS
                  </span>
                  <button
                    onClick={() => setIsAddingMembers(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00a884',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <UserPlus size={15} /> Add Participants
                  </button>
                </div>

                {/* Add participant quick row */}
                <div
                  onClick={() => setIsAddingMembers(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    cursor: 'pointer',
                    borderBottom: '1px solid #1f2c34',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={20} color="#fff" />
                  </div>
                  <div>
                    <div style={{ color: '#00a884', fontSize: '14px', fontWeight: 500 }}>Add participants</div>
                    <div style={{ color: '#8696a0', fontSize: '12px' }}>Select from contacts</div>
                  </div>
                </div>

                {/* Participants list */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '6px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', color: '#8696a0', padding: '16px', fontSize: '13px' }}>Loading participants...</div>
                  ) : (
                    groupDetails?.members?.map((member) => {
                      const name = member.username || 'Participant';
                      const isSelf = member.isYou || member.username?.toLowerCase() === currentUser?.username?.toLowerCase();
                      const canRemove = isAdmin && !isSelf;

                      return (
                        <div
                          key={member.id || member.username}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <img
                              src={member.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a3942&color=aebac1&size=40`}
                              alt=""
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#e9edef', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isSelf ? `${name} (You)` : name}
                                </span>
                              </div>
                              <div style={{ color: '#8696a0', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.phoneNumber || member.about || 'Hey there! I am using WhatsApp.'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {member.isAdmin && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#00a884',
                                  backgroundColor: 'rgba(0,168,132,0.12)',
                                  border: '1px solid rgba(0,168,132,0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                }}
                              >
                                Group Admin
                              </span>
                            )}

                            {canRemove && (
                              <button
                                onClick={() => setMemberToRemove(member)}
                                title={`Remove ${name}`}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#8696a0',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  borderRadius: '50%',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#8696a0')}
                              >
                                <UserMinus size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Exit Group Danger Zone */}
              <div style={{ padding: '16px 20px' }}>
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <LogOut size={16} /> Exit Group
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remove Member Confirmation Dialog */}
        {memberToRemove && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <div style={{ backgroundColor: '#202c33', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
              <UserMinus size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: '#e9edef', margin: '0 0 8px 0', fontSize: '16px' }}>Remove from group?</h4>
              <p style={{ color: '#8696a0', fontSize: '13px', margin: '0 0 16px 0' }}>
                Remove <strong>{memberToRemove.username}</strong> from "{groupDetails?.name}"?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setMemberToRemove(null)}
                  style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '6px', color: '#8696a0', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={actionLoading}
                  style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Group Confirmation Dialog */}
        {showExitConfirm && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <div style={{ backgroundColor: '#202c33', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
              <LogOut size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: '#e9edef', margin: '0 0 8px 0', fontSize: '16px' }}>Exit "{groupDetails?.name}"?</h4>
              <p style={{ color: '#8696a0', fontSize: '13px', margin: '0 0 16px 0' }}>
                You will no longer be able to send or receive messages in this group.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '6px', color: '#8696a0', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExitGroup}
                  disabled={actionLoading}
                  style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Exiting...' : 'Exit Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
