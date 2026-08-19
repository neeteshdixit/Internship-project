// src/components/sidebar/SidebarSearch.jsx
import React from 'react';
import { Search } from 'lucide-react';

export default function SidebarSearch({ searchQuery, setSearchQuery }) {
  return (
    <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-darker)' }}>
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--chat-input-bg)', borderRadius: '8px', padding: '8px 12px', gap: '10px' }}>
        <Search size={16} color="var(--placeholder)" />
        <input 
          type="text" 
          placeholder="Search or start new chat" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-main)', fontSize: '14px' }}
        />
      </div>
    </div>
  );
}