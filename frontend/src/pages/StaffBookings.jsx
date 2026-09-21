import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/api';
import socket from '../socket';
import { 
  CalendarCheck, 
  ChevronDown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  QrCode, 
  RefreshCw, 
  Shuffle, 
  Search,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import InstantQrCheckInModal from '../components/InstantQrCheckInModal';

export default function StaffBookings() {
  const { selectedStationId, activeStation } = useOutletContext();

  const [bookings, setBookings] = useState([]);
  const [dispensers, setDispensers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Completion modal state
  const [completingBooking, setCompletingBooking] = useState(null);
  const [quantity, setQuantity] = useState('5.0');
  const [cost, setCost] = useState('75.00');

  // Reassign modal state
  const [reassignBooking, setReassignBooking] = useState(null);
  const [targetDispenserId, setTargetDispenserId] = useState('');

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');

  const fetchBookingsAndDispensers = async () => {
    setLoading(true);
    try {
      const [bookRes, dispRes] = await Promise.allSettled([
        api.get(statusFilter ? `/bookings/all?status=${statusFilter}` : '/bookings/all'),
        selectedStationId ? api.get(`/dispensers/station/${selectedStationId}`) : Promise.resolve({ data: [] })
      ]);

      if (bookRes.status === 'fulfilled') {
        // Filter by station if station is selected
        let data = bookRes.value.data;
        if (selectedStationId) {
          data = data.filter(b => b.station?._id === selectedStationId || b.station === selectedStationId);
        }
        setBookings(data);
      }

      if (dispRes.status === 'fulfilled') {
        setDispensers(dispRes.value.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndDispensers();
  }, [selectedStationId, statusFilter]);

  useEffect(() => {
    const handleUpdate = () => fetchBookingsAndDispensers();
    socket.on('booking_updated', handleUpdate);
    socket.on('dispenser_status_changed', handleUpdate);

    return () => {
      socket.off('booking_updated', handleUpdate);
      socket.off('dispenser_status_changed', handleUpdate);
    };
  }, [selectedStationId]);

  // Handle direct Check-In
  const handleCheckIn = async (bookingId) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/checkin`);
      toast.success(data.message || 'Customer checked in and dispenser armed!');
      fetchBookingsAndDispensers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in');
    }
  };

  // QR Submit
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/bookings/checkin-qr', { code: qrCodeInput.trim() });
      toast.success(data.message || 'QR Check-in Verified!');
      setQrCodeInput('');
      setQrModalOpen(false);
      fetchBookingsAndDispensers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'QR Verification failed');
    }
  };

  // Status Change
  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'completed') {
      const b = bookings.find(item => item._id === id);
      setCompletingBooking(b);
      const price = activeStation?.pricePerKg || 15;
      setQuantity('5.0');
      setCost((5.0 * price).toFixed(2));
      return;
    }
    
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      toast.success(`Booking marked as ${newStatus}`);
      fetchBookingsAndDispensers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Complete Transaction
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingBooking) return;

    try {
      await api.post('/transactions/complete', {
        bookingId: completingBooking._id,
        quantityDispensed: quantity,
        cost
      });
      toast.success('Transaction recorded & inventory updated!');
      setCompletingBooking(null);
      fetchBookingsAndDispensers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete booking');
    }
  };

  // Reassign Dispenser
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignBooking || !targetDispenserId) return;

    try {
      await api.put(`/bookings/${reassignBooking._id}/reassign-dispenser`, {
        newDispenserId: targetDispenserId
      });
      toast.success('Dispenser reassigned successfully!');
      setReassignBooking(null);
      fetchBookingsAndDispensers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign dispenser');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.user?.name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b._id.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: '700' }}>Completed</span>;
      case 'cancelled': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.75rem', fontWeight: '700' }}>Cancelled</span>;
      case 'no-show': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', fontSize: '0.75rem', fontWeight: '700' }}>No-Show</span>;
      case 'pending': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: '700' }}>Pending</span>;
      case 'confirmed': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '700' }}>Confirmed / Armed</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: '#f3f4f6', fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#f8fafc', margin: 0 }}>
            Live Queue & Booking Verification
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Station: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{activeStation?.name || 'Selected Station'}</span> • Real-Time Pump Assignment
          </p>
        </div>

        <button
          onClick={() => setQrModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.875rem',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
          }}
        >
          <QrCode size={18} />
          <span>Quick QR Check-In</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '16px 20px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search customer name, email, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed / Armed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
          </select>
        </div>

      </div>

      {/* Bookings Table Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '14px 18px' }}>Customer</th>
                <th style={{ padding: '14px 18px' }}>Dispenser & Nozzle</th>
                <th style={{ padding: '14px 18px' }}>Scheduled Slot</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions & Controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <CalendarCheck size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No bookings found for the selected filter.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    
                    {/* Customer Info */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', color: '#f8fafc' }}>{b.user?.name || 'Walk-in Driver'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.user?.email || 'N/A'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {b._id.slice(-6).toUpperCase()}</div>
                    </td>

                    {/* Dispenser & Nozzle */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#38bdf8' }}>{b.dispenser?.nozzleType || '700 bar'}</span>
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              setReassignBooking(b);
                              setTargetDispenserId(b.dispenser?._id || '');
                            }}
                            title="Reassign to another dispenser"
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              color: '#38bdf8',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Shuffle size={10} />
                            <span>Switch</span>
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.station?.name || activeStation?.name}</div>
                    </td>

                    {/* Scheduled Slot */}
                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                      {new Date(b.slotTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      <span style={{ fontWeight: '700', color: '#f8fafc' }}>
                        {new Date(b.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px' }}>
                      {getStatusBadge(b.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        
                        {/* Quick Checkin button if pending */}
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleCheckIn(b._id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                              border: 'none',
                              color: '#fff',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Arm Pump
                          </button>
                        )}

                        {/* Complete Dispense button */}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => {
                              setCompletingBooking(b);
                              const price = activeStation?.pricePerKg || 15;
                              setQuantity('5.0');
                              setCost((5.0 * price).toFixed(2));
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              color: '#fff',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Finalize Session
                          </button>
                        )}

                        {/* Status dropdown for manual overrides */}
                        {b.status !== 'completed' && b.status !== 'cancelled' && (
                          <select
                            value={b.status}
                            onChange={(e) => handleStatusChange(b._id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              background: '#1e293b',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '8px',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Complete...</option>
                            <option value="cancelled">Cancel</option>
                            <option value="no-show">No-Show</option>
                          </select>
                        )}

                        {(b.status === 'completed' || b.status === 'cancelled') && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Archived</span>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COMPLETE BOOKING TRANSACTION MODAL */}
      {/* ======================================================== */}
      {completingBooking && (
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
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setCompletingBooking(null)}
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
              <CheckCircle2 size={24} color="#10b981" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Complete Dispense Session
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Customer: <strong style={{ color: '#f8fafc' }}>{completingBooking.user?.name}</strong> • Record dispensed H2 amount.
            </p>

            <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Quantity Dispensed (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val);
                    const price = activeStation?.pricePerKg || 15;
                    setCost((Number(val) * price).toFixed(2));
                  }}
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
                  Total Fuel Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Record Payment & Finish
                </button>
                <button
                  type="button"
                  onClick={() => setCompletingBooking(null)}
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

      {/* ======================================================== */}
      {/* REASSIGN DISPENSER MODAL */}
      {/* ======================================================== */}
      {reassignBooking && (
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
            maxWidth: '460px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setReassignBooking(null)}
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
              <Shuffle size={24} color="#38bdf8" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Reassign Dispenser Nozzle
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Shift customer <strong style={{ color: '#f8fafc' }}>{reassignBooking.user?.name}</strong> to an available pump if the current nozzle is busy or undergoing maintenance.
            </p>

            <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Target Dispenser
                </label>
                <select
                  value={targetDispenserId}
                  onChange={(e) => setTargetDispenserId(e.target.value)}
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
                    <option key={d._id} value={d._id} disabled={d.status === 'maintenance' || d.status === 'offline'}>
                      Dispenser #{i + 1} - {d.nozzleType} ({d.status})
                    </option>
                  ))}
                </select>
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
                  Confirm Reassignment
                </button>
                <button
                  type="button"
                  onClick={() => setReassignBooking(null)}
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

      {/* ======================================================== */}
      {/* INSTANT QR CHECK-IN MODAL */}
      {/* ======================================================== */}
      <InstantQrCheckInModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSuccess={() => {
          fetchBookingsAndDispensers();
        }}
        queueBookings={bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')}
        stationName={activeStation?.name || 'Hydrogen Hub'}
      />

    </div>
  );
}
