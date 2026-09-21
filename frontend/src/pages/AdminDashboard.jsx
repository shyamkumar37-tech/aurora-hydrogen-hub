import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Fuel, 
  Package, 
  CalendarCheck, 
  Wrench, 
  BarChart3,
  Activity,
  Clock,
  Search,
  Bell,
  Zap,
  TrendingUp,
  Truck,
  Users,
  Terminal,
  ShieldCheck,
  Leaf
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

import SCADAControlMatrix from '../components/admin/SCADAControlMatrix';
import DynamicTariffEngine from '../components/admin/DynamicTariffEngine';
import SupplyChainLogistics from '../components/admin/SupplyChainLogistics';
import UserRoleManager from '../components/admin/UserRoleManager';
import AuditForensicsViewer from '../components/admin/AuditForensicsViewer';
import PredictiveMaintenanceHub from '../components/admin/PredictiveMaintenanceHub';
import ESGRevenueForecasting from '../components/admin/ESGRevenueForecasting';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);

  // 7 Enterprise Admin Feature Modal States
  const [showSCADA, setShowSCADA] = useState(false);
  const [showTariffs, setShowTariffs] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  const [showUserRoles, setShowUserRoles] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showPredictiveAI, setShowPredictiveAI] = useState(false);
  const [showESGForecast, setShowESGForecast] = useState(false);


  // Dynamic activity trend data calculated from bookings
  const trendData = (bookings && bookings.length > 0)
    ? bookings.slice(-7).map((b, idx) => ({ uv: Number(b.dispensedAmount || b.totalAmount || (idx + 1) * 35) }))
    : [{ uv: 30 }, { uv: 45 }, { uv: 60 }, { uv: 75 }, { uv: 80 }, { uv: 95 }, { uv: 110 }];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const [stRes, bkRes, mtRes] = await Promise.all([
          axios.get('/api/stations', config),
          axios.get('/api/bookings/all', config),
          axios.get('/api/maintenance', config)
        ]);
        setStations(stRes.data.data || []);
        setBookings(bkRes.data.data || []);
        setMaintenanceLogs(mtRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      }
    };
    if (user?.token) fetchData();
  }, [user]);

  const activePumps = stations.reduce((acc, st) => acc + (st.availablePumps || 0), 0);
  const totalPumps = stations.reduce((acc, st) => acc + (st.totalPumps || 0), 0);
  const pendingMaintenance = maintenanceLogs.filter(m => m.status === 'pending').length;

  return (
    <>
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <Search size={18} color="var(--admin-text-muted)" />
            <input type="search" placeholder="Search stations, bookings..." />
          </div>
          
          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            <div className="admin-profile">
              <div className="avatar">A</div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Admin User</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>System Administrator</div>
              </div>
            </div>
          </div>
        </header>

        <header className="content-header fade-in">
          <h1>Welcome, System Admin</h1>
          <p>Central Hydrogen SCADA & Operations Command Grid</p>
        </header>

        {/* ENTERPRISE SCADA & AUTOMATION COMMAND MATRIX */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '28px'
        }}>
          <button 
            type="button"
            onClick={() => setShowSCADA(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Zap size={18} color="#ef4444" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>SCADA Control</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Remote ESD & Valves</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowTariffs(true)}
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <TrendingUp size={18} color="#06b6d4" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Dynamic Tariffs</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Solar & Surge Rules</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowLogistics(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Truck size={18} color="#3b82f6" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Tube Logistics</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Tanker Restock Fleet</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowUserRoles(true)}
            style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Users size={18} color="#c084fc" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>RBAC Directory</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Roles & Wallet Credit</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowAuditLogs(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Terminal size={18} color="#10b981" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>Audit Forensics</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>SIEM Compliance</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowPredictiveAI(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Wrench size={18} color="#f59e0b" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>AI Maintenance</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Anomaly Dispatch</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowESGForecast(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Leaf size={18} color="#10b981" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>ESG & Revenue</span>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Tax Credits & Ledger</span>
            </div>
          </button>
        </div>

        <div className="stats-grid">
          <Link to="/admin/stations" className="actionable-card fade-in">
            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper accent-bg">
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <h3>Live Pump Status</h3>
                <p className="stat-value">{activePumps} / {totalPumps}</p>
                <span className="stat-label">Pumps Operational</span>
              </div>
            </div>
          </Link>

          <Link to="/admin/bookings" className="actionable-card fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="stat-icon-wrapper accent-bg" style={{ zIndex: 1 }}>
                <CalendarCheck size={24} />
              </div>
              <div className="stat-info" style={{ zIndex: 1 }}>
                <h3>Active Bookings</h3>
                <p className="stat-value">{bookings.length}</p>
                <span className="stat-label">In the network</span>
              </div>
              {/* Sparkline background */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', opacity: 0.3, zIndex: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <Area type="monotone" dataKey="uv" stroke="#6366f1" fill="#6366f1" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Link>

          <Link to="/admin/maintenance" className="actionable-card fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper accent-bg warning">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>Pending Maintenance</h3>
                <p className="stat-value warning-text">{pendingMaintenance}</p>
                <span className="stat-label">Requires Attention</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Data Grids */}
        <div className="data-section">
          {/* Left Column: Stations Table */}
          <div className="glass-card fade-in" style={{ flexDirection: 'column', alignItems: 'stretch', animationDelay: '0.3s' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem' }}>Network Stations</h3>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Station Name</th>
                    <th>Status</th>
                    <th>Available</th>
                    <th>Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map(st => (
                    <tr key={st._id}>
                      <td>{st.name}</td>
                      <td>
                        <span className={`status-badge ${st.status === 'active' || st.status === 'operational' ? 'active' : st.status}`}>
                          {st.status === 'active' ? 'operational' : st.status}
                        </span>
                      </td>
                      <td>{st.availablePumps || 0}/{st.totalPumps || 0}</td>
                      <td>{st.queueLength || 0}</td>
                    </tr>
                  ))}
                  {stations.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No stations found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Feeds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Maintenance Queue */}
            <div className="glass-card fade-in" style={{ flexDirection: 'column', alignItems: 'stretch', animationDelay: '0.4s' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', color: 'var(--admin-warning)' }}>Pending Maintenance</h3>
              <div className="list-feed">
                {maintenanceLogs.filter(m => m.status === 'pending').slice(0, 3).map(m => (
                  <div key={m._id} className="feed-item">
                    <div className="feed-info">
                      <p>{m.station?.name || 'Unknown Station'}</p>
                      <span>{m.description} • Priority: {m.priority}</span>
                    </div>
                    <span className="status-badge pending">Pending</span>
                  </div>
                ))}
                {maintenanceLogs.filter(m => m.status === 'pending').length === 0 && <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>No pending maintenance tasks.</p>}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="glass-card fade-in" style={{ flexDirection: 'column', alignItems: 'stretch', animationDelay: '0.5s' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem' }}>Recent Bookings</h3>
              <div className="list-feed">
                {bookings.slice(0, 4).map(b => (
                  <div key={b._id} className="feed-item">
                    <div className="feed-info">
                      <p>{b.user?.name || 'Guest User'}</p>
                      <span>{b.station?.name} • {new Date(b.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`status-badge ${b.status}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
                {bookings.length === 0 && <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>No recent bookings.</p>}
              </div>
            </div>

          </div>
        </div>

        {/* 7 NEXT-GEN ENTERPRISE ADMIN MODALS */}
        {showSCADA && <SCADAControlMatrix onClose={() => setShowSCADA(false)} />}
        {showTariffs && <DynamicTariffEngine onClose={() => setShowTariffs(false)} />}
        {showLogistics && <SupplyChainLogistics onClose={() => setShowLogistics(false)} />}
        {showUserRoles && <UserRoleManager onClose={() => setShowUserRoles(false)} />}
        {showAuditLogs && <AuditForensicsViewer onClose={() => setShowAuditLogs(false)} />}
        {showPredictiveAI && <PredictiveMaintenanceHub onClose={() => setShowPredictiveAI(false)} />}
        {showESGForecast && <ESGRevenueForecasting onClose={() => setShowESGForecast(false)} />}
      </>
  );
};

export default AdminDashboard;
