import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Fuel, 
  Calendar, 
  MapPin, 
  Menu, 
  X, 
  Car, 
  Leaf, 
  CreditCard, 
  Navigation, 
  Truck, 
  User, 
  LogOut, 
  Fingerprint, 
  Sparkles,
  Smartphone,
  ChevronRight
} from 'lucide-react';

export default function CustomerMobileNav({ 
  onOpenGarage, 
  onOpenGreenPassport, 
  onOpenDigitalPass, 
  onOpenWallet, 
  onOpenFleet,
  onOpenPasskey,
  user,
  logout
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Hub', icon: Activity, path: '/customer-dashboard' },
    { label: 'Refuel', icon: Fuel, path: '/customer/book' },
    { label: 'Bookings', icon: Calendar, path: '/customer/bookings' },
    { label: 'Map', icon: MapPin, path: '/stations/map' },
  ];

  const handleActionClick = (actionFn) => {
    setDrawerOpen(false);
    if (actionFn) actionFn();
  };

  const handleNavClick = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    if (logout) logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on Desktop, Visible on <= 768px) */}
      <nav 
        className="customer-mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9995,
          background: 'rgba(8, 10, 16, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.7)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: '6px',
          paddingLeft: '10px',
          paddingRight: '10px'
        }}
        aria-label="Customer Mobile Navigation"
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '56px',
          maxWidth: '500px',
          margin: '0 auto',
          width: '100%'
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  color: isActive ? '#22d3ee' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.7rem',
                  fontWeight: isActive ? '700' : '500',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    width: '16px',
                    height: '2px',
                    borderRadius: '2px',
                    background: '#22d3ee',
                    boxShadow: '0 0 8px #22d3ee'
                  }} />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Quick Hub Drawer Menu Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              color: drawerOpen ? '#22d3ee' : '#94a3b8',
              fontSize: '0.7rem',
              fontWeight: drawerOpen ? '700' : '500',
              padding: '6px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              flex: 1
            }}
            aria-label="Open Hub Quick Actions Menu"
          >
            <Menu size={20} strokeWidth={drawerOpen ? 2.4 : 1.8} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Bottom Drawer Sheet */}
      {drawerOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'linear-gradient(180deg, #10141f 0%, #07090e 100%)',
              borderTop: '1px solid rgba(34, 211, 238, 0.35)',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 16px)) 20px',
              boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              animation: 'authFormSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '0 auto 16px auto'
            }} />

            {/* Header with User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}>
                  {user?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.95rem' }}>{user?.name || 'Driver'}</div>
                  <div style={{ color: '#22d3ee', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    Wallet: ₹{(user?.walletBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Feature Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => handleActionClick(onOpenWallet)}
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '6px', borderRadius: '8px' }}>
                  <CreditCard size={18} color="#22d3ee" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>Add Funds</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Top-up Wallet</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleActionClick(onOpenGarage)}
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '8px' }}>
                  <Car size={18} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>Virtual Garage</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>My FCEVs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/customer/trip-planner')}
                style={{
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '6px', borderRadius: '8px' }}>
                  <Navigation size={18} color="#c084fc" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>Trip Planner</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Range Map</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleActionClick(onOpenGreenPassport)}
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '8px' }}>
                  <Leaf size={18} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>ESG Passport</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Green Impact</div>
                </div>
              </button>
            </div>

            {/* List Menu Links */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '6px',
              marginBottom: '16px'
            }}>
              <button
                type="button"
                onClick={() => handleNavClick('/customer/transactions')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={16} color="#94a3b8" />
                  <span>Wallet History & Invoices</span>
                </div>
                <ChevronRight size={16} color="#64748b" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={16} color="#94a3b8" />
                  <span>Driver Account Profile</span>
                </div>
                <ChevronRight size={16} color="#64748b" />
              </button>

              {onOpenPasskey && (
                <button
                  type="button"
                  onClick={() => handleActionClick(onOpenPasskey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Fingerprint size={16} color="#22d3ee" />
                    <span>Biometric Face / Touch ID</span>
                  </div>
                  <ChevronRight size={16} color="#64748b" />
                </button>
              )}
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.875rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out of Aurora</span>
            </button>
          </div>
        </div>
      )}

      {/* Hide on desktop CSS */}
      <style>{`
        @media (min-width: 769px) {
          .customer-mobile-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
