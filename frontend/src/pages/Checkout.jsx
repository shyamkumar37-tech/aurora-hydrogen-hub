import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { 
  ArrowLeft, 
  Wallet, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Fuel, 
  MapPin, 
  Clock, 
  Printer, 
  Sparkles,
  Zap,
  Lock,
  ChevronRight,
  Smartphone
} from 'lucide-react';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { printInvoicePDF } from '../utils/reportExportUtils';
import RazorpayModal from '../components/RazorpayModal';
import UPIModal from '../components/UPIModal';
import StripeModal from '../components/StripeModal';

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // default to 'upi' for fastest friction-free checkout
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  useEffect(() => {
    const fetchCheckoutDetails = async () => {
      try {
        const res = await api.get(`/payments/details/${bookingId}`);
        setDetails(res.data);
      } catch (error) {
        console.error('Failed to load booking checkout details', error);
        toast.error(error.response?.data?.message || 'Could not load checkout reservation');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) {
      fetchCheckoutDetails();
    }
  }, [bookingId]);

  const handlePay = async () => {
    if (!details) return;

    if (paymentMethod === 'upi') {
      setShowUPIModal(true);
      return;
    }

    if (paymentMethod === 'stripe') {
      setShowStripeModal(true);
      return;
    }

    if (paymentMethod === 'card' || paymentMethod === 'razorpay') {
      setShowRazorpayModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments/process-payment', {
        bookingId,
        paymentMethod,
        amount: details.estimatedTotal
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Payment Authorized Successfully!');
        setPaymentSuccess(res.data);
        
        // Update user state in localStorage if wallet was used
        if (res.data.newBalance !== undefined) {
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          userObj.walletBalance = res.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed. Please try another method.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpaySuccess = async (paymentData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/payments/process-payment', {
        bookingId,
        paymentMethod: 'card',
        amount: details.estimatedTotal,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature
      });

      if (res.data.success) {
        toast.success('Razorpay Payment Verified & Refuel Slot Confirmed!');
        setPaymentSuccess(res.data);
        setShowRazorpayModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUPISuccess = async (paymentData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/payments/process-payment', {
        bookingId,
        paymentMethod: 'upi',
        amount: details.estimatedTotal,
        upi_utr: paymentData.upi_utr,
        upi_txn_id: paymentData.upi_txn_id
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Direct UPI Payment Verified & Slot Confirmed!');
        setPaymentSuccess(res.data);
        setShowUPIModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'UPI payment confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripeSuccess = async (paymentData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/payments/process-payment', {
        bookingId,
        paymentMethod: 'stripe',
        amount: details.estimatedTotal,
        stripe_payment_id: paymentData.stripe_payment_id,
        stripe_charge_id: paymentData.stripe_charge_id
      });

      if (res.data.success) {
        toast.success('Stripe Payment Verified & Slot Confirmed!');
        setPaymentSuccess(res.data);
        setShowStripeModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Stripe payment confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!details) return;
    const user = details.user || JSON.parse(localStorage.getItem('user') || '{}');
    printInvoicePDF({
      _id: paymentSuccess?.transactionId || bookingId,
      quantityDispensed: details.estimatedKg || 5.0,
      cost: details.estimatedTotal || 410,
      createdAt: new Date(),
      station: { name: details.booking?.station?.name || 'Aurora Hydrogen Hub' }
    }, {
      name: user.name || 'Customer',
      email: user.email || 'customer@aurora.com',
      tier: user.tier || 'Silver'
    });
  };

  if (loading) {
    return (
      <div className="responsive-page-container">
        <div className="responsive-page-inner" style={{ maxWidth: '640px' }}>
          <Skeleton height="60px" style={{ marginBottom: '24px' }} borderRadius="12px" />
          <Skeleton height="350px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  if (!details || !details.booking) {
    return (
      <div style={{ backgroundColor: '#050505', minHeight: '100vh', padding: '48px 24px', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px', textAlign: 'center' }}>
          <Fuel size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Reservation Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            We couldn't retrieve the refueling reservation for booking #{bookingId?.slice(-6)?.toUpperCase()}.
          </p>
          <Button onClick={() => navigate('/customer/bookings')} style={{ width: '100%' }}>
            View My Bookings
          </Button>
        </div>
      </div>
    );
  }

  const { booking, user, pricePerKg, estimatedKg, estimatedTotal } = details;
  const currentWallet = user?.walletBalance || 0;
  const isWalletSufficient = currentWallet >= estimatedTotal;
  const displayId = `HYD-${booking._id.slice(-6).toUpperCase()}`;

  // SUCCESS CONFIRMATION VIEW
  if (paymentSuccess) {
    return (
      <div className="responsive-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          maxWidth: '480px', 
          width: '100%', 
          background: '#090d16', 
          border: '1px solid rgba(16, 185, 129, 0.3)', 
          borderRadius: '24px', 
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          
          <div style={{ padding: '36px 24px', textAlign: 'center', background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.15) 0%, rgba(9,13,22,0) 80%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={36} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Payment Confirmed</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Refueling slot locked with verified cryptographic authentication token.
            </p>
          </div>

          <div style={{ padding: '28px 24px' }}>
            {/* Optical QR Token */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', width: '180px', height: '180px', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <QRCode value={displayId} size={150} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Token Pass</span>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '0.15em', color: '#38bdf8' }}>{displayId}</div>
            </div>

            {/* Receipt Summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Station</span>
                <span style={{ fontWeight: '600' }}>{booking.station?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Reserved Mass</span>
                <span style={{ fontWeight: '600' }}>{estimatedKg} kg H₂ (700 bar)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Settled Amount</span>
                <span style={{ fontWeight: '800', color: '#34d399' }}>₹{estimatedTotal.toFixed(2)}</span>
              </div>
              {paymentSuccess.paymentMethod === 'wallet' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>New Wallet Balance</span>
                  <span style={{ fontWeight: '700', color: '#38bdf8' }}>₹{paymentSuccess.newBalance?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button onClick={handlePrintReceipt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}>
                <Printer size={16} />
                <span>Download ISO Tax Invoice PDF</span>
              </Button>

              <Link to="/customer/bookings" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                View in My Bookings
              </Link>

              <Link to="/customer-dashboard" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none', marginTop: '6px' }}>
                Back to Dashboard
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="responsive-page-container">
      <div className="responsive-page-inner" style={{ maxWidth: '640px' }}>
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            color: '#94a3b8', 
            marginBottom: '28px', 
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '700', marginBottom: '12px' }}>
            <Lock size={12} />
            <span>256-BIT CRYPTOGRAPHIC SETTLEMENT</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
            Refueling Checkout
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Lock your reserved dispenser slot and pre-authorize fueling session.
          </p>
        </div>

        {/* Reservation Summary Panel */}
        <div style={{ 
          background: '#090d16', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '20px', 
          padding: '24px', 
          marginBottom: '24px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Station</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>{booking.station?.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <MapPin size={12} /> {booking.station?.address || 'Precision Hydrogen Terminal'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Slot Time</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', marginTop: '2px' }}>
                {new Date(booking.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {new Date(booking.slotTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reserved Mass</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>{estimatedKg} kg</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rate: ₹{pricePerKg}/kg</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Dispenser Protocol</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#34d399' }}>700 Bar H₂</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{booking.dispenser?.nozzleType || 'Nozzle #01'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '1rem', fontWeight: '600' }}>Pre-Authorization Total</span>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#34d399' }}>₹{estimatedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '14px' }}>
            Select Payment Method
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Method 1: Hydrogen Wallet */}
            <div 
              onClick={() => setPaymentMethod('wallet')}
              style={{
                background: paymentMethod === 'wallet' ? 'rgba(56, 189, 248, 0.08)' : '#090d16',
                border: paymentMethod === 'wallet' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={22} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Hydrogen Wallet</span>
                    {isWalletSufficient ? (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: '700' }}>Instant 1-Tap</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: '700' }}>Low Balance</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                    Available Balance: <strong style={{ color: isWalletSufficient ? '#f8fafc' : '#ef4444' }}>₹{currentWallet.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: paymentMethod === 'wallet' ? '6px solid #38bdf8' : '2px solid rgba(255,255,255,0.2)' }}></div>
            </div>

            {/* Method 2: Direct Dynamic UPI (GPay, PhonePe, Paytm, QR) */}
            <div 
              onClick={() => setPaymentMethod('upi')}
              style={{
                background: paymentMethod === 'upi' ? 'rgba(16, 185, 129, 0.08)' : '#090d16',
                border: paymentMethod === 'upi' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Direct Dynamic UPI</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: '800' }}>⚡ INSTANT • ZERO KYC</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>GPay, PhonePe, Paytm, BHIM & Dynamic QR Code</div>
                </div>
              </div>

              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: paymentMethod === 'upi' ? '6px solid #10b981' : '2px solid rgba(255,255,255,0.2)' }}></div>
            </div>

            {/* Method 2: Credit Card / Razorpay Gateway */}
            <div 
              onClick={() => setPaymentMethod('card')}
              style={{
                background: paymentMethod === 'card' ? 'rgba(56, 189, 248, 0.08)' : '#090d16',
                border: paymentMethod === 'card' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={22} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Razorpay Gateway</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', fontWeight: '800' }}>CARDS • UPI</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Visa, MasterCard, GPay, PhonePe, NetBanking</div>
                </div>
              </div>

              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: paymentMethod === 'card' ? '6px solid #38bdf8' : '2px solid rgba(255,255,255,0.2)' }}></div>
            </div>

            {/* Method 3: Stripe Global Gateway */}
            <div 
              onClick={() => setPaymentMethod('stripe')}
              style={{
                background: paymentMethod === 'stripe' ? 'rgba(99, 91, 255, 0.08)' : '#090d16',
                border: paymentMethod === 'stripe' ? '1px solid #635bff' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 91, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={22} color="#818cf8" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Stripe Global Gateway</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(99, 91, 255, 0.25)', color: '#a5b4fc', fontWeight: '800' }}>GLOBAL CARDS • APPLE PAY</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Visa, MasterCard, Amex, Apple Pay & Google Pay</div>
                </div>
              </div>

              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: paymentMethod === 'stripe' ? '6px solid #635bff' : '2px solid rgba(255,255,255,0.2)' }}></div>
            </div>

            {/* Method 3: Pay at Station Dispenser */}
            <div 
              onClick={() => setPaymentMethod('station')}
              style={{
                background: paymentMethod === 'station' ? 'rgba(56, 189, 248, 0.08)' : '#090d16',
                border: paymentMethod === 'station' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Fuel size={22} color="#fbbf24" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>On-Arrival Station Billing</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Pay via RFID Fleet Pass or Cash at pump terminal</div>
                </div>
              </div>

              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: paymentMethod === 'station' ? '6px solid #38bdf8' : '2px solid rgba(255,255,255,0.2)' }}></div>
            </div>

          </div>
        </div>

        {/* Submit Action */}
        <Button 
          onClick={handlePay} 
          disabled={submitting || (paymentMethod === 'wallet' && !isWalletSufficient)}
          style={{ 
            width: '100%', 
            padding: '18px', 
            fontSize: '1.1rem', 
            fontWeight: '800', 
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          {submitting ? (
            <span>Processing Cryptographic Settlement...</span>
          ) : paymentMethod === 'wallet' && !isWalletSufficient ? (
            <span>Insufficient Wallet Funds (₹{currentWallet.toFixed(2)})</span>
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>AUTHORIZE & PAY ₹{estimatedTotal.toFixed(2)}</span>
            </>
          )}
        </Button>

        {paymentMethod === 'wallet' && !isWalletSufficient && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/customer-dashboard" style={{ color: '#38bdf8', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '600' }}>
              + Go to Dashboard to Add Funds to Wallet
            </Link>
          </div>
        )}

      </div>

      {/* Direct UPI 2.0 Dynamic QR Modal for Slot Settlement */}
      <UPIModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={estimatedTotal}
        orderId={`order_upi_${booking._id.slice(-6).toUpperCase()}`}
        description={`Hydrogen Refuel at ${booking.station?.name || 'Aurora Station'}`}
        customer={{
          name: user?.name,
          email: user?.email
        }}
        onSuccess={handleUPISuccess}
      />

      {/* Razorpay Gateway Modal for Refueling Slot Settlement */}
      <RazorpayModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        amount={estimatedTotal}
        orderId={`order_slot_${booking._id.slice(-6).toUpperCase()}`}
        description={`Refuel Session at ${booking.station?.name || 'Aurora Station'}`}
        customer={{
          name: user?.name,
          email: user?.email
        }}
        onSuccess={handleRazorpaySuccess}
        onFailure={(err) => toast.error(err?.message || 'Payment cancelled')}
      />

      {/* Stripe Authentic Checkout Modal for Refueling Slot Settlement */}
      <StripeModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        amount={estimatedTotal}
        orderId={`pi_slot_${booking._id.slice(-6).toUpperCase()}`}
        description={`Refuel Session at ${booking.station?.name || 'Aurora Station'}`}
        customer={{
          name: user?.name,
          email: user?.email
        }}
        onSuccess={handleStripeSuccess}
      />
    </div>
  );
}
