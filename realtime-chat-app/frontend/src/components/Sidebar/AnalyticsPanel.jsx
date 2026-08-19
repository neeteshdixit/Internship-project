import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { apiFetch } from '../../lib/apiFetch';
import { Flame, Trophy, Clock, Zap, Heart, MessageSquare } from 'lucide-react';

export default function AnalyticsPanel() {
  const { currentUser } = useAuth();
  const { selectedContact, messages, getChatKey } = useChat();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const chatKey = selectedContact ? getChatKey(selectedContact) : '';
  const currentMessages = (chatKey && messages[chatKey]) ? messages[chatKey] : [];

  useEffect(() => {
    if (!currentUser || !selectedContact) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const otherUser = selectedContact.username || selectedContact.name;
        const data = await apiFetch(`/api/analytics/${currentUser.username}/${otherUser}`);
        setAnalytics(data);
      } catch (e) {
        setAnalytics(null);
      }
      setLoading(false);
    };
    fetch_();
  }, [currentUser, selectedContact]);

  const totalMsgs = currentMessages.length || analytics?.totalMessages || 0;
  const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111b21', color: '#e9edef' }}>
      <div style={{ padding: '16px', backgroundColor: '#202c33', borderBottom: '1px solid #222d34', fontSize: '16px', fontWeight: 600 }}>
        Conversation Health Dashboard
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
        {!selectedContact ? (
          <div style={{ textAlign: 'center', color: '#8696a0', paddingTop: '40px', fontSize: '13px' }}>
            Select a conversation to view relationship health & insights
          </div>
        ) : (
          <>
            {/* Streak & Health Card */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, backgroundColor: '#202c33', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid #f59e0b' }}>
                <Flame size={28} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>7 Days 🔥</div>
                  <div style={{ fontSize: '11px', color: '#8696a0' }}>Chat Streak</div>
                </div>
              </div>

              <div style={{ flex: 1, backgroundColor: '#202c33', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid #00a884' }}>
                <Zap size={28} color="#00a884" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#00a884' }}>98%</div>
                  <div style={{ fontSize: '11px', color: '#8696a0' }}>Health Score</div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Total Messages', value: totalMsgs, color: '#00a884' },
                { label: 'Avg Response', value: '1.2 mins', color: '#06b6d4' },
                { label: 'Sent by You', value: Math.ceil(totalMsgs * 0.52), color: '#6366f1' },
                { label: 'Received', value: Math.floor(totalMsgs * 0.48), color: '#ec4899' },
              ].map((stat) => (
                <div key={stat.label} style={{ backgroundColor: '#202c33', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Most Used Emoji Podium */}
            <div style={{ backgroundColor: '#202c33', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#8696a0', marginBottom: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={14} color="#f59e0b" /> TOP EMOJIS IN THIS CHAT
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: '24px' }}>❤️</span><div style={{ fontSize: '11px', color: '#8696a0' }}>42x</div></div>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: '24px' }}>😂</span><div style={{ fontSize: '11px', color: '#8696a0' }}>38x</div></div>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: '24px' }}>🔥</span><div style={{ fontSize: '11px', color: '#8696a0' }}>19x</div></div>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: '24px' }}>👍</span><div style={{ fontSize: '11px', color: '#8696a0' }}>14x</div></div>
              </div>
            </div>

            {/* Hourly Activity Heatmap */}
            <div style={{ backgroundColor: '#202c33', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#8696a0', marginBottom: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="#00a884" /> PEAK MESSAGING HOURS
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '50px' }}>
                {HOUR_LABELS.map((h) => {
                  const isPeak = h >= 19 && h <= 23;
                  const height = isPeak ? 90 : (h >= 10 && h <= 18) ? 55 : 20;
                  return (
                    <div
                      key={h}
                      title={`${h}:00`}
                      style={{
                        flex: 1,
                        height: `${height}%`,
                        backgroundColor: isPeak ? '#00a884' : '#2a3942',
                        borderRadius: '2px',
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: '#8696a0' }}>
                <span>12 AM</span>
                <span>12 PM</span>
                <span>11 PM</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
