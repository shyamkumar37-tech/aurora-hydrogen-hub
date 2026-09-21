import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { 
  Calendar, 
  Clock, 
  Fuel, 
  MapPin, 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Navigation, 
  ExternalLink, 
  AlertCircle,
  Activity,
  Maximize2,
  X,
  Sparkles,
  Search,
  Filter,
  Layers,
  ChevronRight,
  FileText
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function CustomerBookingsList() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, upcoming, completed, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bookingsRes, stationsRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/stations')
      ]);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      const activeStations = (Array.isArray(stationsRes.data) ? stationsRes.data : [])
        .filter(s => s.status === 'operational' || s.status === 'active')
        .slice(0, 3);
      setNearbyStations(activeStations);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this refueling slot?')) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Refueling booking cancelled successfully');
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel booking';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  // Filter Bookings by tab & search
  const filteredBookings = bookings.filter(b => {
    const status = b.status?.toLowerCase() || '';
    if (activeTab === 'upcoming') {
      if (status !== 'confirmed' && status !== 'in-use' && status !== 'reserved') return false;
    } else if (activeTab === 'completed') {
      if (status !== 'completed') return false;
    } else if (activeTab === 'cancelled') {
      if (status !== 'cancelled' && status !== 'no-show') return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const stationName = b.station?.name?.toLowerCase() || '';
      const nozzle = b.dispenser?.nozzleType?.toLowerCase() || '';
      return stationName.includes(query) || nozzle.includes(query);
    }

    return true;
  });

  // Calculate Metrics
  const upcomingCount = bookings.filter(b => ['confirmed', 'in-use', 'reserved'].includes(b.status?.toLowerCase())).length;
  const completedCount = bookings.filter(b => b.status?.toLowerCase() === 'completed').length;
  const cancelledCount = bookings.filter(b => ['cancelled', 'no-show'].includes(b.status?.toLowerCase())).length;
  const estimatedCO2Saved = (completedCount * 4.8).toFixed(1);

  const getStatusBadge = (status) => {
    const normalized = (status || 'confirmed').toLowerCase();
    if (normalized === 'confirmed' || normalized === 'active' || normalized === 'reserved') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
          Confirmed
        </span>
      );
    }
    if (normalized === 'in-use' || normalized === 'pumping') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Activity size={12} className="animate-pulse" />
          Refueling In Progress
        </span>
      );
    }
    if (normalized === 'completed') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: 'rgba(239, 68, 68, 0.12)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase'
      }}>
        <XCircle size={12} />
        Cancelled
      </span>
    );
  };

  return (
    <div style={{ 
      backgroundColor: '#050505', 
      minHeight: '100vh', 
      color: '#f8fafc', 
      padding: '40px 32px 80px',
      fontFamily: 'var(--font-main, Inter, sans-serif)'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* Back Link Breadcrumb */}
        <Link 
          to="/customer-dashboard" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#94a3b8', 
            textDecoration: 'none', 
            marginBottom: '20px',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'color 0.15s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#38bdf8'}
          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          <ArrowLeft size={16} />
          <span>Back to Operations Dashboard</span>
        </Link>

        {/* Page Hero Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4'
              }}>
                <Calendar size={18} />
              </div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                letterSpacing: '-0.02em', 
                margin: 0,
                color: '#ffffff',
                fontFamily: 'var(--font-display, Space Grotesk, sans-serif)'
              }}>
                My Refueling Bookings
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.92rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Manage your reserved hydrogen dispenser slots, optical check-in QR credentials, and session timeline.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link 
              to="/customer/trip-planner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <Navigation size={15} color="#38bdf8" />
              <span>Trip Planner</span>
            </Link>

            <Link 
              to="/customer/book"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(6, 182, 212, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(6, 182, 212, 0.35)';
              }}
            >
              <Plus size={16} />
              <span>Reserve H₂ Slot</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Stats Dock */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '16px', 
          marginBottom: '28px' 
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Active Slots
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono, monospace)' }}>
                {upcomingCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>confirmed</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Completed Refuels
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono, monospace)' }}>
                {completedCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>sessions</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Avg Fill Speed
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)' }}>
                3.2
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>min @ 700 bar</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Est. CO₂ Offset
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-mono, monospace)' }}>
                {estimatedCO2Saved}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>kg green H₂</span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[
              { id: 'all', label: 'All Bookings', count: bookings.length },
              { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { id: 'completed', label: 'Completed', count: completedCount },
              { id: 'cancelled', label: 'Cancelled', count: cancelledCount }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab.id ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  background: activeTab === tab.id ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  color: activeTab === tab.id ? '#ffffff' : '#64748b'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search station or nozzle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '34px',
                paddingRight: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Content Section: Loading vs Empty State vs Booking Cards */}
        {loading ? (
          <div style={{ 
            padding: '80px 20px', 
            textAlign: 'center', 
            background: 'rgba(15, 23, 42, 0.4)', 
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <Activity size={32} className="animate-spin" color="#06b6d4" style={{ margin: '0 auto 16px auto' }} />
            <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>Syncing telemetry with refueling network...</div>
          </div>
        ) : filteredBookings.length === 0 ? (
          /* Rich, Helpful Enterprise Empty State */
          <div>
            <div style={{
              background: 'radial-gradient(ellipse at top, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.7) 60%)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '20px',
              padding: '56px 32px 48px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
              marginBottom: '36px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                color: '#38bdf8'
              }}>
                <Fuel size={30} />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                {activeTab === 'all' 
                  ? 'No Refueling Bookings Yet' 
                  : `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings`}
              </h2>
              
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                {activeTab === 'all'
                  ? "You haven't reserved any hydrogen dispenser slots yet. Select a nearby high-pressure station to reserve your fast 3-minute fueling slot."
                  : `There are currently no bookings under the ${activeTab} filter. Clear your search or explore active refueling hubs below.`}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  to="/customer/book"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.35)'
                  }}
                >
                  <Fuel size={16} />
                  <span>Reserve Your First Slot</span>
                </Link>

                <Link
                  to="/stations-map"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}
                >
                  <MapPin size={15} color="#38bdf8" />
                  <span>View Live Network Map</span>
                </Link>
              </div>
            </div>

            {/* Quick-Book Recommendation Strip */}
            {nearbyStations.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#06b6d4" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                      Recommended Refueling Hubs Ready Now
                    </span>
                  </div>
                  <Link to="/stations-map" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
                    View all hubs &rarr;
                  </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {nearbyStations.map(station => (
                    <div
                      key={station._id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        transition: 'border-color 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                            {station.name}
                          </h3>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            fontWeight: 600
                          }}>
                            {station.availablePumps || 2} Available
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{station.location?.address || station.address || 'Central Cryogenic Terminal'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Rate: </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            ₹{station.pricePerKg || 75}/kg
                          </span>
                        </div>
                        <Link
                          to={`/customer/book?station=${station._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <span>Book Slot</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Booking Cards Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredBookings.map((b) => {
              const bookingDate = new Date(b.slotTime);
              const isUpcoming = ['confirmed', 'in-use', 'reserved'].includes(b.status?.toLowerCase());

              return (
                <div 
                  key={b._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Subtle top indicator bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: isUpcoming ? 'linear-gradient(90deg, #06b6d4, #10b981)' : 'rgba(255, 255, 255, 0.1)'
                  }} />

                  <div>
                    {/* Header: Station & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontFamily: 'var(--font-mono, monospace)', 
                          color: '#64748b',
                          letterSpacing: '0.04em'
                        }}>
                          ID: #{b._id.slice(-6).toUpperCase()}
                        </span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', margin: '2px 0 0 0' }}>
                          {b.station?.name || 'Aurora Cryogenic Station'}
                        </h3>
                        <Link
                          to="/stations/map"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            marginTop: '3px',
                            textDecoration: 'none'
                          }}
                        >
                          <MapPin size={12} color="#38bdf8" />
                          <span>{b.station?.location?.address || 'View on Map'}</span>
                        </Link>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>

                    {/* Time & Date Strip */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={15} color="#38bdf8" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Slot Time</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={15} color="#34d399" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Date</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dispenser & QR Code Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Assigned Hardware</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                          {b.dispenser?.nozzleType || '700-bar H70 Clean Dispenser'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          Rating: {b.dispenser?.pressureRating || '700 bar (Class 4)'}
                        </div>
                      </div>

                      {/* Interactive QR Code Token Container */}
                      <button
                        type="button"
                        onClick={() => setSelectedQRBooking(b)}
                        title="Click to expand QR for optical scanner"
                        style={{
                          background: '#ffffff',
                          padding: '6px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                        }}
                      >
                        <QRCode
                          value={JSON.stringify({
                            bookingId: b._id,
                            stationId: b.station?._id || b.station,
                            slotTime: b.slotTime
                          })}
                          size={54}
                          level="M"
                        />
                        <span style={{ fontSize: '0.55rem', color: '#0f172a', fontWeight: 700, letterSpacing: '0.04em' }}>
                          CLICK ZOOM
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Dock */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '14px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {b.status === 'pending' && (
                        <Link
                          to={`/checkout/${b._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <CreditCard size={13} />
                          <span>Pay Now</span>
                        </Link>
                      )}

                      {isUpcoming && (
                        <Link
                          to={`/live-pumping/${b.dispenser?._id || b.dispenser}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <Fuel size={13} />
                          <span>Start Fueling</span>
                        </Link>
                      )}


                      <button
                        type="button"
                        onClick={() => setSelectedQRBooking(b)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        <QrCode size={13} />
                        <span>Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceBooking({
                          invoiceNumber: `INV-${b._id?.slice(-6)?.toUpperCase() || 'H2-PAY'}`,
                          date: new Date(b.slotTime || b.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
                          stationName: b.station?.name || 'Aurora Cryogenic Terminal',
                          amount: b.totalPrice || 2450,
                          quantityKg: b.quantity || 3.5,
                          ratePerKg: (b.totalPrice && b.quantity) ? Math.round(b.totalPrice / b.quantity) : 700,
                          paymentMethod: b.paymentMethod || 'Aurora Digital Wallet',
                          transactionId: b.paymentId || b._id,
                          customerName: user?.name || 'Valued Customer',
                          vehicleNo: b.vehicleNumber || 'KA-01-H2-2026'
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38bdf8',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <FileText size={13} />
                        <span>Tax Invoice</span>
                      </button>
                    </div>

                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b._id)}
                        disabled={cancellingId === b._id}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        {cancellingId === b._id ? 'Cancelling...' : 'Cancel Slot'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Fullscreen QR Check-In Modal */}
      {selectedQRBooking && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedQRBooking(null)}
          style={{ zIndex: 9999 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '24px 22px',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="#06b6d4" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                  Dispenser Optical Pass
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedQRBooking(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              display: 'inline-block',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <QRCode
                value={JSON.stringify({
                  bookingId: selectedQRBooking._id,
                  station: selectedQRBooking.station?.name || 'Aurora H2 Hub',
                  slotTime: selectedQRBooking.slotTime,
                  user: user?.name
                })}
                size={180}
                level="H"
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
              Booking Reference
            </div>
            <div style={{ 
              fontSize: '1.05rem', 
              fontWeight: 700, 
              color: '#38bdf8', 
              fontFamily: 'var(--font-mono, monospace)', 
              letterSpacing: '0.05em',
              marginBottom: '14px' 
            }}>
              #{selectedQRBooking._id.slice(-8).toUpperCase()}
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '3px' }}>How to check in:</div>
              1. Drive into the allocated hydrogen bay.<br/>
              2. Point this QR code toward the dispenser scanner.<br/>
              3. Lock 700-bar nozzle when green signal lights flash.
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBooking}
        onClose={() => setSelectedInvoiceBooking(null)}
        data={selectedInvoiceBooking}
      />

    </div>
  );
}
