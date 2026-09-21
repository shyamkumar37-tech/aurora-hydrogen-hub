import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import socket from '../socket';
import { 
  Fuel, 
  Gauge, 
  Users, 
  AlertTriangle, 
  QrCode, 
  Zap, 
  Truck, 
  Power, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Activity,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import InstantQrCheckInModal from '../components/InstantQrCheckInModal';

export default function StaffDashboard() {
  const { selectedStationId, activeStation, activeShift, fetchStationData } = useOutletContext();
  const navigate = useNavigate();

  const [dispensers, setDispensers] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [queueBookings, setQueueBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  
  // Walk-in form state
  const [walkInData, setWalkInData] = useState({
    customerName: '',
    customerEmail: '',
    dispenserId: '',
    quantityDispensed: '5.0',
    cost: '75.00'
  });

  const fetchDashboardData = async () => {
    if (!selectedStationId) return;
    try {
      const [dispRes, invRes, bookRes] = await Promise.allSettled([
        api.get(`/dispensers/station/${selectedStationId}`),
        api.get('/inventory'),
        api.get('/bookings/all')
      ]);

      if (dispRes.status === 'fulfilled') {
        setDispensers(dispRes.value.data);
        if (dispRes.value.data.length > 0 && !walkInData.dispenserId) {
          setWalkInData(prev => ({ ...prev, dispenserId: dispRes.value.data[0]._id }));
        }
      }

      if (invRes.status === 'fulfilled') {
        const stationInv = invRes.value.data.find(i => i.station?._id === selectedStationId || i.station === selectedStationId);
        setInventory(stationInv || null);
      }

      if (bookRes.status === 'fulfilled') {
        const stationQueue = bookRes.value.data.filter(b => 
          (b.station?._id === selectedStationId || b.station === selectedStationId) &&
          (b.status === 'pending' || b.status === 'confirmed')
        );
        setQueueBookings(stationQueue);
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStationId]);

  // Sockets for real-time dispenser & queue updates
  useEffect(() => {
    const handleDispenserUpdate = () => fetchDashboardData();
    const handleInventoryUpdate = () => fetchDashboardData();
    const handleBookingUpdate = () => fetchDashboardData();

    socket.on('dispenser_status_changed', handleDispenserUpdate);
    socket.on('inventoryUpdated', handleInventoryUpdate);
    socket.on('booking_updated', handleBookingUpdate);

    return () => {
      socket.off('dispenser_status_changed', handleDispenserUpdate);
      socket.off('inventoryUpdated', handleInventoryUpdate);
      socket.off('booking_updated', handleBookingUpdate);
    };
  }, [selectedStationId]);

  // QR Code Quick Check-in
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    try {
      const { data } = await api.post('/bookings/checkin-qr', { code: qrCodeInput.trim() });
      toast.success(data.message || 'QR Check-In Verified! Dispenser armed.');
      setQrCodeInput('');
      setQrModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'QR Verification failed');
    }
  };

  // Walk-in Refueling Submit
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/bookings/walk-in', {
        stationId: selectedStationId,
        dispenserId: walkInData.dispenserId,
        customerName: walkInData.customerName,
        customerEmail: walkInData.customerEmail,
        quantityDispensed: Number(walkInData.quantityDispensed),
        cost: Number(walkInData.cost)
      });
      toast.success(data.message || 'Walk-in fueling session completed!');
      setWalkInModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Walk-in session failed');
    }
  };

  // Emergency Stop Trigger
  const handleEmergencyStopToggle = async () => {
    const confirmAction = window.confirm(
      activeStation?.emergencyStop 
        ? 'Are you sure you want to DEACTIVATE Emergency Stop and restore station dispensers?' 
        : '⚠️ CRITICAL: Activate Station Emergency Stop? All pumps will immediately lock offline!'
    );

    if (!confirmAction) return;

    try {
      const { data } = await api.post(`/stations/${selectedStationId}/emergency-stop`);
      toast.success(data.message);
      fetchStationData();
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle emergency stop');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

      {/* Hero Station Cockpit Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '24px 28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '18px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              LIVE STATION COCKPIT
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Station ID: {selectedStationId?.slice(-6).toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#f8fafc', margin: 0 }}>
            {activeStation?.name || 'Hydrogen Refueling Terminal'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            {activeStation?.location?.address || 'Operating 700 Bar & 350 Bar Ultra-Fast Cryogenic Pumps'}
          </p>
        </div>

        {/* Quick Launcher Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <button
            onClick={() => setQrModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
              fontSize: '0.875rem'
            }}
          >
            <QrCode size={18} />
            <span>Scan QR Check-In</span>
          </button>

          <button
            onClick={() => setWalkInModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <Zap size={18} />
            <span>Walk-In Refueling</span>
          </button>

          <button
            onClick={handleEmergencyStopToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: activeStation?.emergencyStop ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: activeStation?.emergencyStop ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 0 16px rgba(239, 68, 68, 0.4)',
              fontSize: '0.875rem'
            }}
          >
            <Power size={18} />
            <span>{activeStation?.emergencyStop ? 'RESET E-STOP' : 'E-STOP'}</span>
          </button>

        </div>
      </div>

      {/* Real-time Telemetry Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        {/* H2 Storage Stock */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>H₂ Tank Storage</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fuel size={18} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: inventory?.isLowStock ? '#ef4444' : '#38bdf8' }}>
            {inventory ? `${inventory.currentStock} kg` : 'Loading...'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Reserve Threshold: {inventory?.threshold || 100} kg</span>
            <span style={{ color: inventory?.isLowStock ? '#ef4444' : '#34d399', fontWeight: '700' }}>
              {inventory?.isLowStock ? 'LOW LEVEL ⚠️' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Current Station Pressure */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Terminal Pressure</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#34d399' }}>
            {activeStation?.currentPressureBar || 700} <span style={{ fontSize: '1rem', fontWeight: '600' }}>BAR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Target: 700 Bar H70 Standard</span>
            <span style={{ color: '#34d399', fontWeight: '700' }}>PRESSURIZED</span>
          </div>
        </div>

        {/* Queue & Pending Bookings */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Active Vehicle Queue</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#fbbf24' }}>
            {queueBookings.length} <span style={{ fontSize: '1rem', fontWeight: '600' }}>Vehicles</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Est. Wait Time: ~{queueBookings.length * 7} mins</span>
            <Link to="/staff/bookings" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>View Queue →</Link>
          </div>
        </div>

        {/* Station Operating Status */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Terminal Status</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: activeStation?.emergencyStop ? '#ef4444' : '#38bdf8', textTransform: 'capitalize' }}>
            {activeStation?.emergencyStop ? 'E-STOP HALT' : (activeStation?.status || 'Operational')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Dispensers: {dispensers.length} active</span>
            <Link to="/staff/maintenance" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>Controls →</Link>
          </div>
        </div>

      </div>

      {/* Main Operational Split Grid: Live Dispensers + Incoming Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Dispensers Status Grid */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Dispensers & Nozzles</h2>
            </div>
            <Link to="/staff/maintenance" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
              Manage All →
            </Link>
          </div>

          {dispensers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
              No dispensers registered for this terminal.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dispensers.map((disp, idx) => (
                <div
                  key={disp._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: disp.status === 'available' ? 'rgba(16, 185, 129, 0.15)' : disp.status === 'in-use' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      color: disp.status === 'available' ? '#34d399' : disp.status === 'in-use' ? '#38bdf8' : '#f87171'
                    }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.95rem' }}>
                        Nozzle: {disp.nozzleType}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Rating: {disp.pressureRating || 700} Bar • Flow Rate: 1.8 kg/min
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: disp.status === 'available' ? 'rgba(16, 185, 129, 0.15)' : disp.status === 'in-use' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: disp.status === 'available' ? '#34d399' : disp.status === 'in-use' ? '#38bdf8' : '#f87171',
                    border: disp.status === 'available' ? '1px solid rgba(16, 185, 129, 0.3)' : disp.status === 'in-use' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {disp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Queue & Quick Check-In List */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#fbbf24" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Incoming Vehicle Queue</h2>
            </div>
            <Link to="/staff/bookings" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
              Full Queue ({queueBookings.length}) →
            </Link>
          </div>

          {queueBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
              No incoming vehicles currently in queue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {queueBookings.slice(0, 4).map((b) => (
                <div
                  key={b._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.95rem' }}>
                      {b.user?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Time: {new Date(b.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Dispenser: {b.dispenser?.nozzleType || 'Standard'}
                    </div>
                  </div>

                  <Link
                    to="/staff/bookings"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Process</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* QR SCANNER MODAL */}
      {/* ======================================================== */}
      <InstantQrCheckInModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
        queueBookings={queueBookings}
        stationName={activeStation?.name || 'Hydrogen Hub'}
      />

      {/* ======================================================== */}
      {/* WALK-IN REFUELING MODAL */}
      {/* ======================================================== */}
      {walkInModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <button
              onClick={() => setWalkInModalOpen(false)}
              style={{
                position: 'absolute',
                right: '18px',
                top: '18px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Zap size={24} color="#38bdf8" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Walk-In Dispensing Session
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Directly dispense fuel for an unreserved arrival, recording instant transaction & inventory deduction.
            </p>

            <form onSubmit={handleWalkInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Customer / Driver Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={walkInData.customerName}
                  onChange={(e) => setWalkInData({ ...walkInData, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Select Dispenser
                </label>
                <select
                  value={walkInData.dispenserId}
                  onChange={(e) => setWalkInData({ ...walkInData, dispenserId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                >
                  {dispensers.map((d, i) => (
                    <option key={d._id} value={d._id}>
                      Dispenser #{i + 1} - {d.nozzleType} ({d.pressureRating || 700} Bar)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={walkInData.quantityDispensed}
                    onChange={(e) => setWalkInData({ ...walkInData, quantityDispensed: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                    Total Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={walkInData.cost}
                    onChange={(e) => setWalkInData({ ...walkInData, cost: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Record & Dispense
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
