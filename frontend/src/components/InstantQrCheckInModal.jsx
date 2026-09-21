import { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  UploadCloud, 
  Keyboard, 
  ListOrdered, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Copy, 
  Loader2, 
  RotateCw, 
  Sparkles,
  Clock
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import api from '../api/api';

/**
 * High-precision synthesized scanner beep using Web Audio API
 */
const playScannerBeep = (isSuccess = true) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = isSuccess ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isSuccess ? 880 : 220, ctx.currentTime);
    if (isSuccess) {
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
    }
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isSuccess ? 0.15 : 0.25));
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + (isSuccess ? 0.16 : 0.26));
  } catch {
    // AudioContext blocked or unsupported, silently skip
  }
};

export default function InstantQrCheckInModal({
  isOpen,
  onClose,
  onSuccess,
  queueBookings = [],
  stationName = 'Current Hub'
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual' | 'queue'
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedBooking, setVerifiedBooking] = useState(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-camera-viewport';

  // File upload drag state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  // Initialize and clean up camera scanner
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setVerifiedBooking(null);
      setManualCode('');
      setCameraError(null);
      return;
    }

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Small timeout to allow DOM container to mount
      await new Promise(r => setTimeout(r, 120));

      const element = document.getElementById(scannerContainerId);
      if (!element) return;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No optical video capture device detected on this system.');
      }

      setCameraDevices(devices);
      const cameraId = selectedCameraId || devices[0].id;
      setSelectedCameraId(cameraId);

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame scanner misses are ignored
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.warn('Camera scanner startup notice:', err);
      setCameraActive(false);
      setCameraError(
        err.message?.includes('Permission') 
          ? 'Camera permission denied in browser settings.' 
          : (err.message || 'Camera device unavailable.')
      );
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop notice:', err);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  // Main verification processor
  const verifyBookingCode = async (codeToVerify) => {
    const trimmed = (codeToVerify || '').trim();
    if (!trimmed) {
      toast.error('Please enter or scan a valid booking ID / token');
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await api.post('/bookings/checkin-qr', { code: trimmed });
      playScannerBeep(true);
      if (navigator.vibrate) navigator.vibrate([40, 50, 60]);
      
      toast.success(data.message || 'QR Verified! Dispenser armed.');
      setVerifiedBooking(data.booking || { _id: trimmed });
      
      if (onSuccess) {
        onSuccess(data.booking);
      }
    } catch (err) {
      playScannerBeep(false);
      toast.error(err.response?.data?.message || 'Verification failed: invalid or expired booking');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDetectedCode = (decodedText) => {
    if (!decodedText || isVerifying || verifiedBooking) return;
    
    // Extract ID if a URL was embedded
    let parsedCode = decodedText;
    if (decodedText.includes('/')) {
      const parts = decodedText.split('/');
      parsedCode = parts[parts.length - 1];
    }
    
    stopCamera();
    verifyBookingCode(parsedCode);
  };

  // Scan from file (image drop / upload)
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setIsVerifying(true);

    try {
      const tempScanner = new Html5Qrcode('qr-file-temp-container');
      const decodedResult = await tempScanner.scanFile(file, false);
      tempScanner.clear();
      
      handleDetectedCode(decodedResult);
    } catch (err) {
      toast.error('No readable QR code found in this image file.');
      setIsVerifying(false);
    }
  };

  // Clipboard paste helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setManualCode(text.trim());
        toast.success('Pasted from clipboard');
      }
    } catch {
      toast.error('Clipboard access not permitted');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Hidden container for file scan processing */}
      <div id="qr-file-temp-container" style={{ display: 'none' }}></div>

      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(180deg, #0c121e 0%, #080d16 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(6, 182, 212, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Top Decorative Neon Accent Bar */}
        <div 
          style={{
            height: '3px',
            width: '100%',
            background: 'linear-gradient(90deg, #0284c7 0%, #14b8a6 50%, #38bdf8 100%)'
          }}
        />

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(20, 184, 166, 0.12)',
                  border: '1px solid rgba(20, 184, 166, 0.35)',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  color: '#2dd4bf',
                  textTransform: 'uppercase'
                }}
              >
                <span 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#2dd4bf',
                    boxShadow: '0 0 8px #2dd4bf'
                  }}
                />
                700-Bar Dispenser Arming Protocol
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Instant QR Check-In
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                {stationName} • Optical scanner & digital pass verifier
              </p>
            </div>
          </div>
        </div>

        {/* If Verified: High-Tech Confirmation State */}
        {verifiedBooking ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div 
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#10b981'
              }}
            >
              <CheckCircle2 size={38} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>
              Dispenser Armed & Ready
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 24px' }}>
              Booking reference verified. 700-bar pneumatic interlocks engaged for driver check-in.
            </p>

            {/* Booking Details Card */}
            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Customer</span>
                <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '600' }}>
                  {verifiedBooking.user?.name || verifiedBooking.customerName || 'Mobile Pass Holder'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Dispenser</span>
                <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: '700' }}>
                  {verifiedBooking.dispenser?.dispenserNumber ? `Pump #${verifiedBooking.dispenser.dispenserNumber}` : 'Auto-Assigned Bay'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Pressure & Fuel</span>
                <span style={{ fontSize: '0.9rem', color: '#2dd4bf', fontWeight: '600' }}>
                  {verifiedBooking.quantity || '5.0'} kg H₂ • 700 Bar
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Booking Token</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {(verifiedBooking._id || '').slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setVerifiedBooking(null);
                  setActiveTab('camera');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Scan Another Pass
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
                }}
              >
                Complete & Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switcher Tabs */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                padding: '12px 24px',
                background: 'rgba(10, 15, 24, 0.6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'camera' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === 'camera' ? '#38bdf8' : '#94a3b8',
                  outline: activeTab === 'camera' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <Camera size={15} />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'upload' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === 'upload' ? '#38bdf8' : '#94a3b8',
                  outline: activeTab === 'upload' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <UploadCloud size={15} />
                <span>Image</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'manual' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === 'manual' ? '#38bdf8' : '#94a3b8',
                  outline: activeTab === 'manual' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <Keyboard size={15} />
                <span>Manual ID</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'queue' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === 'queue' ? '#38bdf8' : '#94a3b8',
                  outline: activeTab === 'queue' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <ListOrdered size={15} />
                <span>Queue ({queueBookings.length})</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div style={{ padding: '24px' }}>
              {/* TAB 1: OPTICAL CAMERA SCANNER */}
              {activeTab === 'camera' && (
                <div>
                  <div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '270px',
                      background: '#04070d',
                      borderRadius: '16px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    {/* Live HTML5 Video Container */}
                    <div 
                      id={scannerContainerId} 
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        inset: 0,
                        objectFit: 'cover'
                      }}
                    />

                    {/* Laser Scanner Line Overlay */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: '12%',
                        right: '12%',
                        height: '2px',
                        background: 'linear-gradient(90deg, rgba(56, 189, 248, 0) 0%, #38bdf8 50%, rgba(56, 189, 248, 0) 100%)',
                        boxShadow: '0 0 10px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.8)',
                        animation: 'scanSweep 2.2s ease-in-out infinite alternate',
                        pointerEvents: 'none',
                        zIndex: 4
                      }}
                    />

                    {/* HUD Target Brackets Frame */}
                    <div 
                      style={{
                        position: 'absolute',
                        width: '200px',
                        height: '200px',
                        pointerEvents: 'none',
                        zIndex: 3
                      }}
                    >
                      {/* Top-Left Corner */}
                      <span style={{ position: 'absolute', top: 0, left: 0, width: '22px', height: '22px', borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                      {/* Top-Right Corner */}
                      <span style={{ position: 'absolute', top: 0, right: 0, width: '22px', height: '22px', borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                      {/* Bottom-Left Corner */}
                      <span style={{ position: 'absolute', bottom: 0, left: 0, width: '22px', height: '22px', borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                      {/* Bottom-Right Corner */}
                      <span style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                    </div>

                    {/* Status Badge Over Camera Viewport */}
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        padding: '4px 14px',
                        borderRadius: '100px',
                        background: 'rgba(3, 7, 18, 0.8)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        backdropFilter: 'blur(8px)',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        zIndex: 5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cameraActive ? '#22c55e' : '#eab308' }} />
                      {cameraActive ? 'Optical sensor live • Center QR code in reticle' : 'Activating camera viewport...'}
                    </div>

                    {/* Camera fallback / permission error prompt */}
                    {cameraError && (
                      <div 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(10, 15, 26, 0.95)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px',
                          textAlign: 'center',
                          zIndex: 10
                        }}
                      >
                        <AlertCircle size={32} color="#f59e0b" style={{ marginBottom: '10px' }} />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                          Camera Optical Input Inactive
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', maxWidth: '340px', marginBottom: '14px' }}>
                          {cameraError} You can scan from an image file, use manual input, or trigger demo simulation below.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              color: '#38bdf8',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <RotateCw size={14} />
                            Retry Camera
                          </button>

                          {queueBookings.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                verifyBookingCode(queueBookings[0]._id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Zap size={14} />
                              Simulate Pass Detection ({queueBookings[0].user?.name?.split(' ')[0] || 'Driver'})
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Device selector footer if multiple webcams available */}
                  {cameraDevices.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Camera Source:</span>
                      <select
                        value={selectedCameraId || ''}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          stopCamera().then(() => startCamera());
                        }}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#f8fafc',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          outline: 'none'
                        }}
                      >
                        {cameraDevices.map((dev, idx) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.label || `Sensor Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QR IMAGE / VOUCHER UPLOAD */}
              {activeTab === 'upload' && (
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    style={{
                      border: isDragging ? '2px dashed #38bdf8' : '2px dashed rgba(56, 189, 248, 0.35)',
                      borderRadius: '16px',
                      padding: '36px 20px',
                      textAlign: 'center',
                      backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      document.getElementById('qr-file-picker-input')?.click();
                    }}
                  >
                    <input
                      id="qr-file-picker-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <div 
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        color: '#38bdf8'
                      }}
                    >
                      <UploadCloud size={28} />
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                      Drag & Drop QR Voucher Image
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', maxWidth: '320px', margin: '0 auto 14px' }}>
                      Upload customer digital fuel voucher, ticket screenshot, or booking QR photo.
                    </p>

                    <button
                      type="button"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Browse Image File
                    </button>

                    {uploadedFileName && (
                      <p style={{ color: '#2dd4bf', fontSize: '0.75rem', marginTop: '10px' }}>
                        Selected: {uploadedFileName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MANUAL BOOKING ID / PASTE */}
              {activeTab === 'manual' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyBookingCode(manualCode);
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label 
                        htmlFor="manual-booking-input"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#cbd5e1',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Booking Reference / QR Token
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          padding: '2px 6px'
                        }}
                      >
                        <Copy size={12} />
                        Paste Clipboard
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        id="manual-booking-input"
                        type="text"
                        placeholder="e.g. 65f2a1b9c4d3e8f7a6b5c4d3"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '10px',
                          color: '#f8fafc',
                          fontSize: '0.9375rem',
                          fontFamily: 'monospace',
                          letterSpacing: '0.02em',
                          outline: 'none',
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                        }}
                      />
                    </div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                      Enter the 24-character hexadecimal reference provided on the driver's booking pass.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || !manualCode.trim()}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.925rem',
                      cursor: isVerifying || !manualCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: isVerifying || !manualCode.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Verifying Reference...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Verify & Arm Dispenser
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 4: STATION ARRIVALS QUEUE (1-CLICK QUICK ARM) */}
              {activeTab === 'queue' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                      ACTIVE RESERVATIONS FOR DISPENSER ARMING
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                      {queueBookings.length} Arrival{queueBookings.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {queueBookings.length === 0 ? (
                    <div 
                      style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Clock size={28} color="#94a3b8" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                      <p style={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                        No Pending Arrivals in Queue
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '4px 0 0' }}>
                        All currently scheduled vehicles have been processed or are in session.
                      </p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {queueBookings.map((b) => (
                        <div
                          key={b._id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.875rem' }}>
                                {b.user?.name || b.customerName || 'Driver Arrival'}
                              </span>
                              <span 
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: b.status === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                  color: b.status === 'confirmed' ? '#34d399' : '#facc15',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {b.status}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <span>{b.quantity || '5.0'} kg H₂</span>
                              <span>•</span>
                              <span>{b.vehicleModel || b.vehiclePlate || '700 Bar FCEV'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => verifyBookingCode(b._id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                            }}
                          >
                            <Zap size={13} />
                            Arm Pump
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: '14px 24px',
                background: 'rgba(8, 13, 22, 0.9)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <Sparkles size={13} color="#38bdf8" />
                <span>Station Safety Interlocks Enabled</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
