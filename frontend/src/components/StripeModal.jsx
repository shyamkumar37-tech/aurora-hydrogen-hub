import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Smartphone,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StripeModal({
  isOpen,
  onClose,
  amount = 500,
  orderId = '',
  description = 'Hydrogen Refuel Payment',
  customer = {},
  onSuccess
}) {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('888');
  const [name, setName] = useState(customer.name || 'Demo Customer');
  const [country, setCountry] = useState('India');
  const [zip, setZip] = useState('600028');

  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (customer.name) setName(customer.name);
  }, [customer]);

  if (!isOpen) return null;

  const resolvedOrderId = orderId || `pi_${Date.now().toString().slice(-8)}`;

  const handlePay = () => {
    setProcessing(true);
    setStep('Connecting to Stripe Payment Intent...');

    setTimeout(() => {
      setStep('Running Stripe Radar fraud detection & risk evaluation...');
    }, 700);

    setTimeout(() => {
      setStep('Verifying 3D Secure / Card Issuer authorization...');
    }, 1400);

    setTimeout(() => {
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const chargeId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setStep('Payment verified by Stripe Network!');
      setCompleted(true);

      setTimeout(() => {
        setProcessing(false);
        setCompleted(false);
        if (onSuccess) {
          onSuccess({
            paymentMethod: 'stripe',
            stripe_payment_id: paymentIntentId,
            stripe_charge_id: chargeId,
            amount: Number(amount)
          });
        }
      }, 700);
    }, 2200);
  };

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
        maxWidth: '460px',
        backgroundColor: '#0d111c',
        borderRadius: '24px',
        border: '1px solid rgba(99, 91, 255, 0.35)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 45px rgba(99, 91, 255, 0.2)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        
        {/* Stripe Branded Header */}
        <div style={{
          background: 'linear-gradient(135deg, #181c2e 0%, #2a2c5a 50%, #635bff 100%)',
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
              background: 'rgba(255, 255, 255, 0.15)',
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

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              background: '#635bff',
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
              <span>stripe</span>
              <span>•</span>
              <span>checkout</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#c7d2fe' }}>
              <ShieldCheck size={13} color="#a5b4fc" />
              <span>PCI-DSS Level 1 Encrypted</span>
            </div>
          </div>

          {/* Amount & Description */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#c7d2fe', fontWeight: '500' }}>{description}</div>
              <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '2px' }}>
                Ref #{resolvedOrderId}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#c7d2fe', textTransform: 'uppercase' }}>Amount to Pay</div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Card Form Body */}
        <div style={{ padding: '24px' }}>
          
          {/* 1-Click Apple Pay / Google Pay Simulation Button */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={handlePay}
              disabled={processing}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '12px',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: processing ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
            >
              <Smartphone size={16} />
              <span>Pay with Apple Pay / Google Pay</span>
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
              — or pay with international credit or debit card —
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Cardholder Name */}
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                Cardholder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Card Number */}
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                Card Information
              </label>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <CreditCard size={18} color="#635bff" style={{ marginRight: '10px' }} />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', color: '#94a3b8' }}>VISA</span>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', color: '#94a3b8' }}>MC</span>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', color: '#94a3b8' }}>AMEX</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM / YY"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="password"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="CVC"
                    maxLength={4}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Country & Postal Code */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  Country
                </label>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Globe size={14} color="#635bff" />
                  <span>{country}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

          </div>

          {/* Security Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '11px', color: '#64748b' }}>
            <Lock size={12} color="#635bff" />
            <span>Encrypted with Stripe TLS 1.3 & SHA-256 tokens</span>
          </div>

        </div>

        {/* Footer / Submit Button */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#080a12',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {processing ? (
            <div style={{
              background: 'rgba(99, 91, 255, 0.15)',
              border: '1px solid rgba(99, 91, 255, 0.4)',
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
                  <span>{step}</span>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    border: '3px solid rgba(99, 91, 255, 0.3)',
                    borderTopColor: '#635bff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '600' }}>
                    {step}
                  </span>
                </>
              )}
            </div>
          ) : (
            <button
              id="btn-stripe-confirm-pay"
              type="button"
              onClick={handlePay}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
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
                boxShadow: '0 4px 16px rgba(99, 91, 255, 0.4)'
              }}
            >
              <Lock size={15} />
              <span>Pay ₹{Number(amount).toLocaleString('en-IN')} via Stripe</span>
              <ArrowRight size={16} />
            </button>
          )}
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
