import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { 
  Smartphone, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  Zap, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UPIModal({
  isOpen,
  onClose,
  amount = 500,
  orderId = '',
  description = 'Hydrogen Refuel Payment',
  customer = {},
  onSuccess
}) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'apps' | 'vpa'
  const [selectedApp, setSelectedApp] = useState('gpay');
  const [vpa, setVpa] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [completed, setCompleted] = useState(false);

  const merchantVpa = 'aurorah2@okhdfcbank';
  const resolvedOrderId = orderId || `H2-${Date.now().toString().slice(-6)}`;
  const upiLink = `upi://pay?pa=${merchantVpa}&pn=Aurora+Hydrogen+Hub&am=${amount}&cu=INR&tn=${encodeURIComponent(resolvedOrderId)}`;

  useEffect(() => {
    if (customer.email && !vpa) {
      const name = customer.email.split('@')[0];
      setVpa(`${name}@okhdfcbank`);
    }
  }, [customer]);

  // Expiry timer
  useEffect(() => {
    if (!isOpen) return;
    setSecondsRemaining(300);
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    toast.success('Merchant UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = (appName = 'UPI App') => {
    setProcessing(true);
    setProcessingStep(`Authorizing payment in ${appName}...`);

    setTimeout(() => {
      setProcessingStep('Receiving NPCI cryptographic settlement confirmation...');
    }, 700);

    setTimeout(() => {
      setProcessingStep('Generating UPI Reference No (UTR)...');
    }, 1300);

    setTimeout(() => {
      const utrNumber = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
      const txnId = `upi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setProcessingStep(`UPI Verified! UTR: ${utrNumber}`);
      setCompleted(true);

      setTimeout(() => {
        setProcessing(false);
        setCompleted(false);
        if (onSuccess) {
          onSuccess({
            paymentMethod: 'upi',
            upi_txn_id: txnId,
            upi_utr: utrNumber,
            amount: Number(amount)
          });
        }
      }, 700);
    }, 2000);
  };

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '⚡', color: '#0ea5e9' },
    { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: '#8b5cf6' },
    { id: 'paytm', name: 'Paytm UPI', icon: '🔷', color: '#0284c7' },
    { id: 'cred', name: 'CRED UPI', icon: '💎', color: '#10b981' },
    { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳', color: '#f59e0b' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.88)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#0a0e1a',
        borderRadius: '24px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 40px rgba(56, 189, 248, 0.15)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>

        {/* UPI Branded Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #032e54 60%, #0284c7 100%)',
          padding: '22px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <button 
            onClick={onClose}
            disabled={processing}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#cbd5e1',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              background: '#10b981',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.05em'
            }}>
              <span>NPCI</span>
              <span>•</span>
              <span>UPI 2.0</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#93c5fd' }}>
              <ShieldCheck size={13} color="#10b981" />
              <span>Instant Bank Transfer</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '500' }}>{description}</div>
              <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                Ref #{resolvedOrderId}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase' }}>Amount to Pay</div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#070a14'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            style={{
              background: activeTab === 'qr' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'qr' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'qr' ? '#38bdf8' : '#94a3b8',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <QrCode size={15} />
            <span>Scan QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            style={{
              background: activeTab === 'apps' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'apps' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'apps' ? '#38bdf8' : '#94a3b8',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={15} />
            <span>UPI Apps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vpa')}
            style={{
              background: activeTab === 'vpa' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'vpa' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'vpa' ? '#38bdf8' : '#94a3b8',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>@ VPA ID</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '24px', minHeight: '290px' }}>
          
          {/* TAB 1: DYNAMIC QR CODE */}
          {activeTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '16px',
                width: '180px',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                position: 'relative'
              }}>
                <QRCode value={upiLink} size={150} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
                <Clock size={13} color="#f59e0b" />
                <span>QR Code valid for </span>
                <span style={{ color: '#f59e0b', fontWeight: '700', fontFamily: 'monospace' }}>{timeDisplay}</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12px'
              }}>
                <span style={{ color: '#94a3b8' }}>Merchant VPA:</span>
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>{merchantVpa}</span>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  style={{ background: 'transparent', border: 'none', color: copied ? '#10b981' : '#a1a1aa', cursor: 'pointer', padding: 0, marginLeft: '4px' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
                Scan using any UPI app: Google Pay, PhonePe, Paytm, BHIM, or Banking app.
              </p>
            </div>
          )}

          {/* TAB 2: UPI APPS INTENT */}
          {activeTab === 'apps' && (
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', fontWeight: '500' }}>
                Select your preferred UPI App:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {upiApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app.id);
                      handleSimulatePayment(app.name);
                    }}
                    style={{
                      background: selectedApp === app.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedApp === app.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{app.icon}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{app.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pay ₹{amount} instantly</div>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>Pay</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VPA COLLECT REQUEST */}
          {activeTab === 'vpa' && (
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                Enter your Virtual Payment Address (VPA):
              </div>

              <input 
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '14px'
                }}
              />

              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                A collect request will be sent to your UPI app. Open your app and enter your 4 or 6-digit UPI PIN to approve the payment.
              </div>

              <button
                type="button"
                onClick={() => handleSimulatePayment('UPI Collect')}
                disabled={processing || !vpa}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: processing || !vpa ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: processing || !vpa ? 0.6 : 1
                }}
              >
                <span>Send UPI Collect Request (₹{amount})</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

        </div>

        {/* Footer Button (for QR scan simulation & confirmation) */}
        {activeTab === 'qr' && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#070a14',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {processing ? (
              <div style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                {completed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>{processingStep}</span>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      border: '3px solid rgba(56, 189, 248, 0.3)',
                      borderTopColor: '#38bdf8',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>
                      {processingStep}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <button
                id="btn-simulate-upi-scan"
                type="button"
                onClick={() => handleSimulatePayment('UPI QR Scan')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Zap size={16} />
                <span>Simulate App Scan & Pay ₹{Number(amount).toLocaleString('en-IN')}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
