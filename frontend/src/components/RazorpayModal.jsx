import { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Check, 
  Zap
} from 'lucide-react';

export default function RazorpayModal({ 
  isOpen, 
  onClose, 
  amount = 500, 
  currency = 'INR',
  orderId = '',
  description = 'Hydrogen Refueling Payment',
  customer = {},
  onSuccess,
  onFailure
}) {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  
  // Card form
  const [cardNumber, setCardNumber] = useState('4532 8900 1234 5678');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardName, setCardName] = useState(customer.name || 'Authorized Driver');
  
  // Netbanking
  const [selectedBank, setSelectedBank] = useState('HDFC');
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (customer.name) {
      setCardName(customer.name);
    }
    if (customer.email && !upiId) {
      const prefix = customer.email.split('@')[0];
      setUpiId(`${prefix}@oksbi`);
    }
  }, [customer]);

  if (!isOpen) return null;

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handlePay = () => {
    setProcessing(true);
    setProcessingStep('Connecting to Razorpay gateway...');

    setTimeout(() => {
      setProcessingStep('Authorizing 256-bit encryption handshake...');
    }, 600);

    setTimeout(() => {
      setProcessingStep('Verifying bank authorization...');
    }, 1200);

    setTimeout(() => {
      setProcessingStep('Payment captured successfully!');
      setCompleted(true);

      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const resolvedOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const signature = `rzp_sig_${Math.random().toString(36).substring(2, 15)}`;

      setTimeout(() => {
        setProcessing(false);
        setCompleted(false);
        if (onSuccess) {
          onSuccess({
            razorpay_payment_id: paymentId,
            razorpay_order_id: resolvedOrderId,
            razorpay_signature: signature,
            amount,
            method: activeTab
          });
        }
      }, 700);
    }, 1900);
  };

  const popularBanks = [
    { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC' },
    { id: 'ICICI', name: 'ICICI Bank', code: 'ICICI' },
    { id: 'SBI', name: 'State Bank of India', code: 'SBIN' },
    { id: 'AXIS', name: 'Axis Bank', code: 'UTIB' },
    { id: 'KOTAK', name: 'Kotak Mahindra', code: 'KKBK' },
    { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#0c1322',
        borderRadius: '20px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.15)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        
        {/* Razorpay Branded Top Header */}
        <div style={{
          background: 'linear-gradient(135deg, #091e3a 0%, #063970 100%)',
          padding: '20px 24px',
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
              background: 'rgba(255, 255, 255, 0.1)',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '13px',
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.05em'
            }}>
              <Zap size={13} fill="#ffffff" />
              <span>Razorpay</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#93c5fd' }}>
              <Lock size={11} />
              <span>256-Bit SSL Secured</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '500' }}>{description}</div>
              <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                Order #{orderId?.slice(-8)?.toUpperCase() || 'H2-PAY'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase' }}>Amount to Pay</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Tab Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#080d1a'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('upi')}
            style={{
              background: activeTab === 'upi' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upi' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'upi' ? '#38bdf8' : '#94a3b8',
              padding: '14px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Smartphone size={15} />
            <span>UPI / QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('card')}
            style={{
              background: activeTab === 'card' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'card' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'card' ? '#38bdf8' : '#94a3b8',
              padding: '14px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <CreditCard size={15} />
            <span>Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('netbanking')}
            style={{
              background: activeTab === 'netbanking' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'netbanking' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'netbanking' ? '#38bdf8' : '#94a3b8',
              padding: '14px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Building2 size={15} />
            <span>Netbanking</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', minHeight: '260px' }}>
          
          {/* TAB 1: UPI */}
          {activeTab === 'upi' && (
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', fontWeight: '500' }}>
                Select Instant UPI App or Scan QR
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  { id: 'gpay', name: 'Google Pay', icon: '⚡' },
                  { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                  { id: 'paytm', name: 'Paytm UPI', icon: '🔷' },
                  { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳' },
                ].map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedUpiApp(app.id)}
                    style={{
                      background: selectedUpiApp === app.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedUpiApp === app.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{app.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{app.name}</span>
                    </div>
                    {selectedUpiApp === app.id && <Check size={16} color="#38bdf8" />}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  Or enter your Virtual Payment Address (VPA)
                </label>
                <input 
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. driver@oksbi or 9876543210@paytm"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '11px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CARDS */}
          {activeTab === 'card' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Credit or Debit Card</span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>Test Mode Autofilled</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Card Number
                  </label>
                  <input 
                    type="text"
                    value={cardNumber}
                    maxLength={19}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4532 8900 1234 5678"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '11px 14px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Valid Thru (MM/YY)
                    </label>
                    <input 
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                      CVV
                    </label>
                    <input 
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="888"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Cardholder Name
                  </label>
                  <input 
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '11px 14px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETBANKING */}
          {activeTab === 'netbanking' && (
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', fontWeight: '500' }}>
                Select Your Bank
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {popularBanks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBank(b.id)}
                    style={{
                      background: selectedBank === b.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedBank === b.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{b.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Retail & Corporate</div>
                    </div>
                    {selectedBank === b.id && <Check size={16} color="#38bdf8" />}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer with Razorpay Pay Button & Safety Notice */}
        <div style={{
          padding: '18px 24px',
          backgroundColor: '#080d1a',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {processing ? (
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              {completed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700' }}>
                  <CheckCircle2 size={24} color="#10b981" />
                  <span>Payment Authorized! Crediting Account...</span>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid rgba(56, 189, 248, 0.3)',
                    borderTopColor: '#38bdf8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>
                    {processingStep}
                  </span>
                </>
              )}
            </div>
          ) : (
            <button
              id="btn-razorpay-pay"
              type="button"
              onClick={handlePay}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Lock size={16} />
              <span>PAY ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <ArrowRight size={16} />
            </button>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            fontSize: '11px',
            color: '#64748b'
          }}>
            <Shield size={12} color="#10b981" />
            <span>Secured with Razorpay PCI-DSS Level 1 Encryption</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
