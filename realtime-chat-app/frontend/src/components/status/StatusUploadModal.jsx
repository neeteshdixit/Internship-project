import React, { useState, useRef } from 'react';
import { X, Image, Link, Type, Send, Upload, Palette, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { apiFetch } from '../../lib/apiFetch';

const TEXT_BG_COLORS = [
  '#00a884', // WhatsApp Green
  '#54656f', // Slate
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Crimson
  '#2563eb', // Royal Blue
  '#059669', // Emerald
  '#ec4899', // Pink
  '#111b21', // Dark
];

export default function StatusUploadModal({ isOpen, onClose, onStatusPosted, initialTab = 'upload' }) {
  const { uploadFile } = useChat();
  const [activeTab, setActiveTab] = useState(initialTab); // 'upload' | 'link' | 'text'

  // Direct file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideoFile, setIsVideoFile] = useState(false);

  // Link state
  const [linkUrl, setLinkUrl] = useState('');

  // Shared Caption / Text state
  const [caption, setCaption] = useState('');

  // Text status state
  const [textContent, setTextContent] = useState('');
  const [selectedBgColor, setSelectedBgColor] = useState(TEXT_BG_COLORS[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const isVid = file.type.startsWith('video/');
    setIsVideoFile(isVid);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setIsVideoFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === 'upload') {
        if (!selectedFile) {
          alert('Please select a photo or video to upload');
          setIsSubmitting(false);
          return;
        }
        // Direct upload to server
        const uploadRes = await uploadFile(selectedFile);
        const finalUrl = uploadRes.mediaUrl;
        const type = isVideoFile ? 'video' : 'image';

        await apiFetch('/api/statuses', {
          method: 'POST',
          body: JSON.stringify({
            type,
            mediaUrl: finalUrl,
            caption: caption.trim() || null,
          }),
        });
      } else if (activeTab === 'link') {
        if (!linkUrl.trim()) {
          alert('Please enter a valid media link');
          setIsSubmitting(false);
          return;
        }
        const isVid = linkUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i);
        const type = isVid ? 'video' : 'image';

        await apiFetch('/api/statuses', {
          method: 'POST',
          body: JSON.stringify({
            type,
            mediaUrl: linkUrl.trim(),
            caption: caption.trim() || null,
          }),
        });
      } else if (activeTab === 'text') {
        if (!textContent.trim()) {
          alert('Please write something for your status');
          setIsSubmitting(false);
          return;
        }

        await apiFetch('/api/statuses', {
          method: 'POST',
          body: JSON.stringify({
            type: 'text',
            caption: textContent.trim(),
            textBackground: selectedBgColor,
          }),
        });
      }

      // Reset state and notify parent
      handleClearFile();
      setLinkUrl('');
      setCaption('');
      setTextContent('');
      if (onStatusPosted) onStatusPosted();
      onClose();
    } catch (err) {
      console.error('Failed to post status:', err);
      alert('Failed to post status: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
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
          maxWidth: '540px',
          backgroundColor: '#111b21',
          borderRadius: '16px',
          border: '1px solid #222d34',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Mode Switcher */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#202c33',
            borderBottom: '1px solid #2a3942',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'upload' ? '#00a884' : '#2a3942',
                color: activeTab === 'upload' ? '#fff' : '#8696a0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Image size={15} /> Direct Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'link' ? '#00a884' : '#2a3942',
                color: activeTab === 'link' ? '#fff' : '#8696a0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Link size={15} /> Media Link
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'text' ? '#00a884' : '#2a3942',
                color: activeTab === 'text' ? '#fff' : '#8696a0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Type size={15} /> Text
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696a0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab 1: Direct File Upload */}
        {activeTab === 'upload' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {previewUrl ? (
                <div style={{ position: 'relative', width: '100%', maxHeight: '320px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isVideoFile ? (
                    <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '320px' }} />
                  ) : (
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }} />
                  )}
                  <button
                    type="button"
                    onClick={handleClearFile}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      color: '#fff',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    height: '220px',
                    border: '2px dashed #2a3942',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    backgroundColor: '#182229',
                    transition: 'border 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00a884')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a3942')}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,168,132,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00a884',
                    }}
                  >
                    <Upload size={28} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: 600 }}>
                      Click to choose Photo or Video
                    </div>
                    <div style={{ color: '#8696a0', fontSize: '12px', marginTop: '4px' }}>
                      Supports JPG, PNG, GIF, MP4, WebM
                    </div>
                  </div>
                </div>
              )}

              {/* Caption Input */}
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#202c33',
                  border: '1px solid #2a3942',
                  borderRadius: '10px',
                  color: '#e9edef',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Bottom Bar */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #222d34', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#8696a0',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  backgroundColor: selectedFile && !isSubmitting ? '#00a884' : '#2a3942',
                  color: selectedFile && !isSubmitting ? '#ffffff' : '#8696a0',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: selectedFile && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={15} />
                {isSubmitting ? 'Posting...' : 'Post Status'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Link / URL Option */}
        {activeTab === 'link' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8696a0', marginBottom: '6px' }}>
                  Media URL (Image or Video Link)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#202c33',
                    border: '1px solid #2a3942',
                    borderRadius: '10px',
                    color: '#e9edef',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>

              {linkUrl && (
                <div style={{ width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={linkUrl}
                    alt="Preview"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8696a0', marginBottom: '6px' }}>
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={200}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#202c33',
                    border: '1px solid #2a3942',
                    borderRadius: '10px',
                    color: '#e9edef',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #222d34', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 18px', backgroundColor: 'transparent', border: 'none', color: '#8696a0', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!linkUrl.trim() || isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  backgroundColor: linkUrl.trim() && !isSubmitting ? '#00a884' : '#2a3942',
                  color: linkUrl.trim() && !isSubmitting ? '#ffffff' : '#8696a0',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: linkUrl.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={15} />
                {isSubmitting ? 'Posting...' : 'Post Status'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Text Status */}
        {activeTab === 'text' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                height: '260px',
                backgroundColor: selectedBgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                boxSizing: 'border-box',
                position: 'relative',
                transition: 'background-color 0.3s ease',
              }}
            >
              <textarea
                placeholder="Type a status..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={300}
                autoFocus
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 600,
                  textAlign: 'center',
                  resize: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
            </div>

            {/* Color Palette Selector */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #222d34', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Palette size={18} color="#8696a0" />
                {TEXT_BG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedBgColor(c)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: selectedBgColor === c ? '2.5px solid #ffffff' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', color: '#8696a0', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!textContent.trim() || isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 22px',
                    backgroundColor: textContent.trim() && !isSubmitting ? '#00a884' : '#2a3942',
                    color: textContent.trim() && !isSubmitting ? '#ffffff' : '#8696a0',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: textContent.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Send size={15} />
                  {isSubmitting ? 'Posting...' : 'Post Status'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
