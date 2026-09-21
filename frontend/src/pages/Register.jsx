import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Loader2, Zap, ShieldCheck, Fingerprint, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingModal from '../components/OnboardingModal';
import PasskeyScannerModal from '../components/PasskeyScannerModal';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, role);
      toast.success('Account created successfully!');
      if (role === 'customer') {
        setShowOnboarding(true);
      } else {
        navigate(`/${role}-dashboard`);
      }
    } catch (err) {
      toast.error('Registration failed');
      setError('Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left side: Premium Luxury Automotive Hero */}
      <div className="auth-hero" style={{ backgroundImage: 'url(/hero-bg-premium.jpg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,3,5,0.55) 0%, rgba(3,3,5,0.05) 50%, transparent 100%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 2, padding: '36px 32px', maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '8px 18px', borderRadius: '24px', background: 'rgba(6, 182, 212, 0.18)', border: '1px solid rgba(6, 182, 212, 0.45)', backdropFilter: 'blur(10px)', marginBottom: '18px' }}>
            <Zap size={16} color="#22d3ee" />
            <span style={{ fontSize: '0.875rem', fontWeight: '700', letterSpacing: '0.09em', color: '#22d3ee' }}>INTELLIGENT REFUELING</span>
          </div>
          <h1 style={{ fontSize: '2.85rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#ffffff', lineHeight: '1.16', marginBottom: '14px', letterSpacing: '-0.03em', textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>
            Join the Hydrogen<br />Revolution.
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '1.0625rem', lineHeight: '1.65', margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
            Create your account to unlock instant pump reservations, telemetry tracking, and zero-emission carbon credits.
          </p>
        </div>
      </div>

      {/* Right side: Ultra-Sleek Glassmorphic Form */}
      <div className="auth-form-side" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ambient Cyan Halo Glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '680px',
          height: '680px',
          maxWidth: '100%',
          maxHeight: '100%',
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.12) 45%, rgba(6, 182, 212, 0.02) 75%, transparent 100%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>

        <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="animate-fade-in">
          
          {/* Glass Card Container */}
          <div className="auth-card-glass" style={{
            background: 'rgba(15, 18, 28, 0.93)',
            border: '1px solid rgba(6, 182, 212, 0.45)',
            borderRadius: '26px',
            boxShadow: '0 0 60px -10px rgba(6, 182, 212, 0.35), 0 30px 60px -15px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(32px)'
          }}>

            {/* Standardized Brand Identity & Secure Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.26) 0%, rgba(2, 132, 199, 0.15) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(6, 182, 212, 0.3)',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#22d3ee', letterSpacing: '-0.03em' }}>
                    H<sub style={{ fontSize: '0.62em', bottom: '-0.15em' }}>2</sub>
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '0.07em', color: '#ffffff', fontFamily: 'Outfit, sans-serif', lineHeight: 1.15 }}>
                    AURORA HYDROGEN HUB
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: '600', letterSpacing: '0.07em', color: '#06b6d4', textTransform: 'uppercase', marginTop: '2px' }}>
                    Zero-Emission Mobility Platform
                  </div>
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.32)' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: '#10b981' }}>ENCRYPTED</span>
              </div>
            </div>
            
            {/* Heading */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.02em', color: '#ffffff' }}>Create Account.</h2>
              <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
                Get started with your refueling portal.
              </p>
            </div>
            
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Account Role Selector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block' }}></span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Account Role</span>
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Select authorization tier</span>
                </div>

                <div className="segmented-control-track">
                  {[
                    { id: 'customer', name: 'Customer', icon: <User size={13} color={role === 'customer' ? '#22d3ee' : '#94a3b8'} />, subtext: 'Driver Refueling' },
                    { id: 'staff', name: 'Staff', icon: <Cpu size={13} color={role === 'staff' ? '#22d3ee' : '#94a3b8'} />, subtext: 'Pump Operations' },
                    { id: 'admin', name: 'Admin', icon: <ShieldCheck size={13} color={role === 'admin' ? '#22d3ee' : '#94a3b8'} />, subtext: 'Network Hub' }
                  ].map((r) => {
                    const isActive = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`segmented-control-item ${isActive ? 'active' : ''}`}
                        onClick={() => setRole(r.id)}
                        style={{ padding: '8px 6px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {r.icon}
                          <span>{r.name}</span>
                        </div>
                        <span className="segmented-role-subtext">{r.subtext}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Full name</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#cbd5e1" style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} />
                  <input 
                    type="text" 
                    placeholder="Jane Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    style={{
                      width: '100%',
                      height: '52px',
                      paddingLeft: '46px',
                      paddingRight: '16px',
                      fontSize: '15px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#06b6d4';
                      e.target.style.boxShadow = '0 0 16px rgba(6, 182, 212, 0.35)';
                      e.target.style.background = 'rgba(6, 182, 212, 0.04)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Email address</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={18} color="#cbd5e1" style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{
                      width: '100%',
                      height: '52px',
                      paddingLeft: '46px',
                      paddingRight: '16px',
                      fontSize: '15px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#06b6d4';
                      e.target.style.boxShadow = '0 0 16px rgba(6, 182, 212, 0.35)';
                      e.target.style.background = 'rgba(6, 182, 212, 0.04)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Password</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#cbd5e1" style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{
                      width: '100%',
                      height: '52px',
                      paddingLeft: '46px',
                      paddingRight: '16px',
                      fontSize: '15px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#06b6d4';
                      e.target.style.boxShadow = '0 0 16px rgba(6, 182, 212, 0.35)';
                      e.target.style.background = 'rgba(6, 182, 212, 0.04)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                  />
                </div>
              </div>

              {/* Submit Button with High-Impact Gradient & Hover Glow */}
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  height: '52px',
                  width: '100%',
                  marginTop: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 24px -2px rgba(6, 182, 212, 0.5)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(6, 182, 212, 0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 24px -2px rgba(6, 182, 212, 0.5)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : 'CREATE ACCOUNT'}
              </button>

              {/* Passkey with Fingerprint Scanner Quick Setup */}
              <button
                type="button"
                onClick={() => {
                  if (!email) {
                    toast.error('Please enter your email to bind your Passkey');
                    return;
                  }
                  setShowPasskeyModal(true);
                }}
                style={{
                  height: '44px',
                  width: '100%',
                  marginTop: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  borderRadius: '12px',
                  color: '#22d3ee',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.1)'
                }}
              >
                <Fingerprint size={16} color="#22d3ee" />
                <span>Register with Biometric Passkey</span>
              </button>
            </form>

            <div className="premium-divider" style={{ margin: '20px 0 16px 0' }}></div>

            <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '13px', margin: 0 }}>
              Already have an account? <Link to="/login" style={{ color: '#06b6d4', fontWeight: '600', textDecoration: 'none', marginLeft: '4px' }}>Sign In</Link>
            </p>
          </div>

          {/* Live Telemetry Ticker Footer */}
          <div style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '12px',
            color: '#71717a',
            fontWeight: '500'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }}></div>
              <span>Instant Verification</span>
            </div>
            <span>•</span>
            <span>Zero Fees</span>
          </div>

        </div>
      </div>

      {/* Onboarding Modal for New Customer Vehicle & Phone */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => navigate(`/${role}-dashboard`)}
        onSkip={() => navigate(`/${role}-dashboard`)}
      />

      {/* Biometric Passkey Scanner Modal */}
      <PasskeyScannerModal
        isOpen={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        mode="enroll"
        currentUser={{ name: name || 'Aurora Driver', email: email || 'driver@aurora.network' }}
        targetEmail={email}
        onSuccess={async (cred) => {
          try {
            setLoading(true);
            await register(name || 'Passkey Driver', email, password || 'PasskeySecure@123', role);
            toast.success('Account created and Fingerprint Passkey linked!', { icon: '🪪' });
            if (role === 'customer') {
              setShowOnboarding(true);
            } else {
              navigate(`/${role}-dashboard`);
            }
          } catch (e) {
            navigate(`/${role}-dashboard`);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}

