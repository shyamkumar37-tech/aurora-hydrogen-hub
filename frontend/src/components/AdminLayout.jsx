import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import api from '../api/api';
import { 
  Fuel, 
  Package, 
  CalendarCheck, 
  Wrench, 
  BarChart3, 
  LogOut, 
  Users, 
  Tag, 
  Map, 
  LifeBuoy, 
  MapPin, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import './admin-theme.css';

const AdminLayout = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(
    localStorage.getItem('admin_active_station') || ''
  );
  const [activeStation, setActiveStation] = useState(null);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchStations = async () => {
    try {
      const { data } = await api.get('/stations');
      setStations(data);
      if (data.length > 0) {
        const initialId = selectedStationId && data.some(s => s._id === selectedStationId)
          ? selectedStationId
          : data[0]._id;
        setSelectedStationId(initialId);
        localStorage.setItem('admin_active_station', initialId);
      }
    } catch (err) {
      console.error('Failed to load stations in AdminLayout', err);
    }
  };

  const fetchStationData = async () => {
    if (!selectedStationId) return;
    try {
      const res = await api.get(`/stations/${selectedStationId}`);
      setActiveStation(res.data);
    } catch (err) {
      console.error('Error fetching admin station data', err);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationData();
      localStorage.setItem('admin_active_station', selectedStationId);
    }
  }, [selectedStationId]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isStationScopedPage = ['/admin/inventory', '/admin/bookings', '/admin/maintenance'].some(p => location.pathname.startsWith(p));

  return (
    <div className="admin-layout" data-theme="admin">
      {/* Mobile Top Header */}
      <header className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            className="admin-mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: '#818cf8', letterSpacing: '-0.02em' }}>
              AURORA ADMIN
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {activeStation?.name || 'Operations Central'}
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      <div 
        className={`admin-drawer-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`glass-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Station</h2>
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: mobileMenuOpen ? 'flex' : 'none'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink end to="/admin-dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/stations" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Fuel size={20} />
            <span>Manage Stations</span>
          </NavLink>
          
          <NavLink to="/admin/inventory" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Package size={20} />
            <span>Manage Inventory</span>
          </NavLink>
          
          <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <CalendarCheck size={20} />
            <span>Manage Bookings</span>
          </NavLink>
          
          <NavLink to="/admin/maintenance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Wrench size={20} />
            <span>Manage Maintenance</span>
          </NavLink>
          
          <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <BarChart3 size={20} />
            <span>Analytics Dashboard</span>
          </NavLink>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }}></div>

          <NavLink to="/admin/staff-customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users size={20} />
            <span>Staff & Customers</span>
          </NavLink>

          <NavLink to="/admin/pricing" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Tag size={20} />
            <span>Pricing & Promos</span>
          </NavLink>

          <NavLink to="/admin/operations-map" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Map size={20} />
            <span>Operations Map</span>
          </NavLink>

          <NavLink to="/admin/support" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LifeBuoy size={20} />
            <span>Support Desk</span>
          </NavLink>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {isStationScopedPage && stations.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.875rem' }}>
              <MapPin size={16} color="#38bdf8" />
              <span>Target Station Scope:</span>
            </div>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <select 
                value={selectedStationId} 
                onChange={(e) => setSelectedStationId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 14px',
                  background: '#0f172a',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {stations.map(st => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.status || 'active'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <Outlet context={{ selectedStationId, activeStation, fetchStationData, stations, setSelectedStationId }} />
      </main>
    </div>
  );
};

export default AdminLayout;
