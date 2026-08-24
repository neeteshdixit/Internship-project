import React, { useState } from 'react';
import { X, Lock, KeyRound, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useChat } from '../../context/ChatContext';

export default function ChatLockModal() {
  const { closeModal } = useUI();
  const { selectedContact } = useChat();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLocked, setIsLocked] = useState(localStorage.getItem(`lock_${selectedContact?.username}`) ? true : false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSetLock = () => {
    if (pin.length !== 4) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      alert('PINs do not match');
      return;
    }

    localStorage.setItem(`lock_${selectedContact.username}`, pin);
    setIsLocked(true);
    setSuccessMsg('Chat successfully locked with PIN!');
    setTimeout(() => {
      setSuccessMsg('');
      closeModal('chatLock');
    }, 1500);
  };

  const handleRemoveLock = () => {
    localStorage.removeItem(`lock_${selectedContact.username}`);
    setIsLocked(false);
    setSuccessMsg('Lock removed');
    setTimeout(() => {
      setSuccessMsg('');
      closeModal('chatLock');
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => closeModal('chatLock')}>
      <div style={{ width: 'min(380px, calc(100vw - 24px))', backgroundColor: '#202c33', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Lock size={18} color="#00a884" /> Private Chat Lock (PIN)
          </div>
          <button onClick={() => closeModal('chatLock')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#8696a0', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Lock conversation with <strong>@{selectedContact?.username || selectedContact?.name}</strong> behind a 4-digit PIN passcode.
          </p>

          {isLocked ? (
            <div>
              <div style={{ color: '#00a884', fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Check size={18} /> This chat is currently locked
              </div>
              <button
                onClick={handleRemoveLock}
                style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Remove PIN Lock
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="password"
                maxLength={4}
                placeholder="Confirm 4-digit PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none', boxSizing: 'border-box' }}
              />
              {successMsg && <div style={{ color: '#00a884', fontSize: '12px', fontWeight: 600 }}>{successMsg}</div>}
              <button
                onClick={handleSetLock}
                style={{ width: '100%', padding: '10px', backgroundColor: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}
              >
                Lock This Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
