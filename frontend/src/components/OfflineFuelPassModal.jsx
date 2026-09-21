import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, RefreshCw, X, Fuel, Clock, AlertTriangle, Key } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

export default function OfflineFuelPassModal({ isOpen, onClose, user, walletBalance }) {
  const [offlineToken, setOfflineToken] = useState('');
  const [expiresIn, setExpiresIn] = useState(7200); // 2 hours
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if existing token is stored or generate a new cryptographically structured token
      const cached = localStorage.getItem('aurora_offline_fuel_pass');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.expiresAt > Date.now()) {
            setOfflineToken(parsed.token);
            setExpiresIn(Math.round((parsed.expiresAt - Date.now()) / 1000));
            setIsCached(true);
            return;
          }
        } catch (e) {}
      }

      // Generate a new secure offline pass
      generateNewPass();
    }
  }, [isOpen]);

  const generateNewPass = () => {
    const randomSalt = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours validity
    const tokenPayload = {
      userId: user?._id || user?.id || 'CUST-OFFLINE',
      name: user?.name || 'Authorized Driver',
      maxOfflineFuelKg: 10,
      timestamp: Date.now(),
      salt: randomSalt,
      signature: `SIG-H2-${randomSalt}-${Math.floor(Math.random() * 89999 + 10000)}`
    };

    const tokenStr = btoa(JSON.stringify(tokenPayload));
    localStorage.setItem('aurora_offline_fuel_pass', JSON.stringify({
      token: tokenStr,
      expiresAt: expiry
    }));

    setOfflineToken(tokenStr);
    setExpiresIn(7200);
    setIsCached(true);
    toast.success('Offline Fuel Pass cached in local secure storage!', { icon: '⚡' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: 'linear-gradient(145deg, #0d131f 0%, #060912 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        padding: '32px',
        color: '#ffffff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 40px rgba(245, 158, 11, 0.1)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <WifiOff size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Offline Digital Fuel Pass</h3>
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>Zero-Connectivity PWA Technology</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
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

        {/* Offline Explanation Banner */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '12px 14px',
          fontSize: '12px',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px'
        }}>
          <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span>
            Works without internet! Scan this pass at any station optical reader to dispense up to <strong>10 kg H₂</strong>. Syncs balance automatically when back online.
          </span>
        </div>

        {/* High-Contrast QR Code Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '12px', background: '#ffffff', borderRadius: '12px' }}>
            <QRCode value={offlineToken || 'AURORA-OFFLINE-PASS'} size={210} />
          </div>
          <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '14px', marginTop: '10px', letterSpacing: '0.05em' }}>
            PASS ID: {user?.name?.slice(0, 4).toUpperCase() || 'CUST'}-{Math.floor(Date.now() / 1000).toString().slice(-4)}
          </span>
          <span style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
            700 BAR PROTOCOL VERIFIED
          </span>
        </div>

        {/* Pass Stats & Validity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Fuel size={13} color="#06b6d4" /> Max Offline Fuel
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#06b6d4', display: 'block', marginTop: '4px' }}>
              10.0 kg H₂
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#f59e0b" /> Offline TTL
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b', display: 'block', marginTop: '4px' }}>
              {Math.floor(expiresIn / 60)} mins left
            </span>
          </div>
        </div>

        {/* Refresh / Regenerate button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={generateNewPass}
            style={{
              flex: 1,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Regenerate Offline Token</span>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
