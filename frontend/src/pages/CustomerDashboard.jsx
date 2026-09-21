import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import { MapPin, Navigation, ArrowRight, Activity, Calendar, Clock, LogOut, Search, CreditCard, Settings, Bell, Car, Star, Sparkles, Smartphone, Leaf, ShieldCheck, Zap, Mic, WifiOff, Truck, FileText, Box, Camera, Scan, Fingerprint } from 'lucide-react';
import api from '../api/api';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import NearbyStationsMap from '../components/NearbyStationsMap';
import { useRealTime } from '../hooks/useRealTime';
import AIAssistant from '../components/AIAssistant';
import VehicleHealth from '../components/VehicleHealth';
import EmergencySOS from '../components/EmergencySOS';
import StationCompareModal from '../components/StationCompareModal';
import RoutePlanner from '../components/RoutePlanner';
import GarageManager from '../components/GarageManager';
import DynamicPricingWidget from '../components/DynamicPricingWidget';
import DigitalFuelCard from '../components/DigitalFuelCard';
import GreenPassportModal from '../components/GreenPassportModal';
import PredictiveRefillAlert from '../components/PredictiveRefillAlert';
import StationReviewsModal from '../components/StationReviewsModal';
import OnboardingModal from '../components/OnboardingModal';
import RazorpayModal from '../components/RazorpayModal';
import UPIModal from '../components/UPIModal';
import StripeModal from '../components/StripeModal';
import VoiceAssistantModal from '../components/VoiceAssistantModal';
import OfflineFuelPassModal from '../components/OfflineFuelPassModal';
import FleetManager from '../components/FleetManager';
import InvoiceModal from '../components/InvoiceModal';
import TankDigitalTwin3D from '../components/TankDigitalTwin3D';
import PlateVisionScanner from '../components/PlateVisionScanner';
import PasskeyScannerModal from '../components/PasskeyScannerModal';
import { registerPasskey } from '../utils/webAuthnUtils';

