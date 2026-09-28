import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, ShieldAlert, X, Eye, EyeOff } from 'lucide-react';

export default function ViewOnceModal({
  isOpen,
  mediaUrl,
  mediaType = 'IMAGE',
  currentUser,
  senderUsername,
  onClose,
}) {
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [countdown, setCountdown] = useState(30); // 30-second view limit
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  const isVideo = (mediaType || '').toUpperCase() === 'VIDEO';

  // Render photo onto Canvas with DRM watermark
  const drawImageOnCanvas = useCallback(() => {
    if (isVideo || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    // Resize canvas to fit screen while maintaining aspect ratio
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.8;
    let width = img.naturalWidth || 800;
    let height = img.naturalHeight || 600;

    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    canvas.width = width;
    canvas.height = height;

    // Clear and draw image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Stamped Security Watermark overlay across canvas
    ctx.save();
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = `SETU PROTECTED • @${currentUser?.username || 'user'} • VIEW ONCE`;
    const stepX = 260;
    const stepY = 140;

    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.save();
        ctx.translate(x + (y % 2 ? 60 : 0), y);
        ctx.rotate((-28 * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }, [currentUser, isVideo]);

  // Load Image into memory
  useEffect(() => {
    if (!isOpen || isVideo || !mediaUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mediaUrl;
    img.onload = () => {
      imgRef.current = img;
      drawImageOnCanvas();
    };
    img.onerror = () => {
      // Fallback without crossOrigin if CORS prevents canvas export
      const fallbackImg = new Image();
      fallbackImg.src = mediaUrl;
      fallbackImg.onload = () => {
        imgRef.current = fallbackImg;
        drawImageOnCanvas();
      };
    };
  }, [isOpen, mediaUrl, isVideo, drawImageOnCanvas]);

  // Restrict screen handler (Synchronous zero-latency blackout)
  const restrictScreen = useCallback((reason) => {
    setIsRestricted(true);
    setRestrictionReason(reason);

    // Instant wipe of canvas pixels so screenshot capture buffers get 0 pixels
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  // Resume viewing (after refocus)
  const resumeViewing = () => {
    if (document.hasFocus()) {
      setIsRestricted(false);
      setRestrictionReason('');
      setTimeout(() => {
        drawImageOnCanvas();
      }, 50);
    }
  };

  // Anti-Screenshot and Blur Listeners
  useEffect(() => {
    if (!isOpen) return;

    // 1. Keyboard Interception (PrintScreen, Snipping tool, Win+Shift+S, DevTools)
    const handleKeyDown = (e) => {
      if (
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'I' || e.key === 'i')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) ||
        (e.altKey && (e.key === 'PrintScreen' || e.code === 'PrintScreen'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        restrictScreen("Can't take screenshot due to security policy");
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        restrictScreen("Can't take screenshot due to security policy");
      }
    };

    // 2. Window Blur (Crucial for Windows Snipping Tool & Alt-Tab)
    // When Snipping Tool or screenshot overlay opens, Windows shifts focus away from browser
    const handleBlur = () => {
      restrictScreen("Screenshot / screen capture restricted");
    };

    // 3. Visibility Change (Tab switch or minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        restrictScreen("Viewing restricted while window is inactive");
      }
    };

    // 4. Disable context menu, drag, copy
    const preventAction = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    window.addEventListener('contextmenu', preventAction, true);
    window.addEventListener('copy', preventAction, true);
    window.addEventListener('dragstart', preventAction, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      window.removeEventListener('contextmenu', preventAction, true);
      window.removeEventListener('copy', preventAction, true);
      window.removeEventListener('dragstart', preventAction, true);
    };
  }, [isOpen, restrictScreen, onClose]);

  // Countdown timer (Vanish after 30 seconds)
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(30);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#00a884',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 800,
            }}
          >
            ①
          </div>
          <div>
            <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={15} color="#00a884" />
              View Once Protected Photo
            </div>
            <div style={{ color: '#8696a0', fontSize: '12px' }}>
              From ~{senderUsername || 'Contact'} • Closes in {countdown}s
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '8px 18px',
            backgroundColor: '#00a884',
            color: '#ffffff',
            border: 'none',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,168,132,0.4)',
          }}
        >
          <X size={16} />
          Done (Vanish)
        </button>
      </div>

      {/* Media Canvas / Player Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              display: isRestricted ? 'none' : 'block',
            }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '92vw',
              maxHeight: '82vh',
              objectFit: 'contain',
              borderRadius: '6px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              display: isRestricted ? 'none' : 'block',
            }}
          />
        )}
      </div>

      {/* Bottom Security Info Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(24, 34, 41, 0.85)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid #2a3942',
          color: '#8696a0',
          fontSize: '12px',
        }}
      >
        <Lock size={13} color="#00a884" />
        <span>Screenshot strictly blocked • Photo automatically vanishes after closing</span>
      </div>

      {/* Complete Blackout Screen Overlay (Like WhatsApp Restricted Screen) */}
      {isRestricted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000000',
            zIndex: 1000000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <ShieldAlert size={46} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 10px 0' }}>
            Screenshot Restricted
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: '#8696a0',
              maxWidth: '380px',
              lineHeight: 1.5,
              margin: '0 0 28px 0',
            }}
          >
            {restrictionReason || "Can't take screenshot due to security policy."}
            <br />
            This View Once photo cannot be captured, recorded, or shared.
          </p>

          <div style={{ display: 'flex', gap: '14px' }}>
            <button
              onClick={resumeViewing}
              style={{
                padding: '10px 22px',
                backgroundColor: '#00a884',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Eye size={16} /> Resume Viewing
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 22px',
                backgroundColor: '#2a3942',
                color: '#e9edef',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close Media
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
