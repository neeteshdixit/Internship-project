import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, ShieldCheck, KeyRound, RotateCcw, AlertCircle } from 'lucide-react';

export default function ChatLockModal({ isOpen, onClose, onUnlocked, title = 'Unlock Locked Chats' }) {
  const [mode, setMode] = useState('unlock'); // 'unlock' | 'set_pin' | 'confirm_pin'
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getSavedPin = () => localStorage.getItem('setu_chat_lock_pin');

  // Initialize mode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const existing = getSavedPin();
      setPin('');
      setFirstPin('');
      setError('');
      setSuccess(false);
      if (!existing) {
        setMode('set_pin');
      } else {
        setMode('unlock');
      }
    }
  }, [isOpen]);

  // Physical keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');

      if (next.length === 4) {
        if (mode === 'unlock') {
          const saved = getSavedPin();
          // Fallback to 1234 only if nothing saved, but since getSavedPin is checked on mount, saved should match
          if (next === saved || (!saved && next === '1234')) {
            setSuccess(true);
            setTimeout(() => {
              onUnlocked();
              setPin('');
              onClose();
            }, 250);
          } else {
            setTimeout(() => {
              setError('Incorrect PIN. Please try again.');
              setPin('');
            }, 200);
          }
        } else if (mode === 'set_pin') {
          // Move to confirm PIN
          setTimeout(() => {
            setFirstPin(next);
            setPin('');
            setMode('confirm_pin');
          }, 150);
        } else if (mode === 'confirm_pin') {
          if (next === firstPin) {
            localStorage.setItem('setu_chat_lock_pin', next);
            setSuccess(true);
            setTimeout(() => {
              onUnlocked();
              setPin('');
              onClose();
            }, 300);
          } else {
            setTimeout(() => {
              setError("PINs did not match. Please set PIN again.");
              setPin('');
              setFirstPin('');
              setMode('set_pin');
            }, 250);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleResetPin = () => {
    setPin('');
    setFirstPin('');
    setError('');
    setMode('set_pin');
  };

  const modalTitle = () => {
    if (success) return 'Access Granted';
    if (mode === 'set_pin') return 'Set 4-Digit Chat PIN';
    if (mode === 'confirm_pin') return 'Confirm Your PIN';
    return title;
  };

  const modalSubtitle = () => {
    if (success) return 'Chat unlocked successfully!';
    if (mode === 'set_pin') return 'Create a 4-digit PIN to protect your locked chats';
    if (mode === 'confirm_pin') return 'Re-enter your 4-digit PIN to confirm';
    return 'Enter your set 4-digit PIN to access locked conversations';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#111b21',
          borderRadius: '20px',
          border: '1px solid #2a3942',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#8696a0',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Dynamic Icon */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: success ? 'rgba(0,168,132,0.25)' : 'rgba(0,168,132,0.15)',
            border: `2px solid ${success ? '#00a884' : '#00a884'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a884',
            marginBottom: '16px',
            transition: 'all 0.2s ease',
          }}
        >
          {success ? (
            <Unlock size={30} style={{ transform: 'scale(1.1)' }} />
          ) : mode === 'set_pin' || mode === 'confirm_pin' ? (
            <KeyRound size={28} />
          ) : (
            <Lock size={28} />
          )}
        </div>

        <h3 style={{ margin: '0 0 6px 0', color: '#e9edef', fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
          {modalTitle()}
        </h3>
        <p style={{ margin: '0 0 20px 0', color: '#8696a0', fontSize: '13px', textAlign: 'center', minHeight: '36px' }}>
          {modalSubtitle()}
        </p>

        {/* PIN Dots Display */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: isFilled ? '#00a884' : '#202c33',
                  border: isFilled ? '2px solid #00a884' : '2px solid #3b4a54',
                  boxShadow: isFilled ? '0 0 8px rgba(0, 168, 132, 0.6)' : 'none',
                  transition: 'all 0.15s ease',
                  transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginBottom: '14px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', maxWidth: '240px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              style={{
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#202c33',
                border: '1px solid #2a3942',
                color: '#e9edef',
                fontSize: '20px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s, transform 0.1s',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a3942')}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#202c33';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#202c33',
              border: '1px solid #2a3942',
              color: '#e9edef',
              fontSize: '20px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s, transform 0.1s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a3942')}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#202c33';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#202c33',
              border: 'none',
              color: '#8696a0',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e9edef')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8696a0')}
            title="Backspace"
          >
            ⌫
          </button>
        </div>

        {/* Change/Reset PIN footer action */}
        {mode === 'unlock' && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px' }}>
            <button
              type="button"
              onClick={handleResetPin}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00a884',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              <RotateCcw size={12} />
              <span>Change / Reset PIN</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