export default function CustomerDashboard() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [stations, setStations] = useState([]);
  const [onlineStationsCount, setOnlineStationsCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [hoveredStationId, setHoveredStationId] = useState(null);
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [topupLoading, setTopupLoading] = useState(false);
  
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', plateNumber: '', tankCapacity: '' });
  
  // 7 Next-Gen Customer Modules States
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [showDigitalPassModal, setShowDigitalPassModal] = useState(false);
  const [showGreenPassportModal, setShowGreenPassportModal] = useState(false);
  const [reviewStation, setReviewStation] = useState(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showOfflinePass, setShowOfflinePass] = useState(false);
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [dashboardInvoice, setDashboardInvoice] = useState(null);
  const [show3DTwin, setShow3DTwin] = useState(false);
  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);

  const handleEnrollPasskey = async () => {
    try {
      const res = await registerPasskey(user);
      if (res.success) {
        toast.success('Biometric Passkey registered! Hardware Face ID / Touch ID active.', { icon: '🪪' });
      }
    } catch (err) {
      toast.error(err.message || 'Passkey enrollment failed');
    }
  };

  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nearest');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  let filteredStationsList = stations.filter(s => {
    if (searchQuery && !s.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'Available now') {
      if (s.status !== 'operational' && s.status !== 'active') return false;
      if (!s.availablePumps || s.availablePumps <= 0) return false;
    }
    if (activeFilter === 'Open 24/7') {
      // Mock logic: assume all are 24/7 unless specified
      if (s.operatingHours && s.operatingHours !== '24/7') return false;
    }
    if (filter === 'available' && s.status !== 'operational' && s.status !== 'active') return false;
    return true;
  });

  // Apply sorting based on activeFilter or dropdown sortBy
  if (activeFilter === 'Fastest') {
    filteredStationsList.sort((a, b) => (a.waitTime || 0) - (b.waitTime || 0));
  } else if (sortBy === 'price') {
    filteredStationsList.sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0));
  } else if (activeFilter === 'Nearest' || sortBy === 'nearest') {
    // If backend returns in nearest order, keep it. We just preserve default order for now.
  }

  // Auto-select the top station when a filter chip is clicked
  useEffect(() => {
    if (activeFilter && filteredStationsList.length > 0) {
      setSelectedStationId(filteredStationsList[0]._id);
    } else if (activeFilter === '') {
      setSelectedStationId(null);
    }
  }, [activeFilter]);

  const [showCompare, setShowCompare] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [carbonImpact, setCarbonImpact] = useState(null);

  const { socket } = useRealTime(user?.token);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for new notifications via WebSocket
    socket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      toast.success(newNotif.message, { icon: '🔔' });
    });

    // Listen for booking updates
    socket.on('booking_updated', (data) => {
      setBookings(prev => prev.map(b => b._id === data.bookingId ? { ...b, status: data.status } : b));
      if (data.status === 'confirmed') toast.success('Booking confirmed!', { icon: '✅' });
    });

    // Listen for dispenser updates (if subscribed to a station)
    socket.on('dispenser_status_changed', (data) => {
      // Re-fetch stations to update UI if needed, or update state directly
      // For simplicity, we can let the polling catch up or update locally:
      setStations(prev => prev.map(s => {
        if (s._id === data.stationId) {
          // Adjust available pumps
          const diff = data.status === 'reserved' ? -1 : 1;
          return { ...s, availablePumps: Math.max(0, (s.availablePumps || 0) + diff) };
        }
        return s;
      }));
    });

    return () => {
      socket.off('notification');
      socket.off('booking_updated');
      socket.off('dispenser_status_changed');
    };
  }, [socket]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stRes, bkRes, anRes, walRes, vehRes, notifRes] = await Promise.all([
          api.get('/stations'),
          api.get('/bookings/my'),
          api.get('/analytics/dashboard'),
          api.get('/wallet/transactions'),
          api.get('/vehicles/my'),
          api.get('/notifications') // Changed from /notifications/my to match controller
        ]);
        
        const allStations = stRes.data;
        setStations(allStations);
        
        const online = allStations.filter(s => s.status === 'operational' || s.status === 'active').length;
        setOnlineStationsCount(online);
        
        // Only show active bookings
        setBookings(bkRes.data.filter(b => b.status === 'pending' || b.status === 'confirmed'));
        setAnalytics(anRes.data);
        setWalletTransactions(walRes.data);
        const vehicleList = Array.isArray(vehRes.data) ? vehRes.data : (vehRes.data ? [vehRes.data] : []);
        const activeVeh = vehicleList.find(v => v.isActive) || vehicleList[0] || null;
        setVehicle(activeVeh);
        setNotifications(notifRes.data || []);



        try {
          const res = await api.get('/rewards/me');
          setRewards(res.data.data);
        } catch(e) { console.warn('Could not fetch rewards'); }

        try {
          const res = await api.get('/analytics/carbon-impact');
          setCarbonImpact(res.data.data);
        } catch(e) { console.warn('Could not fetch carbon impact'); }
        
      } catch (err) {
        console.error('Dashboard data error', err);
        setErrorMsg(err.message || 'Failed to load dashboard data');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  const handleUPITopup = () => {
    setShowWalletModal(false);
    setShowUPIModal(true);
  };

  const handleStripeTopup = () => {
    setShowWalletModal(false);
    setShowStripeModal(true);
  };

  const handleStripeSuccess = async (paymentData) => {
    try {
      const verifyRes = await api.post('/wallet/verify-payment', {
        amount: paymentData.amount || topupAmount,
        paymentMethod: 'stripe',
        stripe_payment_id: paymentData.stripe_payment_id,
        stripe_charge_id: paymentData.stripe_charge_id
      });

      if (verifyRes.data.success) {
        const newBal = verifyRes.data.newBalance;
        if (user) user.walletBalance = newBal;
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.walletBalance = newBal;
        localStorage.setItem('user', JSON.stringify(localUser));

        setWalletTransactions(prev => [{
          _id: paymentData.stripe_payment_id,
          amount: paymentData.amount || topupAmount,
          type: 'credit',
          source: 'stripe',
          reference: `Stripe Card #${paymentData.stripe_payment_id.slice(-8).toUpperCase()}`,
          status: 'success',
          createdAt: new Date().toISOString()
        }, ...prev]);

        toast.success(verifyRes.data.message || `₹${(paymentData.amount || topupAmount).toLocaleString('en-IN')} added via Stripe!`, {
          icon: '💳',
          duration: 5000
        });

        setShowStripeModal(false);
      }
    } catch (err) {
      console.error('Stripe verification error', err);
      toast.error('Stripe payment verification failed');
    }
  };

  const handleUPISuccess = async (paymentData) => {
    try {
      const verifyRes = await api.post('/wallet/verify-payment', {
        amount: paymentData.amount || topupAmount,
        paymentMethod: 'upi',
        upi_txn_id: paymentData.upi_txn_id,
        upi_utr: paymentData.upi_utr
      });

      if (verifyRes.data.success) {
        const newBal = verifyRes.data.newBalance;
        if (user) user.walletBalance = newBal;
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.walletBalance = newBal;
        localStorage.setItem('user', JSON.stringify(localUser));

        setWalletTransactions(prev => [{
          _id: paymentData.upi_txn_id,
          amount: paymentData.amount || topupAmount,
          type: 'credit',
          source: 'upi',
          reference: `UPI #${paymentData.upi_utr || 'SUCCESS'}`,
          status: 'success',
          createdAt: new Date().toISOString()
        }, ...prev]);

        toast.success(verifyRes.data.message || `₹${(paymentData.amount || topupAmount).toLocaleString('en-IN')} added via UPI!`, {
          icon: '⚡',
          duration: 5000
        });

        setShowUPIModal(false);
      }
    } catch (err) {
      console.error('UPI verification error', err);
      toast.error('UPI payment verification failed');
    }
  };

  const handleTopup = async () => {
    setTopupLoading(true);
    try {
      // 1. Create order on backend
      const orderRes = await api.post('/wallet/create-order', { amount: topupAmount });
      const { orderId, amount, currency } = orderRes.data;

      setRazorpayOrderData({
        orderId: orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        amount: topupAmount,
        currency: currency || 'INR'
      });

      // Close the amount selection modal and open the Razorpay Gateway
      setShowWalletModal(false);
      setShowRazorpayModal(true);
    } catch (err) {
      console.error('Razorpay init error', err);
      toast.error('Could not initialize payment order');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleRazorpaySuccess = async (paymentData) => {
    try {
      const verifyRes = await api.post('/wallet/verify-payment', {
        amount: paymentData.amount || topupAmount,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature
      });

      if (verifyRes.data.success) {
        const newBal = verifyRes.data.newBalance;
        if (user) user.walletBalance = newBal;
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.walletBalance = newBal;
        localStorage.setItem('user', JSON.stringify(localUser));

        // Update wallet transactions in state so UI reflects it immediately
        setWalletTransactions(prev => [{
          _id: paymentData.razorpay_payment_id,
          amount: paymentData.amount || topupAmount,
          type: 'credit',
          source: 'razorpay',
          reference: `Razorpay #${paymentData.razorpay_payment_id.slice(-8).toUpperCase()}`,
          status: 'success',
          createdAt: new Date().toISOString()
        }, ...prev]);

        toast.success(verifyRes.data.message || `₹${(paymentData.amount || topupAmount).toLocaleString('en-IN')} added to your wallet!`, {
          icon: '⚡',
          duration: 5000
        });

        setShowRazorpayModal(false);
      }
    } catch (err) {
      console.error('Payment verification error', err);
      toast.error('Payment verification failed');
    }
  };


  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setTopupLoading(true); // reuse loading state for simplicity
    try {
      const res = await api.post('/vehicles', vehicleForm);
      setVehicle(res.data);
      setShowVehicleModal(false);
      toast.success('Vehicle added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const monthlySpend = analytics?.totalSpend || 0;

  const nextBooking = bookings.length > 0 ? bookings[0] : null; 
  const points = user?.loyaltyPoints || 0;
  let tier = 'Starter';
  let nextTierPoints = 500;
  let nextTier = 'Silver';
  if (points >= 1000) { tier = 'Gold'; nextTierPoints = 2000; nextTier = 'Platinum'; }
  else if (points >= 500) { tier = 'Silver'; nextTierPoints = 1000; nextTier = 'Gold'; }
  const progressPct = Math.min((points / nextTierPoints) * 100, 100);

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'var(--text-main)', padding: '48px 48px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '400', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
              Welcome back, {user?.name?.split(' ')[0] || 'Driver'}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>
              Your refueling network is ready.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Voice AI Button */}
            <button
              onClick={() => setShowVoiceAssistant(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(2, 132, 199, 0.15) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#22d3ee',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.2)'
              }}
              title="Activate Hands-Free In-Car Voice Copilot"
            >
              <Mic size={15} color="#22d3ee" />
              <span>Voice AI</span>
            </button>

            {/* Offline Fuel Pass */}
            <button
              onClick={() => setShowOfflinePass(true)}
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Access Zero-Connectivity Digital Fueling Pass"
            >
              <WifiOff size={15} color="#f59e0b" />
              <span>Offline Pass</span>
            </button>

            {/* B2B Fleet Manager */}
            <button
              onClick={() => setShowFleetModal(true)}
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#60a5fa',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Manage Commercial Vehicle Fleet & Driver Limits"
            >
              <Truck size={15} color="#60a5fa" />
              <span>Fleet Hub</span>
            </button>

            {/* ESG Passport */}
            <button
              onClick={() => setShowGreenPassportModal(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="View Verifiable Zero-Emissions Provenance & CO2 Abatement"
            >
              <Leaf size={15} color="#10b981" />
              <span>ESG Passport</span>
            </button>

            {/* 3D Digital Twin */}
            <button
              onClick={() => setShow3DTwin(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Launch Interactive 3D Tank & Cryogenic Visualizer"
            >
              <Box size={15} color="#38bdf8" />
              <span>3D Twin</span>
            </button>

            {/* AI Plate Vision Scanner */}
            <button
              onClick={() => setShowPlateScanner(true)}
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#c084fc',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Scan Vehicle License Plate via Computer Vision"
            >
              <Scan size={15} color="#c084fc" />
              <span>Plate AI</span>
            </button>

            {/* FIDO2 Biometric Passkey Enrollment */}
            <button
              onClick={() => setShowPasskeyModal(true)}
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#22d3ee',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)'
              }}
              title="Enroll Optical Fingerprint Scanner / Passkey"
            >
              <Fingerprint size={15} color="#22d3ee" />
              <span>Passkey</span>
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn" 
                style={{ background: '#101112', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-main)', position: 'relative' }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', width: 16, height: 16, borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>
                    {unreadCount}
                  </div>
                )}
              </button>

              {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', zIndex: 50, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Notifications</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification._id} onClick={() => !notification.read && handleMarkAsRead(notification._id)} style={{ padding: '12px', background: notification.read ? 'transparent' : 'rgba(0, 240, 255, 0.05)', border: `1px solid ${notification.read ? 'rgba(255,255,255,0.05)' : 'rgba(0, 240, 255, 0.2)'}`, borderRadius: '8px', cursor: notification.read ? 'default' : 'pointer' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: notification.read ? 'normal' : '500', marginBottom: '4px' }}>{notification.message}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notification.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>You're all caught up!</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="btn" style={{ background: '#101112', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-main)' }}>
              <LogOut size={16} style={{ marginRight: '8px' }}/> Logout
            </button>
          </div>
        </div>

        {/* Profile Completion Alert Banner */}
        {user?.role === 'customer' && !user?.isProfileComplete && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.10) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '16px',
            padding: '16px 22px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 24px rgba(6, 182, 212, 0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <Car size={22} color="#22d3ee" />
              </div>
              <div>
                <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px' }}>
                  Vehicle Setup Incomplete
                </div>
                <div style={{ color: '#a1a1aa', fontSize: '13px', marginTop: '2px' }}>
                  Register your FCEV model and license plate to enable automatic dispenser pairing and fast fueling authorization.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowOnboardingModal(true)}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 14px rgba(6, 182, 212, 0.4)',
                whiteSpace: 'nowrap'
              }}
            >
              <Sparkles size={14} /> Setup Vehicle Now
            </button>
          </div>
        )}

        {/* NEXT-GEN QUICK ACCESS COMMAND TOOLBAR */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '28px'
        }}>
          <button 
            onClick={() => setShowRoutePlanner(true)}
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Navigation size={18} color="#06b6d4" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Trip Planner</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>H2 Range Navigator</span>
            </div>
          </button>

          <button 
            onClick={() => setShowGarageModal(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Car size={18} color="#3b82f6" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Virtual Garage</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Multi-Car & Specs</span>
            </div>
          </button>

          <button 
            onClick={() => setShowDigitalPassModal(true)}
            style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Smartphone size={18} color="#c084fc" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Digital Pass</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>NFC Tap-to-Fuel</span>
            </div>
          </button>

          <button 
            onClick={() => setShowGreenPassportModal(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Leaf size={18} color="#10b981" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Green Passport</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>ESG Clean Certificate</span>
            </div>
          </button>

          <button 
            onClick={() => setShowCompare(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Search size={18} color="#f59e0b" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Compare Hubs</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Side-by-Side Matrix</span>
            </div>
          </button>
        </div>

        {/* PREDICTIVE AI REFILL ALERT BANNER */}
        <PredictiveRefillAlert vehicle={vehicle} onBookRefill={() => navigate('/customer/book')} />


        {errorMsg ? (
          <div style={{ color: 'var(--accent-red)', padding: '24px', background: 'rgba(255,0,0,0.1)', borderRadius: '12px' }}>
            Failed to load dashboard: {errorMsg}. Check backend API routes.
          </div>
        ) : loading || !analytics ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            <Skeleton height="160px" borderRadius="12px" />
            <Skeleton height="300px" borderRadius="12px" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            {/* ROW 1: Vehicle, Bookings, Rewards, Network Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* Wallet & Vehicle */}
              <div className="premium-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Hydrogen Wallet</div>
                    <CreditCard size={16} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: '2.25rem', marginBottom: '8px' }}>₹{(user?.walletBalance || 0).toFixed(2)}</div>
                  {walletTransactions && walletTransactions.length > 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '16px' }}>
                      Last: {walletTransactions[0].type === 'credit' ? '+' : '-'}₹{walletTransactions[0].amount.toFixed(2)} on {new Date(walletTransactions[0].createdAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', marginBottom: '16px' }}>
                      Fund your wallet for 1-tap bookings
                    </div>
                  )}
                </div>
                <button onClick={() => setShowWalletModal(true)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.875rem', width: '100%' }}>Add Money</button>
              </div>

              {/* Active Bookings */}
              <div className="premium-panel">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Active Bookings</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '400' }}>{bookings.length}</div>
                <Link to="/customer/bookings" className="premium-link" style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', marginTop: '16px' }}>View bookings <ArrowRight size={14} style={{ marginLeft: '4px' }} /></Link>
              </div>

              {/* Rewards */}
              <div className="premium-panel">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Aurora Rewards</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '400' }}>{points}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontSize: '0.875rem' }}>{tier}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>{nextTierPoints} points → {nextTier}</span>
                  <span>{points} / {nextTierPoints}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'visible', position: 'relative' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(to right, #3b82f6, var(--accent-cyan))', borderRadius: '3px', boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)' }}></div>
                </div>
              </div>

              {/* Network */}
              <div className="premium-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Network Status</div>
                  <Activity size={16} color="var(--accent-emerald)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }}></div>
                  <span style={{ fontSize: '1.25rem' }}>{onlineStationsCount} Stations Online</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>98.7% Network Availability</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '16px' }}>Last updated just now</div>
              </div>
            </div>

            {/* ROW 2: Next Booking & Vehicle */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '24px' }}>
              
              {/* Next Refueling Block */}
              <div className="premium-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Refueling</div>
                  {nextBooking ? (
                    <Link to="/customer/bookings" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.75rem', borderRadius: '6px' }}>
                      VIEW DETAILS
                    </Link>
                  ) : (
                    <Link to="/customer/book" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem', borderRadius: '6px' }}>
                      BOOK SLOT
                    </Link>
                  )}
                </div>
                
                {nextBooking ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <div>
                      <div style={{ color: 'var(--accent-cyan)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '500' }}>Reservation {nextBooking._id.slice(-9).toUpperCase()}</div>
                      <div style={{ fontSize: '1.75rem', marginBottom: '16px' }}>{nextBooking.station?.name || 'Hydrogen Hub'}</div>
                      <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} /> {new Date(nextBooking.slotTime).toLocaleDateString()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const stId = nextBooking.station?._id || nextBooking.station;
                              if (stId) {
                                setSelectedStationId(stId);
                              }
                              const mapSection = document.getElementById('dashboard-map-section');
                              if (mapSection) {
                                mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                toast.success(`Locating ${nextBooking.station?.name || 'station'} on map below`, { icon: '📍' });
                              } else {
                                navigate('/stations/map');
                              }
                            }}
                            style={{
                              background: 'rgba(6, 182, 212, 0.1)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              color: '#38bdf8',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
                              e.currentTarget.style.borderColor = '#38bdf8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                            }}
                            title="Click to locate on interactive map"
                          >
                            <MapPin size={15} color="#38bdf8" />
                            <span>{nextBooking.station?.location?.address || 'View on Map'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', minWidth: '160px' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '300', marginBottom: '4px' }}>
                        {new Date(nextBooking.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ color: 'var(--accent-emerald)', fontSize: '0.875rem' }}>Confirmed</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 0' }}>
                    <Calendar size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>You have no upcoming refueling appointments.</div>
                  </div>
                )}
              </div>

              {/* My Vehicle Block */}
              <div className="premium-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>My Vehicle</div>
                  <button
                    onClick={() => setShowGarageModal(true)}
                    title="Garage & Vehicle Settings"
                    aria-label="Manage Vehicle Settings"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.color = 'var(--accent-cyan)';
                      e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                      e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <Settings size={16} />
                  </button>
                </div>
                
                {vehicle ? (() => {
                  const modelName = vehicle.model || (vehicle.make ? `${vehicle.make} ${vehicle.model || ''}`.trim() : 'Registered H₂ Vehicle');
                  const fuelPct = vehicle.currentFuelLevelPct !== undefined 
                    ? Number(vehicle.currentFuelLevelPct)
                    : (vehicle.tankCapacity && vehicle.currentLevel ? Math.round((Number(vehicle.currentLevel) / Number(vehicle.tankCapacity)) * 100) : 68);
                  const safeFuelPct = isNaN(fuelPct) ? 68 : fuelPct;
                  const estRange = vehicle.estimatedRangeKm !== undefined
                    ? Number(vehicle.estimatedRangeKm)
                    : (vehicle.currentLevel ? Math.round(Number(vehicle.currentLevel) * 100) : Math.round(safeFuelPct * 5.8));
                  const safeRange = isNaN(estRange) ? 430 : estRange;

                  return (
                    <>
                      <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>{modelName}</div>
                      
                      {vehicle.plateNumber && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>
                          <span style={{ color: 'var(--accent-cyan)' }}>PLATE:</span>
                          <span style={{ color: '#f8fafc', fontWeight: 600 }}>{vehicle.plateNumber}</span>
                        </div>
                      )}
                      
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>H₂ Level</span>
                          <span style={{ fontWeight: 700, color: safeFuelPct > 20 ? 'var(--accent-cyan)' : '#ef4444' }}>{safeFuelPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, safeFuelPct))}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #10b981)', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span>~{safeRange} km est. range</span>
                          <button 
                            onClick={() => setShowGarageModal(true)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            Manage Garage
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })() : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '16px 0' }}>
                    <Car size={44} color="rgba(255,255,255,0.15)" style={{ marginBottom: '12px' }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>No vehicle linked to garage.</div>
                    <button onClick={() => setShowGarageModal(true)} className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>Add Vehicle</button>
                  </div>
                )}
              </div>

            </div>

            {/* ROW 3: Nearby Stations (Map + List Layout) */}
            <div id="dashboard-map-section" className="premium-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', minHeight: '800px' }}>
                {/* Left Side: Real Leaflet Map */}
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', height: '100%', minHeight: '600px' }}>
                  <NearbyStationsMap 
                    stations={filteredStationsList} 
                    selectedStationId={selectedStationId} 
                    onSelectStation={setSelectedStationId}
                    hoveredStationId={hoveredStationId}
                    setHoveredStationId={setHoveredStationId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                </div>

                {/* Right Side: Premium Station List */}
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '8px', maxHeight: '800px' }}>
                  
                  {/* List Header & Controls */}
                  <div style={{ position: 'sticky', top: 0, background: '#0A0A0B', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Nearby Stations</div>
                        <button onClick={() => setShowCompare(true)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 12px', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                          SMART COMPARE
                        </button>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{filteredStationsList.length} found</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="nearest" style={{ background: '#0A0A0B' }}>Nearest ▼</option>
                        <option value="price" style={{ background: '#0A0A0B' }}>Lowest Price ▼</option>
                      </select>
                      
                      <button 
                        onClick={() => setFilter(filter === 'available' ? 'all' : 'available')}
                        style={{ background: filter === 'available' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: filter === 'available' ? '#10b981' : 'var(--text-muted)', border: `1px solid ${filter === 'available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '6px 12px', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Available Now
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredStationsList.length > 0 ? (
                      filteredStationsList
                        .map(station => {
                        const isMaintenance = station.status === 'maintenance' || station.status === 'offline';
                        const isHovered = hoveredStationId === station._id;
                        const isSelected = selectedStationId === station._id;

                        return (
                          <div 
                            key={station._id} 
                            onClick={() => setSelectedStationId(station._id)}
                            onMouseEnter={() => setHoveredStationId(station._id)}
                            onMouseLeave={() => setHoveredStationId(null)}
                            style={{ 
                              background: isSelected ? 'rgba(255,255,255,0.05)' : '#0F0F10', 
                              border: `1px solid ${isSelected ? 'var(--accent-cyan)' : isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`, 
                              borderRadius: '12px', 
                              padding: '20px',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: isHovered && !isSelected ? 'translateY(-2px)' : 'none',
                              opacity: isMaintenance ? 0.7 : 1
                            }}
                          >
                            {/* ROW 1: Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '500' }}>{station.name}</div>
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>5.7 km</div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isMaintenance ? '#f59e0b' : '#10b981', boxShadow: `0 0 8px ${isMaintenance ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'}` }}></div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isMaintenance ? '#f59e0b' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {station.status === 'active' ? 'Operational' : station.status}
                              </span>
                            </div>
                            
                            {/* ROW 2: Metrics Grid */}
                            {!isMaintenance ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Available Pumps</div>
                                  <div style={{ fontSize: '1.125rem' }}>{station.availablePumps} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/ {station.totalPumps}</span></div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Wait Time</div>
                                  <div style={{ fontSize: '1.125rem', color: station.waitTime < 10 ? '#10b981' : station.waitTime < 20 ? '#f59e0b' : '#ef4444' }}>~{station.waitTime} min</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Price</div>
                                  <div style={{ fontSize: '1.125rem' }}>₹{station.pricePerKg || 82}</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Queue</div>
                                  <div style={{ fontSize: '1.125rem' }}>{station.queueLength} veh</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div style={{ color: 'var(--text-main)', fontSize: '0.875rem', marginBottom: '4px' }}>Station currently unavailable</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Estimated reopening: <br/>Today · 6:30 PM</div>
                              </div>
                            )}

                            {/* ROW 3: Dynamic Green Tariff & Amenities */}
                            <div style={{ marginBottom: '16px' }}>
                              <DynamicPricingWidget station={station} basePrice={station.pricePerKg || 82} />
                            </div>
                            
                            {/* ROW 4: Actions & Reviews */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {!isMaintenance ? (
                                  <Link to={`/customer/book?station=${station._id}`} onClick={(e) => e.stopPropagation()} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', borderRadius: '6px', background: 'var(--text-main)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    BOOK SLOT <ArrowRight size={14} style={{ transform: isHovered ? 'translateX(2px)' : 'none', transition: 'transform 0.2s' }} />
                                  </Link>
                                ) : (
                                  <Link to={`/stations/${station._id}`} onClick={(e) => e.stopPropagation()} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.875rem', borderRadius: '6px' }}>
                                    VIEW DETAILS
                                  </Link>
                                )}

                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setReviewStation(station); }}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#d4d4d8',
                                    padding: '8px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <Star size={13} color="#f59e0b" fill="#f59e0b" />
                                  <span>Driver Reviews</span>
                                </button>
                              </div>
                              
                              {!isMaintenance && (
                                <Link to={`/stations/${station._id}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}>
                                  View Details →
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: 'var(--text-muted)', padding: '48px 24px', textAlign: 'center', background: '#101112', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '8px' }}>No hydrogen stations found</div>
                        <div style={{ marginBottom: '24px', fontSize: '0.875rem' }}>Try expanding your search radius or changing your filters.</div>
                        <button className="btn btn-outline">EXPAND SEARCH</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: Impact & Transactions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              
                {/* Usage Chart */}
                <div className="premium-panel">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Rewards 2.0</div>
                  {rewards ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '2rem', color: 'var(--accent-cyan)' }}>{rewards.points} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>pts</span></div>
                          <div style={{ color: 'var(--accent-emerald)', fontSize: '0.875rem', fontWeight: 'bold' }}>{rewards.tier} TIER</div>
                        </div>
                        {rewards.achievements && rewards.achievements.length > 0 && (
                          <div style={{ fontSize: '2rem' }}>{rewards.achievements[0].icon}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                          <span>Next: {rewards.nextTier}</span>
                          <span>{rewards.pointsNeeded} pts needed</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${rewards.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading rewards...</div>
                  )}
                </div>

                <div className="premium-panel">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Carbon Impact</div>
                  {carbonImpact ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {carbonImpact.totalH2Used.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg H₂ used</span>
                        </div>
                      </div>
                      <div style={{ borderLeft: '2px solid var(--accent-emerald)', paddingLeft: '16px' }}>
                        <div style={{ fontSize: '1.5rem', color: 'var(--accent-emerald)' }}>↓ {carbonImpact.estimatedCO2Avoided.toFixed(1)} kg CO₂e</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>≈ {Math.max(1, Math.floor(carbonImpact.estimatedCO2Avoided / 25))} trees worth of annual absorption</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading impact...</div>
                  )}
                </div>

                <div className="premium-panel">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Monthly Spend</div>
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>₹{monthlySpend.toFixed(2)}</div>
                    <div style={{ color: 'var(--accent-emerald)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
                      ↓ 12% vs last month
                    </div>
                    <Link to="/customer/transactions" className="btn btn-outline" style={{ width: '100%' }}>View transactions <ArrowRight size={16} style={{ marginLeft: '8px' }} /></Link>
                  </div>
                </div>
              </div>

              {/* ROW 5: AI & Health */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                <AIAssistant />
                {vehicle && vehicle._id ? (
                  <VehicleHealth vehicleId={vehicle._id} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', color: '#71717a' }}>
                    Add a vehicle to view telemetry health.
                  </div>
                )}
              </div>
            
            </div>
        )}
      </div>

      {/* Wallet Top-up Modal */}
      {showWalletModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Add Funds</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>Simulated payment gateway.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[500, 1000, 2000, 5000].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => setTopupAmount(amt)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${topupAmount === amt ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    background: topupAmount === amt ? 'rgba(0, 240, 255, 0.05)' : '#0A0A0B',
                    color: topupAmount === amt ? 'var(--accent-cyan)' : 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                id="btn-pay-upi"
                type="button"
                onClick={handleUPITopup}
                style={{ 
                  width: '100%', 
                  padding: '13px', 
                  borderRadius: '12px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                }}
              >
                <span>⚡ Pay via Direct UPI (GPay / PhonePe / QR)</span>
              </button>

              <button 
                id="btn-pay-stripe"
                type="button"
                onClick={handleStripeTopup}
                style={{ 
                  width: '100%', 
                  padding: '13px', 
                  borderRadius: '12px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99, 91, 255, 0.35)'
                }}
              >
                <span>💳 Pay via Stripe (Global Cards & Apple Pay)</span>
              </button>

              <button 
                id="btn-confirm-add-funds"
                type="button"
                onClick={handleTopup}
                disabled={topupLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  opacity: topupLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Zap size={14} color="#38bdf8" />
                <span>{topupLoading ? 'Preparing...' : 'Pay via Cards / Razorpay'}</span>
              </button>

              <button 
                type="button"
                onClick={() => setShowWalletModal(false)}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct UPI 2.0 (Dynamic QR + GPay/PhonePe Intent) Modal */}
      <UPIModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={topupAmount}
        orderId={`H2-WAL-${Date.now().toString().slice(-6)}`}
        description="Hydrogen Wallet Balance Top-up"
        customer={{
          name: user?.name,
          email: user?.email
        }}
        onSuccess={handleUPISuccess}
      />

      {/* Stripe Authentic Checkout Modal */}
      <StripeModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        amount={topupAmount}
        orderId={`pi_wal_${Date.now().toString().slice(-8)}`}
        description="Hydrogen Wallet Top-up (Stripe)"
        customer={{
          name: user?.name,
          email: user?.email
        }}
        onSuccess={handleStripeSuccess}
      />

      {/* Razorpay Authentic Checkout Gateway Modal */}
      <RazorpayModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        amount={topupAmount}
        orderId={razorpayOrderData?.orderId}
        description="Hydrogen Wallet Balance Top-up"
        customer={{
          name: user?.name,
          email: user?.email
        }}
        onSuccess={handleRazorpaySuccess}
        onFailure={(err) => toast.error(err?.message || 'Payment cancelled')}
      />

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Add Vehicle</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>Register your hydrogen vehicle.</p>
            
            <form onSubmit={handleAddVehicle}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Make</label>
                <input type="text" required value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} placeholder="e.g. Toyota" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Model</label>
                <input type="text" required value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} placeholder="e.g. Nexo, Swift" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>License Plate</label>
                <input type="text" required value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value.toUpperCase()})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', fontFamily: 'monospace' }} placeholder="e.g. MH 02 AB 1234" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Tank Capacity (kg)</label>
                <input type="number" step="0.1" required value={vehicleForm.tankCapacity} onChange={e => setVehicleForm({...vehicleForm, tankCapacity: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} placeholder="e.g. 5.6" />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={topupLoading}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', opacity: topupLoading ? 0.7 : 1 }}
                >
                  {topupLoading ? 'Saving...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showCompare && <StationCompareModal onClose={() => setShowCompare(false)} onBook={(id) => navigate(`/customer/book?station=${id}`)} />}
      
      {/* 7 NEXT-GEN CUSTOMER FEATURE MODALS */}
      {showRoutePlanner && (
        <RoutePlanner 
          activeVehicle={vehicle} 
          stations={stations} 
          onClose={() => setShowRoutePlanner(false)} 
          onBookSlot={(id) => navigate(`/customer/book?station=${id}`)} 
        />
      )}

      {showGarageModal && (
        <GarageManager 
          onClose={() => setShowGarageModal(false)} 
          onVehicleChanged={(newVeh) => setVehicle(newVeh)} 
        />
      )}

      {showDigitalPassModal && (
        <DigitalFuelCard 
          user={user} 
          vehicle={vehicle}
          walletBalance={user?.walletBalance || 0} 
          onClose={() => setShowDigitalPassModal(false)} 
          onOpenTopup={() => {
            setShowDigitalPassModal(false);
            setShowWalletModal(true);
          }}
        />
      )}

      {showGreenPassportModal && (
        <GreenPassportModal 
          user={user} 
          totalHydrogenKg={analytics?.totalHydrogenKg || 52.8} 
          co2SavedKg={analytics?.carbonImpact?.co2SavedKg || 448} 
          onClose={() => setShowGreenPassportModal(false)} 
        />
      )}

      {reviewStation && (
        <StationReviewsModal 
          station={reviewStation} 
          onClose={() => setReviewStation(null)} 
        />
      )}

      <OnboardingModal 
        isOpen={showOnboardingModal}
        onComplete={() => setShowOnboardingModal(false)}
        onSkip={() => setShowOnboardingModal(false)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        user={user}
        walletBalance={user?.walletBalance || 0}
        stations={stations}
      />

      {/* Offline Digital Fuel Pass Modal */}
      <OfflineFuelPassModal
        isOpen={showOfflinePass}
        onClose={() => setShowOfflinePass(false)}
        user={user}
        walletBalance={user?.walletBalance || 0}
      />

      {/* B2B Corporate Fleet Manager */}
      <FleetManager
        isOpen={showFleetModal}
        onClose={() => setShowFleetModal(false)}
      />

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!dashboardInvoice}
        onClose={() => setDashboardInvoice(null)}
        data={dashboardInvoice}
      />

      {/* 3D Digital Twin Tank Visualizer */}
      <TankDigitalTwin3D
        isOpen={show3DTwin}
        onClose={() => setShow3DTwin(false)}
        currentPressure={685}
        temperature={-38}
      />

      {/* Live AI Vehicle Plate Scanner */}
      <PlateVisionScanner
        isOpen={showPlateScanner}
        onClose={() => setShowPlateScanner(false)}
        onPlateDetected={(scanResult) => {
          const dispenserId = scanResult?.dispenser?._id;
          const plateNo = scanResult?.plateNumber || scanResult;
          if (dispenserId) {
            toast.success(`Bay allocated for ${plateNo}! Launching live 700-bar dispensing...`, { icon: '⚡', duration: 4000 });
            navigate(`/live-pumping/${dispenserId}`);
          } else {
            toast.success(`Vehicle ${plateNo} verified in Aurora network!`, { icon: '🚗' });
          }
        }}
      />

      {/* Biometric Passkey Fingerprint Scanner Modal */}
      <PasskeyScannerModal
        isOpen={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        mode="enroll"
        currentUser={user}
        onSuccess={(cred) => {
          toast.success(`Fingerprint Passkey successfully linked to ${user?.name || 'account'}!`, { icon: '🪪' });
        }}
      />

      <EmergencySOS />
    </div>
  );
}

