import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/api';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, CheckCircle, Clock, Fuel, ArrowRight, QrCode, Fingerprint } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import QRCode from 'react-qr-code';
import PasskeyScannerModal from '../components/PasskeyScannerModal';

export default function CustomerBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedStationId = searchParams.get('station');

  const [stations, setStations] = useState([]);
  const [dispensers, setDispensers] = useState([]);
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedDispenser, setSelectedDispenser] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data } = await api.get('/stations');
        const activeStations = data.filter(s => s.status === 'active' || s.status === 'operational');
        setStations(activeStations);
        
        if (preSelectedStationId) {
          const match = activeStations.find(s => s._id === preSelectedStationId);
          if (match) setSelectedStation(match);
        } else if (activeStations.length > 0) {
          setSelectedStation(activeStations[0]);
        }
      } catch (err) {
        toast.error('Failed to load stations');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchStations();
  }, [preSelectedStationId]);

  const fetchDispensers = async () => {
    if (!selectedStation) return;
    try {
      const { data } = await api.get(`/dispensers?station=${selectedStation._id}`);
      setDispensers(data);
      if (data.length > 0) {
        // Find first available
        const firstAvailable = data.find(d => d.status === 'available');
        setSelectedDispenser(firstAvailable || data[0]);
      }
    } catch (err) {
      console.error('Failed to load dispensers', err);
    }
  };

  useEffect(() => {
    fetchDispensers();
  }, [selectedStation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStation || !selectedTime || !selectedDispenser) {
      toast.error('Please complete all fields');
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(':');
      const slotDate = new Date();
      if (selectedDate === 'Tomorrow') {
        slotDate.setDate(slotDate.getDate() + 1);
      }
      slotDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const res = await api.post('/bookings', {
        station: selectedStation._id,
        dispenser: selectedDispenser._id,
        slotTime: slotDate.toISOString(),
      });
      
      toast.success('Booking confirmed successfully!');
      
      // Update local station available pumps count to satisfy consistency rule
      selectedStation.availablePumps = Math.max(0, (selectedStation.availablePumps || 0) - 1);
      
      // Transition to Confirmed State
      setConfirmedBooking(res.data);
      
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Booking failed.');
      // If conflict (pump already taken), refresh dispensers
      if (error.response?.status === 409) {
        fetchDispensers();
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', background: '#050505', minHeight: '100vh' }}>
        <Skeleton height="300px" borderRadius="12px" />
      </div>
    );
  }

  // Cost calculation based on user's mockup: ~7kg dispensed per 15 min at ₹82/kg
  const pricePerKg = selectedStation?.pricePerKg || selectedStation?.hydrogenPrice || 82;
  const estimatedCost = 7 * pricePerKg; // Fixed 15min / 7kg estimate for demo

  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];

  // SUCCESS STATE (QR CODE VIEW)
  if (confirmedBooking) {
    const bookingObj = confirmedBooking.booking || confirmedBooking;
    const displayId = `HYD-${(bookingObj._id || '').slice(-5).toUpperCase()}`;
    const slotDate = new Date(bookingObj.slotTime);
       return (
      <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'var(--text-main)', padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          
          <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 8px 0' }}>Booking Confirmed</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Your slot has been reserved successfully.</p>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>Station</div>
                <div style={{ fontSize: '1.125rem' }}>{selectedStation.name}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>Date & Time</div>
                  <div style={{ fontSize: '1.125rem' }}>{selectedDate} · {selectedTime}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>Pump</div>
                  <div style={{ fontSize: '1.125rem' }}>{selectedDispenser?.nozzleType || 'P01'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>Estimated Fueling</div>
                  <div style={{ fontSize: '1.125rem' }}>~7 minutes</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>Price</div>
                  <div style={{ fontSize: '1.125rem' }}>₹{pricePerKg}/kg</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <QRCode value={displayId} size={160} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>Booking ID</div>
              <div style={{ fontSize: '1.25rem', letterSpacing: '0.1em' }}>{displayId}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '12px' }}>Show this QR code at the station to begin fueling.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to={`/checkout/${bookingObj._id}`} className="btn btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', fontSize: '1rem', background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' }}>
                PROCEED TO 1-TAP CHECKOUT
              </Link>
              <Link to="/customer-dashboard" className="btn btn-outline" style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', fontSize: '0.9rem' }}>
                RETURN TO DASHBOARD
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // BOOKING FORM STATE
  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'var(--text-main)', padding: '48px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            color: 'var(--text-muted)', 
            marginBottom: '32px', 
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back
        </button>

        <h1 style={{ fontSize: '2.5rem', fontWeight: '400', letterSpacing: '-0.02em', margin: '0 0 32px 0' }}>
          Schedule Refueling
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Station Selection */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '400', marginBottom: '16px' }}>1. Station</h3>
            <select 
              value={selectedStation?._id || ''} 
              onChange={(e) => setSelectedStation(stations.find(s => s._id === e.target.value))}
              style={{ 
                width: '100%',
                background: '#0A0A0B', 
                color: 'var(--text-main)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '16px',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({(s.availablePumps || 0)} pumps available)</option>)}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '400', marginBottom: '16px' }}>2. Date</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Today', 'Tomorrow'].map(date => (
                <div 
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedDate === date ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedDate === date ? 'rgba(0, 240, 255, 0.05)' : '#0A0A0B',
                    color: selectedDate === date ? 'var(--accent-cyan)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  {date}
                </div>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '400', marginBottom: '16px' }}>3. Time Slot</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
              {timeSlots.map(time => (
                <div 
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedTime === time ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedTime === time ? 'rgba(0, 240, 255, 0.05)' : '#0A0A0B',
                    color: selectedTime === time ? 'var(--accent-cyan)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
          
          {/* Pump Selection */}
          {dispensers.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '400', marginBottom: '16px' }}>4. Pump (Dispenser)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {dispensers.map((disp, i) => {
                  const isAvailable = disp.status === 'available';
                  const isSelected = selectedDispenser?._id === disp._id;
                  
                  return (
                    <div 
                      key={disp._id}
                      onClick={() => isAvailable && setSelectedDispenser(disp)}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: `1px solid ${isSelected ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)'}`,
                        background: isSelected ? 'rgba(16, 185, 129, 0.05)' : '#0A0A0B',
                        color: isAvailable ? 'var(--text-main)' : 'var(--text-muted)',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        opacity: isAvailable ? 1 : 0.6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Fuel size={20} color={isSelected ? 'var(--accent-emerald)' : isAvailable ? 'var(--text-main)' : 'var(--text-muted)'} />
                        <div>
                          <div style={{ fontWeight: '500' }}>Pump {String(i+1).padStart(2, '0')} · {disp.nozzleType}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: isAvailable ? 'var(--accent-emerald)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {disp.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review */}
          <div className="premium-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '400', margin: '0 0 16px 0' }}>Review</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Fueling</span>
              <span>~7 minutes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Price per kg</span>
              <span>₹{pricePerKg}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.125rem' }}>Estimated Total</span>
              <span style={{ fontSize: '1.5rem', color: 'var(--accent-cyan)' }}>₹{estimatedCost}</span>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading || !selectedDispenser}
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '18px', 
              fontSize: '1.05rem', 
              letterSpacing: '0.08em', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              opacity: loading || !selectedDispenser ? 0.7 : 1
            }}
          >
            {loading ? 'CONFIRMING...' : 'CONFIRM BOOKING'}
          </button>

          {/* 1-Touch Passkey Biometric Confirm Button */}
          <button
            type="button"
            disabled={loading || !selectedDispenser}
            onClick={() => {
              if (!selectedStation || !selectedDispenser) {
                toast.error('Please select station and dispenser pump');
                return;
              }
              setShowBiometricModal(true);
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(59, 130, 246, 0.14) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.45)',
              borderRadius: '8px',
              color: '#22d3ee',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              cursor: loading || !selectedDispenser ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.15)',
              transition: 'all 0.2s',
              opacity: loading || !selectedDispenser ? 0.6 : 1
            }}
          >
            <Fingerprint size={20} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 5px #22d3ee)' }} />
            <span>1-TOUCH BIOMETRIC PASSKEY CONFIRM</span>
          </button>
        </form>
      </div>

      {/* Biometric Passkey Confirmation Modal */}
      <PasskeyScannerModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        mode="authorize"
        actionTitle="Authorize Refueling Reservation"
        onSuccess={() => {
          handleSubmit({ preventDefault: () => {} });
        }}
      />
    </div>
  );
}

