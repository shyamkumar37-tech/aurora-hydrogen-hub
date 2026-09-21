import { useState, useEffect, useContext } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import socket from '../socket';
import { 
  Activity, 
  Layers, 
  Calendar, 
  Wrench, 
  FileText, 
  AlertTriangle, 
  Power, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  LogOut, 
  CheckCircle2, 
  ChevronDown,
  Fuel,
  Radio
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(
    localStorage.getItem('staff_active_station') || user?.stationId || ''
  );
  const [activeStation, setActiveStation] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [shiftTimer, setShiftTimer] = useState('00:00:00');
  const [eStopActive, setEStopActive] = useState(false);

  // Fetch stations list
  const fetchStations = async () => {
    try {
      const { data } = await api.get('/stations');
      setStations(data);
      if (!selectedStationId && data.length > 0) {
        const initialId = data[0]._id;
        setSelectedStationId(initialId);
        localStorage.setItem('staff_active_station', initialId);
      }
    } catch (err) {
      console.error('Failed to load stations', err);
    }
  };

  // Fetch active station details and active shift
  const fetchStationData = async () => {
    if (!selectedStationId) return;
    try {
      const [stationRes, shiftRes] = await Promise.allSettled([
        api.get(`/stations/${selectedStationId}`),
        api.get(`/stations/${selectedStationId}/shifts/status`)
      ]);

      if (stationRes.status === 'fulfilled') {
        setActiveStation(stationRes.value.data);
        setEStopActive(stationRes.value.data.emergencyStop || false);
      }
      if (shiftRes.status === 'fulfilled') {
        setActiveShift(shiftRes.value.data.activeShift);
      }
    } catch (err) {
      console.error('Error fetching staff station data', err);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationData();
      localStorage.setItem('staff_active_station', selectedStationId);
    }
  }, [selectedStationId]);

  // Live Shift Timer ticker
  useEffect(() => {
    if (!activeShift?.shiftStart) {
      setShiftTimer('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(activeShift.shiftStart).getTime();
      const diff = Math.max(0, Date.now() - start);
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setShiftTimer(`${hours}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  // Socket listener for emergency stops & inventory updates
  useEffect(() => {
    const handleEStop = (data) => {
      if (data.stationId === selectedStationId) {
        setEStopActive(data.emergencyStop);
        if (data.emergencyStop) {
          toast.error(`⚠️ EMERGENCY STOP TRIGGERED by ${data.triggeredBy || 'Operator'}!`, { duration: 6000 });
        } else {
          toast.success('Emergency stop deactivated. Station restored.');
        }
        fetchStationData();
      }
    };

    socket.on('emergencyStopToggled', handleEStop);
    return () => {
      socket.off('emergencyStopToggled', handleEStop);
    };
  }, [selectedStationId]);

  // Toggle Shift Start/End
  const handleShiftToggle = async () => {
    if (!selectedStationId) {
      toast.error('Please select a station first');
      return;
    }

    if (!activeShift) {
      // Start shift
      try {
        const { data } = await api.post(`/stations/${selectedStationId}/shifts/start`);
        setActiveShift(data.shift);
        toast.success('Shift started! Safety inspection pending.');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start shift');
      }
    } else {
      // Direct user to Shift Handover page to finish with report
      navigate('/staff/shift-report');
      toast('Complete shift handover notes to end duty.', { icon: '📋' });
    }
  };

  const navItems = [
    { label: 'Live Cockpit', path: '/staff-dashboard', icon: Activity },
    { label: 'Bookings & Queue', path: '/staff/bookings', icon: Calendar },
    { label: 'H2 Tanker Logistics', path: '/staff/inventory', icon: Fuel },
    { label: 'Maintenance & E-Stop', path: '/staff/maintenance', icon: Wrench },
    { label: 'Shift Handover & Audit', path: '/staff/shift-report', icon: FileText },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #0b0f19)', color: 'var(--text-main, #f3f4f6)' }}>
      
      {/* Top Emergency Alert Banner if E-Stop is active */}
      {eStopActive && (
        <div style={{
          background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: '700',
          letterSpacing: '0.04em',
          boxShadow: '0 4px 20px rgba(220, 38, 38, 0.5)',
          zIndex: 1000,
          position: 'sticky',
          top: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={22} className="animate-pulse" />
            <span>EMERGENCY STOP ACTIVE — All station hydrogen dispensers are locked in SAFE OFFLINE mode.</span>
          </div>
          <NavLink 
            to="/staff/maintenance" 
            style={{ 
              background: '#ffffff', 
              color: '#dc2626', 
              padding: '4px 12px', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              fontSize: '0.85rem' 
            }}
          >
            Override & Restore
          </NavLink>
        </div>
      )}

      {/* Staff Master Header & Navbar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: eStopActive ? '46px' : 0,
        zIndex: 900
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '12px 24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Logo & Station Scoping Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
                }}>
                  <Radio size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '800', fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', color: '#38bdf8' }}>H₂ AURORA</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>STAFF PORTAL</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Station Operations Console</span>
                </div>
              </div>

              {/* Station Scope Selector */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={16} color="#38bdf8" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
                  <select 
                    value={selectedStationId} 
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 36px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      appearance: 'none',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {stations.map(st => (
                      <option key={st._id} value={st._id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                        {st.name} {st.status === 'operational' ? '🟢' : '🟡'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* Operator Duty Badge, Shift Timer & Quick Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              
              {/* Duty Toggle Pill */}
              <button
                onClick={handleShiftToggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  background: activeShift ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: activeShift ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                  color: activeShift ? '#34d399' : '#f87171',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={activeShift ? "Click to go to shift handover" : "Click to clock in"}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeShift ? '#10b981' : '#ef4444',
                  boxShadow: activeShift ? '0 0 8px #10b981' : 'none'
                }}></div>
                <span>{activeShift ? 'ON DUTY' : 'OFF DUTY'}</span>
                {activeShift && (
                  <span style={{ color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px', fontFamily: 'monospace' }}>
                    {shiftTimer}
                  </span>
                )}
              </button>

              {/* Safety Checklist indicator */}
              {activeShift && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: activeShift.safetyChecklistPassed ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: activeShift.safetyChecklistPassed ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  color: activeShift.safetyChecklistPassed ? '#38bdf8' : '#fbbf24',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  <ShieldCheck size={14} />
                  <span>{activeShift.safetyChecklistPassed ? 'Safety Inspected' : 'Inspection Due'}</span>
                </div>
              )}

              {/* User badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '14px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  {user?.name?.charAt(0) || 'S'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f1f5f9' }}>{user?.name || 'Operator'}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Station Staff</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '6px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    marginLeft: '6px'
                  }}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>

            </div>

          </div>

          {/* Navigation Bar Tabs */}
          <nav style={{
            display: 'flex',
            gap: '8px',
            marginTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '10px',
            overflowX: 'auto'
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#38bdf8' : '#94a3b8',
                    background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

        </div>
      </header>

      {/* Main Outlet Context Provider */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 60px 20px' }}>
        <Outlet context={{ selectedStationId, activeStation, activeShift, fetchStationData }} />
      </main>

    </div>
  );
}
