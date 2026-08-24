import React, { useState } from 'react';
import { X, Users, Plus, Trash2, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';
import { apiFetch } from '../../lib/apiFetch';

export default function GroupModal() {
  const { closeModal } = useUI();
  const { contacts, refreshContacts, selectContact } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter contacts (only direct users, not groups)
  const availableUsers = contacts.filter((c) => !c.isGroup);

  const toggleUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName,
          description: description,
          memberIds: selectedUserIds,
        }),
      });

      await refreshContacts();
      if (response && response.id) {
        selectContact({
          id: response.id,
          name: response.name,
          customName: response.name,
          isGroup: true,
        });
      }
      closeModal('group');
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => closeModal('group')}>
      <div style={{ backgroundColor: '#202c33', width: 'min(420px, calc(100vw - 24px))', maxHeight: 'min(560px, calc(100dvh - 32px))', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Users size={18} color="#00a884" /> Create New Group
          </div>
          <button onClick={() => closeModal('group')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateGroup} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          {error && <div style={{ color: '#ef4444', fontSize: '12px', padding: '8px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{error}</div>}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0', display: 'block', marginBottom: '6px' }}>GROUP NAME</label>
            <input
              type="text"
              placeholder="e.g. Project Discussion"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0', display: 'block', marginBottom: '6px' }}>DESCRIPTION (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Group purpose or guidelines"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#8696a0', display: 'block', marginBottom: '8px' }}>
              ADD MEMBERS ({selectedUserIds.length} SELECTED)
            </label>
            <div style={{ maxHeight: 'min(160px, calc(100dvh - 32px))', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#182229', padding: '8px', borderRadius: '8px' }}>
              {availableUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8696a0', fontSize: '12px', padding: '12px' }}>No contacts found</div>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id || user.contactUserId);
                  const name = user.customName || user.name || user.username || 'Contact';
                  return (
                    <div
                      key={user.id || user.username}
                      onClick={() => toggleUser(user.id || user.contactUserId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#2a3942' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={user.avatar || user.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a3942&color=aebac1&size=30`}
                          alt=""
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '13px', color: '#e9edef' }}>{name}</span>
                      </div>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? 'none' : '1px solid #8696a0', backgroundColor: isSelected ? '#00a884' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <Check size={12} color="#fff" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={() => closeModal('group')} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '10px', backgroundColor: '#00a884', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
