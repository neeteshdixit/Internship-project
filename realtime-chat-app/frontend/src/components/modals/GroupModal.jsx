import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { apiFetch } from '../../lib/apiFetch';

export default function GroupModal() {
  const { closeModal } = useUI();
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName.trim(),
          members: []
        }),
      });
      closeModal();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-dark)', width: '400px', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--primary)" />
            <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>Create New Group</h3>
          </div>
          <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Group Name</label>
            <input 
              type="text" 
              placeholder="e.g. Core Development Team"
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: 'var(--chat-input-bg)', border: 'none', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }} 
            />
          </div>

          <button type="submit" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            Create Group
          </button>
        </form>

      </div>
    </div>
  );
}