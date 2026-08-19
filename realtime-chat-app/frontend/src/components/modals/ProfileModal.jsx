import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Mail, FileText, Image, Camera, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { apiFetch } from '../../lib/apiFetch';

export default function ProfileModal() {
  const { closeModal } = useUI();
  const { currentUser } = useAuth();
  const { uploadFile } = useChat();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [profilePicUrl, setProfilePicUrl] = useState(currentUser?.profilePicUrl || currentUser?.profilePictureUrl || '');
  const [bio, setBio] = useState('Hey there! I am using Setu Connect.');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchUser = async () => {
      try {
        const data = await apiFetch('/api/users/me');
        if (data) {
          setUsername(data.username || '');
          setEmail(data.email || '');
          setPhoneNumber(data.phoneNumber || '');
          setProfilePicUrl(data.profilePicUrl || data.profilePictureUrl || '');
          if (data.about) setBio(data.about);
        }
      } catch (e) {}
    };
    fetchUser();
  }, [currentUser]);

  // Handle direct file upload for profile picture
  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await uploadFile(file);
      if (res && res.mediaUrl) {
        setProfilePicUrl(res.mediaUrl);
      }
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Update core profile
      await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          username,
          email,
          phoneNumber,
          profilePicUrl,
        }),
      });

      // 2. Update bio/about
      if (bio) {
        await apiFetch('/api/users/about', {
          method: 'PUT',
          body: JSON.stringify({ about: bio }),
        });
      }

      // 3. Update localStorage cache
      const cached = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...cached,
        username,
        email,
        phoneNumber,
        profilePicUrl,
        about: bio,
      }));

      setSavedMsg('Profile updated successfully!');
      setTimeout(() => {
        setSavedMsg('');
        closeModal('profile');
      }, 1000);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const s = {
    field: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '12px', fontWeight: 600, color: '#8696a0', display: 'flex', alignItems: 'center', gap: '6px' },
    input: { width: '100%', padding: '9px 12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => closeModal('profile')}>
      <div style={{ backgroundColor: '#202c33', width: '420px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <h3 style={{ color: '#e9edef', fontSize: '16px', fontWeight: 600, margin: 0 }}>Edit Profile</h3>
          <button onClick={() => closeModal('profile')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Avatar Upload Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => photoInputRef.current?.click()}>
              <img
                src={profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'U')}&background=00a884&color=fff&size=84`}
                alt="Profile"
                style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00a884' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#00a884',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #202c33',
                  color: '#fff',
                }}
              >
                <Camera size={14} />
              </div>
            </div>

            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <span
              onClick={() => photoInputRef.current?.click()}
              style={{ fontSize: '12px', color: '#00a884', marginTop: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              {isUploadingPhoto ? 'Uploading photo...' : 'Change Profile Photo'}
            </span>
          </div>

          <div style={s.field}>
            <label style={s.label}><User size={14} /> Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={s.input} />
          </div>

          <div style={s.field}>
            <label style={s.label}><Mail size={14} /> Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} />
          </div>

          <div style={s.field}>
            <label style={s.label}><Phone size={14} /> Phone Number</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={s.input} />
          </div>

          <div style={s.field}>
            <label style={s.label}><FileText size={14} /> About / Bio</label>
            <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} style={s.input} />
          </div>

          {savedMsg && <div style={{ color: '#00a884', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>✓ {savedMsg}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={() => closeModal('profile')} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #2a3942', borderRadius: '8px', color: '#8696a0', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={isLoading || isUploadingPhoto} style={{ flex: 1, padding: '10px', backgroundColor: '#00a884', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
