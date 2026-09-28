import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';

export default function CreatePollModal({ isOpen, onClose, onCreatePoll }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (idx, val) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const pollData = {
      question: question.trim(),
      options: cleanOptions.map((opt, i) => ({
        id: i + 1,
        text: opt,
        voters: [],
      })),
      allowMultiple,
    };

    onCreatePoll(pollData);
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
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
          maxWidth: '460px',
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
            <BarChart2 size={18} color="#00a884" />
            <span>Create Poll</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#8696a0', marginBottom: '6px' }}>
              Question
            </label>
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#202c33',
                border: '1px solid #2a3942',
                borderRadius: '8px',
                color: '#e9edef',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#8696a0', marginBottom: '6px' }}>
              Options
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    maxLength={100}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: '#202c33',
                      border: '1px solid #2a3942',
                      borderRadius: '8px',
                      color: '#e9edef',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#00a884',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 0',
                }}
              >
                <Plus size={16} /> Add option
              </button>
            )}
          </div>

          {/* Allow Multiple Answers Toggle */}
          <div
            onClick={() => setAllowMultiple(!allowMultiple)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: '#182229',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #2a3942',
            }}
          >
            <span style={{ fontSize: '13px', color: '#e9edef' }}>Allow multiple answers</span>
            <div
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '12px',
                backgroundColor: allowMultiple ? '#00a884' : '#2a3942',
                position: 'relative',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: allowMultiple ? '20px' : '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 18px', backgroundColor: 'transparent', border: 'none', color: '#8696a0', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 24px',
                backgroundColor: '#00a884',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
