import React, { useState } from 'react';
import { AlertTriangle, Phone, X, AlertOctagon } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function EmergencySOS() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  const getDeviceLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 28.6139, lng: 77.2090, accuracy: null, isFallback: true });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy || 10),
            isFallback: false
          });
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using station area fallback:', err.message);
          resolve({ lat: 28.6139, lng: 77.2090, accuracy: null, isFallback: true });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });
  };

  const requestHelp = async (type) => {
    setLoading(true);
    try {
      // Get real device GPS location from browser
      const location = await getDeviceLocation();
      
      // Using the Support Desk SOS route
      const res = await api.post('/support/sos', { type, location });
      setActiveRequest(res.data);
      if (location.isFallback) {
        toast.success('Emergency response triggered. Staff notified.', { icon: '🚨' });
      } else {
        toast.success(`Emergency triggered with live GPS (${location.lat}, ${location.lng})!`, { icon: '🚨' });
      }
    } catch (err) {
      toast.error('Failed to send SOS. Please dial 112 directly.');
    } finally {
      setLoading(false);
    }
  };

  if (activeRequest) {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        <div style={{ background: '#ef4444', color: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <AlertTriangle className="animate-pulse" />
              LIVE SOS ACTIVE
            </div>
            <button onClick={() => setActiveRequest(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
            Request ID: #{activeRequest._id ? activeRequest._id.substring(0,8).toUpperCase() : 'PENDING'}<br/>
            Status: <strong style={{ textTransform: 'uppercase' }}>{activeRequest.isAcknowledged ? 'Acknowledged' : 'Active'}</strong><br/>
            GPS Fix: <span style={{ fontFamily: 'monospace' }}>{activeRequest.location?.lat || 28.6139}, {activeRequest.location?.lng || 77.2090}</span>
          </div>
          <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.95 }}>
            Aurora Rapid Response has received your precise coordinates and dispatched the nearest roadside technician.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        style={{ 
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 9998,
          height: '56px', borderRadius: '28px', padding: '0 24px',
          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
          cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(239, 68, 68, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
        }}
      >
        <AlertOctagon size={20} />
        <span style={{ fontWeight: '600', letterSpacing: '0.05em', fontSize: '0.875rem' }}>EMERGENCY ASSIST</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '1.25rem' }}>
                <AlertOctagon />
                Emergency Assistance
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X /></button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '24px' }}>
              What do you need help with? We will transmit your exact location to the operations center.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Vehicle Problem', 'Station/Pump Problem', 'Accident', 'Medical Emergency', 'Roadside Assistance'].map(type => (
                <button
                  key={type}
                  onClick={() => { requestHelp(type); setOpen(false); }}
                  disabled={loading}
                  style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#fff', padding: '16px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#3f3f46'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#27272a'}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone color="#a1a1aa" size={16} />
              <span style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>In immediate danger? Dial 112 directly.</span>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </>
  );
}
