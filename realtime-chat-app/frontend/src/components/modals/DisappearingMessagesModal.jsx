import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';

const TIMER_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 168 },
  { label: '90 days', hours: 2160 },
  { label: 'Off', hours: 0 },
];

export default function DisappearingMessagesModal({
  isOpen,
  onClose,
  currentDurationHours = 0,
  onSaveDuration,
}) {
  const [selectedHours, setSelectedHours] = useState(currentDurationHours);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveDuration(selectedHours);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#111b21',
          borderRadius: '16px',
          border: '1px solid #222d34',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#202c33',
            borderBottom: '1px solid #2a3942',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Clock size={18} color="#00a884" />
            <span>Disappearing messages</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#8696a0', lineHeight: 1.5 }}>
            For more privacy and storage, new messages will disappear from this chat for everyone after the selected duration.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {TIMER_OPTIONS.map((opt) => {
              const isSelected = selectedHours === opt.hours;
              return (
                <div
                  key={opt.hours}
                  onClick={() => setSelectedHours(opt.hours)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'rgba(0,168,132,0.1)' : '#182229',
                    border: isSelected ? '1.5px solid #00a884' : '1px solid #222d34',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: isSelected ? '#00a884' : '#e9edef' }}>
                    {opt.label}
                  </span>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid #8696a0',
                      backgroundColor: isSelected ? '#00a884' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #222d34', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', color: '#8696a0', fontSize: '13px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '9px 22px',
              backgroundColor: '#00a884',
              color: '#ffffff',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
