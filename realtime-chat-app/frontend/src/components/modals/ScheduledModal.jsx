import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, Calendar } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { apiFetch } from '../../lib/apiFetch';

export default function ScheduledModal() {
  const { closeModal } = useUI();
  const [scheduledList, setScheduledList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const data = await apiFetch('/api/scheduled-messages');
        setScheduledList(data || []);
      } catch (e) {
        setScheduledList([]);
      }
      setLoading(false);
    };
    fetchScheduled();
  }, []);

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/scheduled-messages/${id}`, { method: 'DELETE' });
      setScheduledList((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {}
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => closeModal('scheduled')}>
      <div style={{ backgroundColor: '#202c33', width: '420px', maxHeight: '520px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', backgroundColor: '#182229', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontSize: '16px', fontWeight: 600 }}>
            <Clock size={18} color="#00a884" /> Scheduled Messages
          </div>
          <button onClick={() => closeModal('scheduled')} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#8696a0', padding: '30px' }}>Loading...</div>
          ) : scheduledList.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 20px', fontSize: '13px' }}>
              <Calendar size={32} color="#2a3942" style={{ marginBottom: '8px' }} />
              <div>No messages scheduled.</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Click the attachment icon in any chat and pick "Schedule" to set future messages.</div>
            </div>
          ) : (
            scheduledList.map((msg) => (
              <div key={msg.id} style={{ backgroundColor: '#2a3942', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#00a884', marginBottom: '2px' }}>
                    To: @{msg.receiverUsername || 'Group'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#e9edef', marginBottom: '4px' }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8696a0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> Send at: {new Date(msg.scheduledFor || msg.scheduleAt).toLocaleString()}
                  </div>
                </div>
                <button onClick={() => handleDelete(msg.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
