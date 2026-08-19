import React from 'react';

export default function Button({ children, onClick, type = 'button', variant = 'primary', style = {}, ...props }) {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        backgroundColor: isPrimary ? 'var(--primary)' : 'var(--hover-bg)',
        color: isPrimary ? '#fff' : 'var(--text-main)',
        border: isPrimary ? 'none' : '1px solid var(--border-color)',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'opacity 0.2s',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}