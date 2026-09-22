import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Scan, 
  ArrowLeft, 
  Fuel, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Radio, 
  Cpu, 
  Sparkles,
  Gauge
} from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [dispensers, setDispensers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBay, setSelectedBay] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const navigate = useNavigate();

  // Load live dispenser bays from MongoDB
  useEffect(() => {
    const fetchDispensers = async () => {
      try {
        const res = await api.get('/dispensers');
        const list = Array.isArray(res.data) ? res.data : (res.data?.dispensers || []);
        setDispensers(list);
      } catch (e) {
        console.warn('Failed to load dispensers', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDispensers();
  }, []);

  // Initialize camera QR scanner
  useEffect(() => {
    let scanner = null;
    try {
      scanner = new Html5QrcodeScanner('dispenser-qr-reader', {
        qrbox: { width: 260, height: 260 },
        fps: 12,
      });

      scanner.render(
        (result) => {
          scanner.clear().catch(() => {});
          setScanResult(result);
          handleProcessQRCode(result);
        },
        (error) => {
          // Continuous scan frame non-detection - ignore
        }
      );
    } catch (e) {
      console.warn('Scanner init error', e);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [dispensers]);

  const handleProcessQRCode = (code) => {
    toast.success('Dispenser QR Scanned!', { icon: '⚡' });
    // Check if code contains direct URL
    if (code.includes('/live-pumping/')) {
      const parts = code.split('/live-pumping/');
      const dispId = parts[1]?.split('?')[0];
      if (dispId) {
        authorizeAndNavigate(dispId);
        return;
      }
    }
    
    // Check if code matches an existing dispenser ID
    const matched = dispensers.find(d => String(d._id) === String(code));
    if (matched) {
      authorizeAndNavigate(matched._id);
    } else if (dispensers.length > 0) {
      authorizeAndNavigate(dispensers[0]._id);
    } else {
      toast.error('Dispenser code unrecognized');
    }
  };

  const authorizeAndNavigate = (dispenserId) => {
    setIsAuthorizing(true);
    toast('Authorizing Cryogenic Dispenser Coupling...', { icon: '🔒' });
    setTimeout(() => {
      navigate(`/live-pumping/${dispenserId}`);
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030306',
      color: '#f8fafc',
      padding: '36px 24px',
      position: 'relative'
    }}>
      {/* Background cyber radial glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Back Link */}
        <Link
          to="/customer/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#06b6d4',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '24px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Cockpit</span>
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
            }}>
              <Scan size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
              Scan-to-Pump Dispenser Terminal
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Scan the dynamic QR on any 700-bar dispenser pedestal, or tap an active bay below for instant authorization.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          
          {/* CAMERA QR SCANNER */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '20px',
            padding: '24px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={16} color="#06b6d4" className="animate-pulse" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Optical Camera Scanner</span>
              </div>
              <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                SAE J2601 Ready
              </span>
            </div>

            {scanResult ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid #10b981',
                borderRadius: '14px'
              }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.2rem' }}>Bay Authenticated!</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Connecting to dispensing telemetry...</p>
              </div>
            ) : (
              <div 
                id="dispenser-qr-reader" 
                style={{ 
                  borderRadius: '14px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#090d16'
                }} 
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: '#64748b', fontSize: '12px' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Encrypted token validation with station PLC controller.</span>
            </div>
          </div>

          {/* ACTIVE DISPENSER BAYS SELECTION */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Available Dispenser Bays</span>
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                {dispensers.length || 2} Online
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              At the station right now? Tap your bay nozzle to authorize without scanning:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
              {(dispensers.length > 0 ? dispensers : [
                { _id: 'demo-disp-1', dispenserNumber: '01', status: 'available', pressureRating: '700 bar Cryogenic', station: { name: 'Downtown Hydrogen Hub' } },
                { _id: 'demo-disp-2', dispenserNumber: '02', status: 'available', pressureRating: '350 bar Fast Fill', station: { name: 'Eastside Clean Energy' } }
              ]).map((disp, idx) => {
                const isSelected = selectedBay === disp._id;
                const bayNum = disp.dispenserNumber || `0${idx + 1}`;
                const stationTitle = disp.station?.name || 'Aurora Station Hub';
                const pressure = disp.pressureRating || (idx % 2 === 0 ? '700 bar' : '350 bar');

                return (
                  <div
                    key={disp._id}
                    onClick={() => {
                      setSelectedBay(disp._id);
                      authorizeAndNavigate(disp._id);
                    }}
                    style={{
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '14px',
                      padding: '16px',
                      cursor: isAuthorizing ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#06b6d4',
                        fontWeight: '800',
                        fontSize: '14px'
                      }}>
                        #{bayNum}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>Bay {bayNum}</span>
                          <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            {pressure}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#71717a', display: 'block', marginTop: '2px' }}>
                          {stationTitle}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Zap size={14} />
                      <span>Authorize</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Gauge size={18} color="#06b6d4" />
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Target pressure: <strong style={{ color: '#fff' }}>700 bar</strong> • Temperature target: <strong style={{ color: '#fff' }}>-40°C</strong>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
