import React, { useEffect, useState } from 'react';
import { Mic, Sparkles, Radio } from 'lucide-react';

export default function FloatingVoiceOrb({ onTriggerVoice }) {
  const [isHovered, setIsHovered] = useState(false);

  // Global hotkey: Alt + V or Ctrl + Space
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check Alt+V or Ctrl+Space
      if ((e.altKey && e.key.toLowerCase() === 'v') || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        onTriggerVoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerVoice]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      {/* Tooltip on hover */}
      {isHovered && (
        <div
          style={{
            background: 'rgba(9, 13, 22, 0.95)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '12px',
            padding: '8px 14px',
            color: '#f8fafc',
            fontSize: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Sparkles size={14} color="#22d3ee" />
          <span><strong>Aurora AI</strong> — Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', fontSize: '10px' }}>Alt+V</kbd></span>
        </div>
      )}

      {/* Floating Orb Button */}
      <button
        type="button"
        onClick={onTriggerVoice}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Activate Voice AI Assistant"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #10b981 100%)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isHovered
            ? '0 0 35px rgba(6, 182, 212, 0.8), 0 0 15px rgba(16, 185, 129, 0.5)'
            : '0 0 20px rgba(6, 182, 212, 0.5)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative'
        }}
      >
        {/* Pulsing ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: '2px solid rgba(6, 182, 212, 0.4)',
            animation: 'pulse 2.5s infinite',
            pointerEvents: 'none'
          }}
        />

        <Mic size={24} color="#fff" />
      </button>
    </div>
  );
}
