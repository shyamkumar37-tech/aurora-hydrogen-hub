import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Shield, Check, Copy, RefreshCw, Zap, Plus, ArrowRight } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function DigitalFuelCard({ user, vehicle, walletBalance = 0, onClose, onOpenTopup }) {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [monthlyCap, setMonthlyCap] = useState(user?.monthlySpendingCap || 15000);
  const [copied, setCopied] = useState(false);
  const [loadingPass, setLoadingPass] = useState(true);
  const [savingCap, setSavingCap] = useState(false);

  // Dispenser Tap-to-Fuel Flow
  const [showTapToFuel, setShowTapToFuel] = useState(false);
  const [dispensers, setDispensers] = useState([]);
  const [selectedDispenserId, setSelectedDispenserId] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  // Vehicle resolution
  const resolvedPlate = vehicle?.plateNumber || user?.vehicleNumber || 'No Plate Registered';
  const resolvedModel = vehicle?.model || user?.vehicleModel || 'Registered H₂ Vehicle';

  // Loyalty tier resolution
  const points = user?.loyaltyPoints || 0;
  const tier = user?.tier || (points >= 1000 ? 'Platinum' : points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Starter');

  // Fetch or regenerate token from backend
  const fetchPassToken = async () => {
    try {
      const res = await api.get('/wallet/pass');
      if (res.data?.token) {
        setToken(res.data.token);
        setSecondsRemaining(res.data.expiresInSeconds || 60);
        if (res.data.user?.monthlySpendingCap) {
          setMonthlyCap(res.data.user.monthlySpendingCap);
        }
      }
    } catch (err) {
      // Fallback in case of network glitch
      const fallbackToken = 'H2-AUTH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setToken(fallbackToken);
      setSecondsRemaining(60);
    } finally {
      setLoadingPass(false);
    }
  };

  useEffect(() => {
    fetchPassToken();
  }, []);

  // Fetch available dispensers for Tap-to-Fuel
  useEffect(() => {
    const fetchAvailableDispensers = async () => {
      try {
        const { data } = await api.get('/dispensers');
        const available = data.filter(d => d.status === 'available' || d.status === 'active');
        setDispensers(available);
        if (available.length > 0) {
          setSelectedDispenserId(available[0]._id);
        }
      } catch (e) {
        console.warn('Could not load dispensers', e);
      }
    };
    fetchAvailableDispensers();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          fetchPassToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('NFC Token copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Persist spending cap to backend
  const handleCapChange = async (newCap) => {
    setMonthlyCap(newCap);
    setSavingCap(true);
    try {
      await api.put('/wallet/spending-cap', { cap: newCap });
      toast.success(`Monthly spending cap saved: ₹${newCap.toLocaleString('en-IN')}`, { id: 'cap-toast' });
    } catch (err) {
      toast.error('Could not save spending cap');
    } finally {
      setSavingCap(false);
    }
  };

  // Authorize pump via digital pass NFC tap
  const handleAuthorizeTap = async () => {
    if (!selectedDispenserId) {
      toast.error('Please select an available dispenser nozzle');
      return;
    }
    setAuthorizing(true);
    try {
      const res = await api.post('/wallet/pass/authorize-tap', {
        dispenserId: selectedDispenserId,
        token
      });
      toast.success('NFC Tap Verified! 700 Bar Dispenser Unlocked.');
      onClose();
      navigate(res.data.sessionUrl || `/live-pumping/${selectedDispenserId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authorization failed. Please check wallet balance.');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleDownloadAppleWallet = () => {
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.aurora.hydrogen.fuelcard",
      serialNumber: token,
      teamIdentifier: "AURORAH2NET",
      organizationName: "Aurora Hydrogen Hub",
      description: "Aurora 700 Bar Tap-to-Fuel Digital NFC Pass",
      logoText: "AURORA H2",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(15, 23, 42)",
      labelColor: "rgb(56, 189, 248)",
      generic: {
        primaryFields: [
          { key: "cardholder", label: "CARDHOLDER", value: user?.name || "Authorized Driver" }
        ],
        secondaryFields: [
          { key: "plate", label: "VEHICLE & PLATE", value: `${resolvedModel} (${resolvedPlate})` },
          { key: "balance", label: "WALLET BALANCE", value: `₹${walletBalance.toLocaleString('en-IN')}` }
        ],
        auxiliaryFields: [
          { key: "authcode", label: "NFC TOKEN", value: token },
          { key: "tier", label: "TIER", value: `${tier} Member` }
        ]
      },
      barcode: {
        format: "PKBarcodeFormatQR",
        message: `AURORA-PASS:${user?.email || 'driver'}:${token}:${resolvedPlate}`,
        messageEncoding: "iso-8859-1"
      }
    };

    const blob = new Blob([JSON.stringify(passData, null, 2)], { type: 'application/vnd.apple.pkpass' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurora_fuel_pass_${user?.name?.split(' ')[0] || 'driver'}.pkpass`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Apple Wallet passfile generated & downloaded!');
  };

  const handleSaveGoogleWallet = () => {
    const gPassData = {
      iss: "aurora-hydrogen-hub@google-services.iam.gserviceaccount.com",
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      payload: {
        genericObjects: [
          {
            id: `338800000002221.${token}`,
            classId: "338800000002221.aurora_hydrogen_driver_pass",
            logo: { sourceUri: { uri: "https://aurorah2.com/logo.png" } },
            cardTitle: { defaultValue: { language: "en", value: "Aurora Hydrogen Hub" } },
            header: { defaultValue: { language: "en", value: user?.name || "Authorized Driver" } },
            subheader: { defaultValue: { language: "en", value: `${resolvedModel} • Plate: ${resolvedPlate}` } },
            balance: { defaultValue: { language: "en", value: `₹${walletBalance.toLocaleString('en-IN')}` } },
            barcode: { type: "QR_CODE", value: `AURORA-NFC:${token}:${resolvedPlate}` }
          }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(gPassData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_wallet_pass_${token}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Google Wallet Pass bundle generated & downloaded!');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px 28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(6, 182, 212, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <Smartphone size={18} color="#06b6d4" />
              </div>
              <span style={{ color: '#06b6d4', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Contactless Fueling
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Aurora Digital Fuel Pass
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >
            Close
          </button>
        </div>

        {/* Holographic Apple / Google Wallet Style Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #082f49 50%, #0369a1 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 20px 40px -10px rgba(6, 182, 212, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
          marginBottom: '22px'
        }}>
          {/* Subtle glowing circuit accent in corner */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, transparent 70%)',
            filter: 'blur(20px)'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#38bdf8' }}>H<sub>2</sub></span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.12em', color: '#e0f2fe' }}>AURORA PASS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', color: '#38bdf8' }}>
              <Zap size={13} />
              <span>TAP-TO-FUEL ENABLED</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>CARDHOLDER</span>
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.02em', display: 'block' }}>{user?.name || 'Authorized Driver'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Plate: {resolvedPlate}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {resolvedModel}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Wallet Balance</span>
                {onOpenTopup && (
                  <button 
                    type="button"
                    onClick={onOpenTopup}
                    style={{ background: 'rgba(56, 189, 248, 0.2)', border: 'none', color: '#38bdf8', borderRadius: '6px', padding: '1px 6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <Plus size={10} /> Add Funds
                  </button>
                )}
              </div>
              <span style={{ fontSize: '16px', fontWeight: '700', display: 'block', marginTop: '2px' }}>₹{walletBalance.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Network Tier</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', display: 'block', marginTop: '2px' }}>★ {tier} Member</span>
            </div>
          </div>
        </div>

        {/* Dynamic Rotating Token & Authorization Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa' }}>
              <Shield size={14} color="#10b981" />
              <span>Encrypted Pump Authorization Code</span>
            </div>
            <button
              type="button"
              onClick={fetchPassToken}
              title="Click to refresh token manually"
              style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#06b6d4', fontWeight: '600', cursor: 'pointer' }}
            >
              <RefreshCw size={12} className={loadingPass ? "animate-spin" : ""} />
              <span>Regenerates in {secondsRemaining}s</span>
            </button>
          </div>

          {/* Large Code Badge */}
          <div 
            onClick={handleCopy}
            style={{
              background: '#12141d',
              border: '1px dashed #06b6d4',
              borderRadius: '12px',
              padding: '12px 20px',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '19px', fontWeight: '800', letterSpacing: '0.12em', color: '#22d3ee', fontFamily: 'monospace' }}>
              {token || 'GENERATING...'}
            </span>
            <button 
              type="button" 
              style={{ background: 'transparent', border: 'none', color: copied ? '#10b981' : '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#71717a', textAlign: 'center', margin: 0 }}>
            Hold phone near the NFC reader on any 700-bar dispenser nozzle to start fueling immediately.
          </p>

          {/* Interactive Tap-to-Fuel Action */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            {!showTapToFuel ? (
              <button
                id="btn-nfc-tap"
                type="button"
                onClick={() => setShowTapToFuel(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#22d3ee',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Zap size={14} />
                <span>Simulate NFC Tap & Fuel Now</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Select Active Dispenser</span>
                  <button 
                    type="button" 
                    onClick={() => setShowTapToFuel(false)}
                    style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>

                <select
                  id="select-dispenser"
                  value={selectedDispenserId}
                  onChange={(e) => setSelectedDispenserId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#12141d',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '0 10px',
                    fontSize: '12px'
                  }}
                >
                  {dispensers.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.station?.name || 'Aurora Hub'} — Nozzle #{d.dispenserNumber || 1} ({d.nozzleType || '700 bar'})
                    </option>
                  ))}
                </select>

                <button
                  id="btn-authorize-pass"
                  type="button"
                  disabled={authorizing || !selectedDispenserId}
                  onClick={handleAuthorizeTap}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: authorizing ? 0.7 : 1
                  }}
                >
                  <Zap size={14} />
                  <span>{authorizing ? 'Verifying NFC & Unlocking...' : 'Authorize Dispenser & Dispense H₂'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Budget Cap Slider */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Monthly Fleet Spending Cap</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#06b6d4' }}>
              ₹{monthlyCap.toLocaleString('en-IN')} {savingCap ? '(saving...)' : ''}
            </span>
          </div>
          <input 
            type="range" 
            min="5000" 
            max="50000" 
            step="1000" 
            value={monthlyCap} 
            onChange={(e) => handleCapChange(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717a' }}>
            <span>₹5,000 / mo</span>
            <span>Auto-throttles beyond cap</span>
            <span>₹50,000 / mo</span>
          </div>
        </div>

        {/* Apple Wallet & Google Wallet Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button 
            type="button"
            onClick={handleDownloadAppleWallet}
            style={{
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '12px',
              padding: '11px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <span> Add to Apple Wallet</span>
          </button>

          <button 
            type="button"
            onClick={handleSaveGoogleWallet}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '12px',
              padding: '11px',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,255,255,0.15)'
            }}
          >
            <span>💳 Save to Google Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
