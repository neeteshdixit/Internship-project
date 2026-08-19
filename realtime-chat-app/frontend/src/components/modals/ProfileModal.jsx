import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiFetch';

export default function ProfileModal() {
  const { closeModal } = useUI();
  const { currentUser } = useAuth();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState('Hey there! I am using Setu Connect.');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (bio) {
        await apiFetch('/api/users/about', {
          method: 'PUT',
          body: JSON.stringify({ about: bio }),
        });
      }
      closeModal();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-dark)', width: '400px', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>Edit Profile</h3>
          <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img 
              src="/image.png" 
              alt="Profile" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: 'var(--chat-input-bg)', border: 'none', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>About / Bio</label>
            <input 
              type="text" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: 'var(--chat-input-bg)', border: 'none', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }} 
            />
          </div>

          <button type="submit" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            Save Changes
          </button>
        </form>

      </div>
    </div>
  );
}