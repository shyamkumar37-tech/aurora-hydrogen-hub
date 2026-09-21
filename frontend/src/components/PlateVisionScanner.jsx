import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, CheckCircle2, ShieldCheck, AlertCircle, Scan, Car, Upload, Loader2, Truck } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function PlateVisionScanner({ isOpen, onClose, onPlateDetected }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedData, setDetectedData] = useState(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  // Play synthetic scanner beep via Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  // Fetch real registered vehicles from MongoDB
  useEffect(() => {
    if (isOpen) {
      setDetectedData(null);
      setUploadedImagePreview(null);
      setIsScanning(true);

      const fetchVehicles = async () => {
        try {
          const [myVehRes, fleetRes] = await Promise.all([
            api.get('/vehicles/my').catch(() => ({ data: [] })),
            api.get('/fleet').catch(() => ({ data: { data: [] } }))
          ]);

          const personal = Array.isArray(myVehRes.data) ? myVehRes.data : (myVehRes.data?.vehicles || []);
          const fleet = Array.isArray(fleetRes.data?.data) ? fleetRes.data.data : [];
          const combined = [...personal, ...fleet];
          setUserVehicles(combined);

          // If user already has vehicles in DB, automatically select the active one
          if (combined.length > 0) {
            const defaultVeh = combined.find(v => v.isActive) || combined[0];
            processPlateRecognition(null, defaultVeh.plateNumber);
          }
        } catch (e) {
          console.error('Failed to load user vehicles', e);
        }
      };

      fetchVehicles();

      // Attempt live camera stream
      let stream = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play();
            }
            setHasCamera(true);
          })
          .catch((err) => {
            console.warn('Webcam permission not granted or unavailable:', err);
            setHasCamera(false);
          });
      }

      return () => {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      };
    }
  }, [isOpen]);

  // Real backend plate processing endpoint
  const processPlateRecognition = async (imageBase64, plateNumber) => {
    try {
      setAnalyzing(true);
      const res = await api.post('/ai/scan-plate', {
        image: imageBase64,
        plateNumber: plateNumber
      });

      if (res.data.success) {
        setDetectedData(res.data.data);
        setIsScanning(false);
        playBeep();
        toast.success(`Vehicle Identified: ${res.data.data.plateNumber}`, { icon: '🎯' });
      }
    } catch (err) {
      console.error('Vision processing error', err);
      toast.error('Could not process optical scan');
    } finally {
      setAnalyzing(false);
    }
  };

  // Capture frame from active video element
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      setUploadedImagePreview(base64);
      processPlateRecognition(base64, null);
    } catch (e) {
      console.error('Capture error', e);
      toast.error('Failed to capture camera frame');
    }
  };

  // Handle uploaded image file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImagePreview(reader.result);
      processPlateRecognition(reader.result, null);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (detectedData && onPlateDetected) {
      onPlateDetected(detectedData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: 'linear-gradient(145deg, #090e1a 0%, #030712 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        color: '#ffffff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 50px rgba(6, 182, 212, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <Scan size={20} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Live AI Vehicle Scanner</h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real Computer Vision & MongoDB Vehicle Matcher</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Camera / Upload Stage */}
        <div style={{
          height: '260px',
          background: '#040711',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {uploadedImagePreview ? (
            <img
              src={uploadedImagePreview}
              alt="Scanned Vehicle"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : hasCamera ? (
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
              <Camera size={40} color="#06b6d4" style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                Camera Viewfinder Ready
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                Capture live photo or upload vehicle image below
              </p>
            </div>
          )}

          {/* Optical Reticle & Scanning Beam */}
          <div style={{
            position: 'absolute',
            width: '260px',
            height: '110px',
            border: detectedData ? '2px solid #10b981' : '2px dashed #06b6d4',
            borderRadius: '12px',
            boxShadow: detectedData ? '0 0 25px rgba(16, 185, 129, 0.5)' : '0 0 20px rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            {analyzing && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                background: '#06b6d4',
                boxShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d4'
              }} />
            )}

            {detectedData && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.85)',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em' }}>
                  MATCHED IN DATABASE ({detectedData.confidence}%)
                </span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.05em' }}>
                  {detectedData.plateNumber}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real Capture / Upload Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {hasCamera && (
            <button
              onClick={handleCaptureCamera}
              disabled={analyzing}
              style={{
                flex: 1,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#22d3ee',
                borderRadius: '10px',
                padding: '8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Camera size={14} />
              <span>Capture Live Frame</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '10px',
              padding: '8px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Upload size={14} />
            <span>Upload Plate Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Real Registered Vehicles Selector (From Database) */}
        {userVehicles.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
              Or Scan From Your Registered Vehicles ({userVehicles.length})
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
              {userVehicles.map((veh) => {
                const isCurrent = detectedData?.plateNumber === veh.plateNumber;
                return (
                  <button
                    key={veh._id || veh.plateNumber}
                    onClick={() => {
                      setUploadedImagePreview(null);
                      processPlateRecognition(null, veh.plateNumber);
                    }}
                    style={{
                      background: isCurrent ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#ffffff'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '800', color: isCurrent ? '#22d3ee' : '#ffffff' }}>
                      {veh.plateNumber}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {veh.model}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Real Matched Database Record Display */}
        {detectedData && (
          <div style={{
            background: detectedData.isRegistered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: detectedData.isRegistered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color={detectedData.isRegistered ? '#10b981' : '#f59e0b'} />
                <span style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>
                  {detectedData.vehicle?.model || 'Aurora Clean Hydrogen Vehicle'}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#22d3ee'
              }}>
                {detectedData.nozzleRecommendation}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
              <span>Plate: <strong style={{ color: '#ffffff' }}>{detectedData.plateNumber}</strong></span>
              <span>Capacity: <strong style={{ color: '#ffffff' }}>{detectedData.vehicle?.tankCapacityKg || 5.6} kg</strong></span>
              <span>Status: <strong style={{ color: detectedData.isRegistered ? '#10b981' : '#f59e0b' }}>{detectedData.isRegistered ? 'Enrolled in Network' : 'Unregistered Guest'}</strong></span>
            </div>
            {detectedData.dispenser && (
              <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Allocated Dispenser Bay:</span>
                <strong style={{ color: '#22d3ee' }}>
                  {detectedData.dispenser.station?.name || 'Aurora Hub'} · {detectedData.dispenser.nozzleType}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleConfirm}
            disabled={!detectedData}
            style={{
              flex: 1,
              background: detectedData
                ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: detectedData ? 'pointer' : 'not-allowed',
              opacity: detectedData ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🚀 Confirm & Start Live Fueling</span>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '12px 18px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
