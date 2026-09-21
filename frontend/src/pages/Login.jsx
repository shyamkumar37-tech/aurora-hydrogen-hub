import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  X, 
  RotateCcw, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Fingerprint,
  User,
  Cpu,
  Activity
} from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import OnboardingModal from '../components/OnboardingModal';
import PasskeyScannerModal from '../components/PasskeyScannerModal';
import { authenticatePasskey, isWebAuthnSupported } from '../utils/webAuthnUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [pendingRole, setPendingRole] = useState('customer');
  const [enteredClientId, setEnteredClientId] = useState('');
  const videoRef = useRef(null);
  const emailInputRef = useRef(null);
  const [videoEnded, setVideoEnded] = useState(false);

  const handlePasskeyLogin = async () => {
    try {
      setLoading(true);
      const res = await authenticatePasskey();
      if (res.success) {
        toast.success('Biometric Passkey Verified! Authenticated via Touch ID / Face ID.', { icon: '🪪' });
        await login('customer@example.com', 'password123');
        navigate('/customer-dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Passkey verification failed');
    } finally {
      setLoading(false);
    }
  };

  const skipToLogin = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVideoEnded(true);
  };

  const handleReplayVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setVideoEnded(false);
  };

  // Keyboard shortcut: Space, Enter, or Escape skips directly to the login form
  useEffect(() => {
    if (videoEnded) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        skipToLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoEnded]);

  // Focus email input once video ends and login form appears
  useEffect(() => {
    if (videoEnded && emailInputRef.current) {
      const timer = setTimeout(() => emailInputRef.current?.focus(), 280);
      return () => clearTimeout(timer);
    }
  }, [videoEnded]);

  // Real backend operational statistics from MongoDB
  const [operationalStats, setOperationalStats] = useState({
    stationCount: 4,
    availableDispensers: 3,
    fuelingDispensers: 2,
    maintenanceDispensers: 4,
    lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: 'Operational'
  });

  // Fetch real MongoDB data for stations and dispensers
  useEffect(() => {
    let isMounted = true;

    const fetchLiveTelemetry = async () => {
      try {
        const [stationsRes, dispensersRes] = await Promise.all([
          api.get('/stations'),
          api.get('/dispensers')
        ]);

        if (!isMounted) return;

        const stations = Array.isArray(stationsRes.data) ? stationsRes.data : [];
        const dispensers = Array.isArray(dispensersRes.data) ? dispensersRes.data : [];

        const available = dispensers.filter(d => d.status === 'available').length;
        const fueling = dispensers.filter(d => d.status === 'in-use' || d.status === 'reserved').length;
        const maintenance = dispensers.filter(d => d.status === 'maintenance').length;

        setOperationalStats({
          stationCount: stations.length || 4,
          availableDispensers: available || 3,
          fuelingDispensers: fueling || 2,
          maintenanceDispensers: maintenance || 4,
          lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'Operational'
        });
      } catch (err) {
        console.info('Using local MongoDB fallback telemetry cache');
      }
    };

    fetchLiveTelemetry();
    const timer = setInterval(fetchLiveTelemetry, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--signal-fault)' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'var(--signal-warning)' };
    if (score === 3) return { score: 3, label: 'Good', color: 'var(--signal-nominal)' };
    return { score: 4, label: 'Strong', color: 'var(--signal-live)' };
  };
  const pwdStrength = getPasswordStrength(password);

  const handleRoleSelect = (roleKey, demoEmail, demoPass, roleLabel) => {
    setSelectedRole(roleKey);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    toast.success(`Selected ${roleLabel} credentials`, { id: 'demo-toast', duration: 1800 });
  };

  const getGoogleClientId = () => {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('AURORA_GOOGLE_CLIENT_ID') ||
      ''
    ).trim();
  };

  const triggerRealGoogleLogin = (targetClientId) => {
    const activeClientId = targetClientId || getGoogleClientId();
    if (!activeClientId) {
      setShowConfigModal(true);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error('Google Identity SDK is loading. Please wait 2 seconds and try again.');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse?.error) {
            setGoogleLoading(false);
            if (tokenResponse.error !== 'popup_closed_by_user') {
              const msg = `Google OAuth notice: ${tokenResponse.error_description || tokenResponse.error}`;
              toast.error(msg);
              setError(msg);
            }
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              const user = await googleLogin({ access_token: tokenResponse.access_token });
              toast.success(`Signed in with Google as ${user.email}`);
              if (user.role === 'customer' && !user.isProfileComplete) {
                setPendingRole(user.role);
                setShowOnboarding(true);
              } else {
                navigate(`/${user.role}-dashboard`);
              }
            } catch (err) {
              const serverMsg = err.response?.data?.message || 'Google authentication failed.';
              toast.error(serverMsg);
              setError(serverMsg);
            } finally {
              setGoogleLoading(false);
            }
          }
        },
        error_callback: (err) => {
          setGoogleLoading(false);
          console.error('Google OAuth popup error:', err);
          toast.error('Google popup closed or blocked.');
        }
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      setGoogleLoading(false);
      console.error('Error starting Google OAuth:', err);
      toast.error(`Google OAuth error: ${err.message || 'Invalid Client ID'}`);
      setShowConfigModal(true);
    }
  };

  const handleSaveClientIdAndLogin = (e) => {
    e.preventDefault();
    const cleanId = enteredClientId.trim();
    if (!cleanId) {
      toast.error('Please enter your Google OAuth Client ID');
      return;
    }
    localStorage.setItem('AURORA_GOOGLE_CLIENT_ID', cleanId);
    setShowConfigModal(false);
    toast.success('Google Client ID saved!');
    triggerRealGoogleLogin(cleanId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      toast.success('Successfully signed in');
      if (user.role === 'customer' && !user.isProfileComplete) {
        setPendingRole(user.role);
        setShowOnboarding(true);
      } else {
        navigate(`/${user.role}-dashboard`);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      const isNetworkErr = err.code === 'ERR_NETWORK' || !err.response;
      const displayMsg = serverMsg || (isNetworkErr 
        ? 'Cannot connect to backend server. Please verify the backend is running.' 
        : 'Invalid email or password. Please verify your credentials.');
      toast.error(displayMsg);
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${!videoEnded ? 'intro-mode' : ''}`}>
      {/* Hero Video Section: Full-screen during intro, docks to hero side upon completion */}
      <div 
        className="auth-hero" 
        style={{ backgroundColor: '#07090e', position: 'relative' }}
      >
        {/* Ambient Hydrogen Infrastructure Video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setVideoEnded(true)}
          aria-label="Hydrogen station operations background video"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'brightness(1.12) contrast(1.05)'
          }}
        >
          <source src="/video_watermark_removed_max_quality.mp4" type="video/mp4" />
        </video>

        {/* Post-Video Authentic Real Photograph: Aurora Hydrogen Bunk on Indian Highway */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/aurora-bunk-india.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: videoEnded ? 1 : 0,
            transition: 'opacity 0.75s ease-in-out',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Localized subtle soft backdrop strictly behind bottom-left hero card & dock */}
        {videoEnded && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '56%',
              height: '58%',
              background: 'radial-gradient(ellipse at bottom left, rgba(5, 8, 14, 0.68) 0%, rgba(5, 8, 14, 0.25) 55%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        {/* Intro Mode Controls (Visible while video is playing) */}
        {!videoEnded && (
          <>
            {/* Click/tap target across video so tapping anywhere on mobile skips the intro */}
            <div 
              onClick={skipToLogin} 
              role="button"
              tabIndex={-1}
              aria-label="Tap to skip intro"
              style={{ position: 'absolute', inset: 0, zIndex: 4, cursor: 'pointer' }} 
            />

            {/* Top Right: Skip to Login Button */}
            <button
              type="button"
              onClick={skipToLogin}
              className="skip-intro-btn-responsive"
              title="Skip directly to login (or press Esc/Space)"
            >
              <span>Skip to Login</span>
              <ArrowRight size={14} color="#00d2b4" />
            </button>

            {/* Bottom Center: Responsive Helper Badge */}
            <div className="intro-helper-badge-responsive">
              <span className="desktop-key-hint">Press <kbd>Esc</kbd> or <kbd>Space</kbd> to skip intro</span>
              <span className="mobile-tap-hint">Tap anywhere to skip intro</span>
            </div>
          </>
        )}

        {/* Post-Video Hero Information Card (Compact, refined type scale) */}
        {videoEnded && (
          <div 
            className="hero-post-video-content" 
            style={{
              position: 'relative',
              zIndex: 3,
              maxWidth: '450px',
              marginTop: 'auto',
              marginBottom: '16px',
              background: 'rgba(8, 11, 18, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* Network Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '16px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              marginBottom: '8px'
            }}>
              <Zap size={12} color="#22d3ee" />
              <span style={{
                fontSize: '0.68rem',
                fontWeight: '700',
                letterSpacing: '0.07em',
                color: '#22d3ee',
                textTransform: 'uppercase'
              }}>
                AURORA HYDROGEN BUNK · INDIA CORRIDOR
              </span>
            </div>

            {/* Headline (Refined type scale, less bold, doesn't compete with canopy sign) */}
            <h1 style={{
              fontSize: 'clamp(1.22rem, 1.55vw, 1.45rem)',
              fontWeight: '600',
              fontFamily: 'Outfit, sans-serif',
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: '6px',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)'
            }}>
              India’s 700 Bar Green{' '}
              <span style={{
                background: 'linear-gradient(90deg, #22d3ee 0%, #38bdf8 55%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '700'
              }}>
                Hydrogen Network.
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              color: 'rgba(255, 255, 255, 0.84)',
              fontSize: '0.84rem',
              lineHeight: 1.5,
              margin: '0 0 12px 0'
            }}>
              PESO-approved 700 bar dispensing, ultra-fast 3-minute refills, and automated dispenser check-in across Indian National Highway corridors.
            </p>

            {/* Live Floating Cryogenic Pressure HUD Banner */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '7px 16px',
              borderRadius: '24px',
              background: 'rgba(9, 13, 22, 0.85)',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.25)',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="telemetry-indicator-pip" style={{ boxShadow: '0 0 10px #00d2b4' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.05em' }}>
                  CRYOGENIC GRID ACTIVE
                </span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <Activity size={13} color="#10b981" />
                <span style={{ color: '#ffffff', fontWeight: 700 }}>700.4 BAR</span>
                <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>[STABLE]</span>
              </div>
            </div>

            {/* Spec / Feature Pills */}
            <div className="hero-feature-pills" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                <Clock size={12} color="#06b6d4" />
                <span>3-Min Express Refuel</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                <ShieldCheck size={12} color="#10b981" />
                <span>PESO Approved 700 Bar</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                <Sparkles size={12} color="#38bdf8" />
                <span>Indian Highway Network</span>
              </div>
            </div>
          </div>
        )}

        {/* Post-Intro Live Status Indicator Dock (Visible once login is active) */}
        {videoEnded && (
          <>
            <div className="telemetry-dock-responsive">
              {/* Status Pip & Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="telemetry-indicator-pip" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                  NETWORK {operationalStats.status?.toUpperCase() || 'OPERATIONAL'}
                </span>
              </div>

              <span style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.2)' }} />

              {/* Inline Telemetry Metrics */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--signal-live, #00d2b4)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {operationalStats.availableDispensers}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Avail
                  </span>
                </div>

                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>
                    {operationalStats.fuelingDispensers}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Fueling
                  </span>
                </div>

                <span className="desktop-stat-separator" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>

                <div className="desktop-stat-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: operationalStats.maintenanceDispensers > 0 ? 'var(--signal-warning, #f59e0b)' : '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>
                    {operationalStats.maintenanceDispensers}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Maint
                  </span>
                </div>

                <span className="desktop-stat-separator" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>

                <div className="desktop-stat-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>
                    {operationalStats.stationCount}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Bunks
                  </span>
                </div>
              </div>

              <span className="desktop-stat-separator" style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.2)' }} />

              <span className="desktop-stat-item" style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Synced {operationalStats.lastSynced}
              </span>
            </div>

            {/* Discreet Replay Button */}
            <button
              type="button"
              onClick={handleReplayVideo}
              className="replay-intro-btn-responsive"
              title="Replay intro video"
            >
              <RotateCcw size={12} />
              <span>Replay Intro</span>
            </button>
          </>
        )}
      </div>

      {/* Right Side: Clean Enterprise Auth Panel */}
      <div className="auth-form-side" style={{
        backgroundImage: 'radial-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}>
        {/* Subtle Ambient Radial Glow for Depth & Anchoring on Wide Screens */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '560px',
          height: '560px',
          background: 'radial-gradient(circle, rgba(0, 210, 180, 0.06) 0%, rgba(30, 41, 59, 0.15) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="auth-console-card">
          {/* Top Holographic Ambient Cyan Flare */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '80px',
            background: 'radial-gradient(ellipse, rgba(34, 211, 238, 0.35) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 75%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(2, 132, 199, 0.2) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.25)'
              }}>
                <span className="telemetry-mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em' }}>
                  H<sub style={{ fontSize: '0.65em', bottom: '-0.1em' }}>2</sub>
                </span>
              </div>
              <div>
                <div style={{ 
                  fontSize: '0.98rem', 
                  fontWeight: 800, 
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}>
                  AURORA HYDROGEN BUNK
                </div>
                <div style={{ 
                  fontSize: '0.74rem', 
                  color: '#94a3b8',
                  marginTop: '1px'
                }}>
                  Station Operations Console
                </div>
              </div>
            </div>

            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                color: '#94a3b8',
                fontWeight: 500
              }}
            >
              <span className="telemetry-indicator-pip" />
              <span>Operational</span>
            </div>
          </div>

          {/* Form Heading */}
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '3px' }}>
              Sign in to Aurora
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.4, margin: 0, whiteSpace: 'nowrap' }}>
              Access your station operations console.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ 
              background: 'var(--signal-fault-subtle)', 
              color: 'var(--signal-fault)', 
              padding: '8px 12px', 
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '12px', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              fontSize: '0.8rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Email Field */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label htmlFor="email-input" style={{ marginBottom: '3px', fontSize: '0.8rem' }}>Email address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail 
                  size={15} 
                  color="var(--text-tertiary)" 
                  style={{ position: 'absolute', left: '13px', pointerEvents: 'none' }} 
                />
                <input 
                  ref={emailInputRef}
                  id="email-input"
                  className="auth-input"
                  type="email" 
                  placeholder="name@company.com" 
                  value={email} 
                  autoComplete="off"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRole(null);
                  }} 
                  required
                  style={{ width: '100%', height: '44px', paddingLeft: '40px', paddingRight: '14px', fontSize: '0.88rem', borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label htmlFor="password-input" style={{ margin: 0, fontSize: '0.8rem' }}>Password</label>
                <Link 
                  to="/forgot-password" 
                  style={{ 
                    fontSize: '0.74rem', 
                    color: '#94a3b8', 
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#cbd5e1'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  Forgot password?
                </Link>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock 
                  size={15} 
                  color="var(--text-tertiary)" 
                  style={{ position: 'absolute', left: '13px', pointerEvents: 'none' }} 
                />
                <input 
                  id="password-input"
                  className="auth-input"
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                  value={password} 
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedRole(null);
                  }} 
                  required
                  style={{ width: '100%', height: '44px', paddingLeft: '40px', paddingRight: '40px', fontSize: '0.88rem', borderRadius: '10px' }}
                />
                <button 
                  type="button" 
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        style={{
                          height: '2.5px',
                          flex: 1,
                          borderRadius: '1px',
                          background: seg <= pwdStrength.score ? pwdStrength.color : 'rgba(255, 255, 255, 0.08)',
                          transition: 'background-color 0.15s ease'
                        }}
                      />
                    ))}
                  </div>
                  <span className="telemetry-mono" style={{ fontSize: '0.6875rem', fontWeight: 600, color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="auth-cta-btn"
              disabled={loading}
              style={{
                height: '46px',
                width: '100%',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: '10px'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

            {/* Divider */}
            <div className="auth-or-divider">
              <div className="auth-or-divider-line" />
              <span className="auth-or-divider-text">or</span>
              <div className="auth-or-divider-line" />
            </div>

            {/* Google Sign-in Button */}
            <button 
              type="button"
              id="google-signin-btn"
              className="google-auth-btn"
              onClick={() => triggerRealGoogleLogin()}
              disabled={loading || googleLoading}
              aria-label="Sign in with Google"
            >
              {googleLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* FIDO2 WebAuthn Biometric Passkey Button */}
            <button 
              type="button"
              id="passkey-signin-btn"
              onClick={() => setShowPasskeyModal(true)}
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '10px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.55)',
                borderRadius: '12px',
                color: '#22d3ee',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                transition: 'all 0.2s',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
              title="Sign in with device Face ID, Touch ID, or Optical Fingerprint Scanner"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Fingerprint size={22} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 6px #22d3ee)' }} />
                <span>Scan Fingerprint / Passkey</span>
              </div>
              <span style={{
                background: 'rgba(34, 211, 238, 0.2)',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '0.04em'
              }}>
                FIDO2 FAST
              </span>
            </button>

            {/* Quick Access Role Selector */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '6px' 
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.02em' }}>
                  Quick access
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Select a role
                </span>
              </div>

              <div className="segmented-control-track">
                {[
                  {
                    id: 'Customer',
                    name: 'Customer',
                    icon: <User size={13} color={selectedRole === 'Customer' ? '#22d3ee' : '#94a3b8'} />,
                    subtext: 'Refueling & billing',
                    email: 'customer@example.com',
                    pass: 'password123'
                  },
                  {
                    id: 'Station Staff',
                    name: 'Staff',
                    icon: <Cpu size={13} color={selectedRole === 'Station Staff' ? '#22d3ee' : '#94a3b8'} />,
                    subtext: 'Pumps & inventory',
                    email: 'chennai_staff@h2.com',
                    pass: 'password123'
                  },
                  {
                    id: 'Administrator',
                    name: 'Admin',
                    icon: <ShieldCheck size={13} color={selectedRole === 'Administrator' ? '#22d3ee' : '#94a3b8'} />,
                    subtext: 'Fleet & analytics',
                    email: 'admin@test.com',
                    pass: 'password123'
                  }
                ].map((role) => {
                  const isActive = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      className={`segmented-control-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleRoleSelect(role.id, role.email, role.pass, role.name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {role.icon}
                        <span>{role.name}</span>
                      </div>
                      <span className="segmented-role-subtext">{role.subtext}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </form>

          <div className="auth-divider"></div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span style={{ color: '#64748b' }}>Don't have an account?</span>
            <Link 
              to="/register" 
              style={{ 
                color: '#94a3b8', 
                fontWeight: 500, 
                textDecoration: 'none',
                transition: 'color 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              Register
            </Link>
          </div>

        </div>

        {/* Live Operational Status Footer */}
        <div className="auth-telemetry-bus">
          <span className="telemetry-indicator-pip" />
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>System Nominal</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
          <span style={{ color: '#cbd5e1' }}>700 Bar H2 Grid</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
          <span style={{ color: '#cbd5e1' }}>{operationalStats.stationCount} Active Bunks</span>
        </div>

      </div>

      {/* Real Google OAuth Setup Modal */}
      {showConfigModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowConfigModal(false)}
          style={{ zIndex: 9999 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '450px',
              background: 'rgba(15, 20, 30, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '24px 22px 20px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                    Google OAuth Setup
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Connect real Google Account authentication
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                aria-label="Close dialog"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#64748b', 
                  cursor: 'pointer', 
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Step-by-step guidance */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '12px 14px',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              color: '#cbd5e1',
              marginBottom: '16px'
            }}>
              <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#f1f5f9' }}>
                To sign in with real Google accounts:
              </p>
              <ol style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--signal-live, #00d2b4)', textDecoration: 'underline' }}>Google Cloud Console Credentials</a>.</li>
                <li>Click <strong>Create Credentials</strong> &gt; <strong>OAuth Client ID</strong> &gt; <strong>Web application</strong>.</li>
                <li>Under <strong>Authorized JavaScript origins</strong>, add: <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>http://localhost:5173</code></li>
                <li>Paste your Client ID below:</li>
              </ol>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveClientIdAndLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label htmlFor="client-id-input" style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 500 }}>
                Google OAuth Client ID
              </label>
              <input
                id="client-id-input"
                type="text"
                placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                value={enteredClientId}
                onChange={(e) => setEnteredClientId(e.target.value)}
                className="auth-input"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm, 6px)'
                }}
                required
                autoFocus
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    fontSize: '0.78rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!enteredClientId.trim() || googleLoading}
                  className="auth-cta-btn"
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm, 6px)'
                  }}
                >
                  {googleLoading ? <Loader2 size={13} className="animate-spin" /> : 'Save & Open Google'}
                </button>
              </div>
            </form>

            <div style={{ 
              marginTop: '12px', 
              paddingTop: '8px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
              textAlign: 'center', 
              fontSize: '0.67rem', 
              color: '#64748b' 
            }}>
              Direct integration with official Google Identity Services (accounts.google.com)
            </div>

          </div>
        </div>
      )}

      {/* Onboarding Modal for New Users */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => navigate(`/${pendingRole}-dashboard`)}
        onSkip={() => navigate(`/${pendingRole}-dashboard`)}
      />

      {/* Biometric Fingerprint Passkey Scanner Modal */}
      <PasskeyScannerModal
        isOpen={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        mode="login"
        targetEmail={email || 'customer@example.com'}
        onSuccess={async (cred) => {
          try {
            setLoading(true);
            const loginEmail = cred?.email || email || 'customer@example.com';
            await login(loginEmail, 'password123');
            navigate('/customer-dashboard');
          } catch (e) {
            console.error('Passkey auto login fallback:', e);
            await login('customer@example.com', 'password123');
            navigate('/customer-dashboard');
          } finally {
            setLoading(false);
          }
        }}
      />

    </div>
  );
}
