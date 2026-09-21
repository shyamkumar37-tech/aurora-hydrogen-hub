import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  Eye, 
  EyeOff, 
  Zap,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Multi-step recovery: 1 = Email, 2 = Verify & Reset, 3 = Completed
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);

  // 30-second resend cooldown timer
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    let timer;
    if (step === 2 && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Live email validation
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const showEmailFormatError = emailTouched && email.trim().length > 0 && !isEmailValid;

  // Step 1: Request Recovery Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);

    if (!email.trim()) {
      setError('Email address is required');
      toast.error('Please enter your email address');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address format (e.g. name@company.com)');
      toast.error('Invalid email format');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message || 'Recovery code generated!');
      if (data.recoveryCode) {
        setRecoveryCode(data.recoveryCode);
      }
      setCooldown(30);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'No account registered with this email address';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend code trigger
  const handleResendCode = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setResending(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message || 'A fresh recovery code has been sent!');
      if (data.recoveryCode) {
        setRecoveryCode(data.recoveryCode);
      }
      setCooldown(30);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!recoveryCode.trim()) {
      setError('Recovery code is required');
      toast.error('Please enter the 6-digit recovery code');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      toast.error('Password must be at least 4 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim(),
        newPassword
      });
      toast.success(data.message || 'Password reset successfully!');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left side: Authentic Architectural & Automotive Hero with film grain and optical lens characteristics */}
      <div className="auth-hero hero-cinematic-zoom" style={{ backgroundImage: 'url(/hero-bg-premium.jpg)', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle 35mm film sensor noise & optical lens vignette */}
        <div className="hero-grain-overlay"></div>
        <div className="hero-lens-vignette"></div>

        {/* Seamless edge darkening seam that blends naturally into the dark form panel */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, transparent 30%, rgba(8, 10, 18, 0.45) 55%, rgba(8, 10, 18, 0.9) 80%, #080a12 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>

        {/* Deep Corner Scrim lifting bottom-left typography */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 75% at 0% 100%, rgba(3, 3, 6, 0.97) 0%, rgba(3, 3, 6, 0.65) 45%, rgba(3, 3, 6, 0.1) 85%)',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>

        {/* Hero typography with enhanced readability and scale */}
        <div style={{ position: 'relative', zIndex: 2, padding: '36px 32px', maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '8px 18px', borderRadius: '24px', background: 'rgba(6, 182, 212, 0.18)', border: '1px solid rgba(6, 182, 212, 0.45)', backdropFilter: 'blur(10px)', marginBottom: '18px' }}>
            <Zap size={16} color="#22d3ee" />
            <span style={{ fontSize: '0.875rem', fontWeight: '700', letterSpacing: '0.08em', color: '#22d3ee' }}>Next-gen 700 bar network</span>
          </div>
          <h1 style={{ fontSize: '2.85rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#ffffff', lineHeight: '1.16', marginBottom: '14px', letterSpacing: '-0.03em', textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>
            Zero Emissions.<br />Pure Performance.
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '1.0625rem', lineHeight: '1.65', margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
            Self-service security and credential recovery for the high-performance hydrogen fueling grid.
          </p>
        </div>
      </div>

      {/* Right side: Focused Glassmorphic Form (~35% visual weight) seamlessly unified with background */}
      <div className="auth-form-side" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {/* Luminous Ambient Backlight Glow behind the card */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '850px',
          height: '900px',
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.28) 0%, rgba(14, 165, 233, 0.16) 45%, rgba(6, 182, 212, 0.04) 75%, transparent 100%)',
          filter: 'blur(65px)',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>

        <div style={{ width: '100%', maxWidth: '570px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="animate-fade-in">
          
          {/* Glass Card Container with Expanded Proportions & Layered Depth Shadow */}
          <div style={{
            background: 'rgba(15, 18, 28, 0.94)',
            border: '1px solid rgba(6, 182, 212, 0.45)',
            borderRadius: '26px',
            padding: '46px 48px',
            boxShadow: '0 0 70px -10px rgba(6, 182, 212, 0.38), 0 35px 70px -15px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.24)',
            backdropFilter: 'blur(32px)',
            position: 'relative'
          }}>

            {/* Back to Sign In Link */}
            <div style={{ marginBottom: '22px' }}>
              <Link 
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to sign in</span>
              </Link>
            </div>

            {/* Standardized Brand Identity & Secure Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.26) 0%, rgba(2, 132, 199, 0.15) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(6, 182, 212, 0.3)',
                  flexShrink: 0
                }}>
                  <KeyRound size={22} color="#22d3ee" />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.07em', color: '#ffffff', fontFamily: 'Outfit, sans-serif', lineHeight: 1.15 }}>
                    AURORA HYDROGEN HUB
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: '600', letterSpacing: '0.07em', color: '#06b6d4', textTransform: 'uppercase', marginTop: '3px' }}>
                    Account Security Recovery
                  </div>
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 13px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.32)' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#10b981' }}>256-bit encrypted</span>
              </div>
            </div>

            {/* Error banner with consistent red styling and icon */}
            {error && (
              <div 
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: 'rgba(239, 68, 68, 0.12)', 
                  color: '#f87171', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  marginBottom: '20px', 
                  border: '1px solid rgba(239, 68, 68, 0.35)', 
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}
              >
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '6px', color: '#ffffff' }}>
                    Reset your password
                  </h2>
                  <p style={{ color: '#d4d4d8', fontSize: '14.5px', lineHeight: '1.5', margin: 0 }}>
                    Enter your registered email address to receive a secure recovery code.
                  </p>
                </div>

                <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label htmlFor="recovery-email" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
                        <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Email address</span>
                      </label>
                      {email && isEmailValid && (
                        <span style={{ fontSize: '0.75rem', color: '#2dd4bf', fontWeight: '600' }}>
                          ✓ Valid format
                        </span>
                      )}
                    </div>
                    
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail 
                        size={18} 
                        color={error ? '#ef4444' : (isEmailValid ? '#06b6d4' : '#cbd5e1')} 
                        style={{ position: 'absolute', left: '16px', pointerEvents: 'none', transition: 'color 0.2s' }} 
                      />
                      <input 
                        id="recovery-email"
                        className="auth-input"
                        type="email" 
                        placeholder="name@company.com" 
                        value={email} 
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }} 
                        onBlur={() => setEmailTouched(true)}
                        required
                        style={{
                          width: '100%',
                          height: '52px',
                          paddingLeft: '46px',
                          paddingRight: '16px',
                          fontSize: '15px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: (error || showEmailFormatError) 
                            ? '1px solid #ef4444' 
                            : (isEmailValid ? '1px solid rgba(6, 182, 212, 0.65)' : '1px solid rgba(255, 255, 255, 0.25)'),
                          boxShadow: (error || showEmailFormatError)
                            ? '0 0 0 1px #ef4444, 0 0 12px rgba(239, 68, 68, 0.25)'
                            : 'none',
                          borderRadius: '12px',
                          color: '#ffffff',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    </div>

                    {/* Inline format validation message */}
                    {showEmailFormatError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.8125rem', marginTop: '6px' }}>
                        <AlertCircle size={14} />
                        <span>Please enter a valid email address (e.g. name@company.com)</span>
                      </div>
                    )}
                  </div>

                  {/* Security rate-limiting note */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <ShieldCheck size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      Security protocol: Requests are verified and rate-limited to prevent unauthorized recovery attempts.
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || (emailTouched && !isEmailValid)}
                    style={{
                      marginTop: '4px',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '15.5px',
                      fontWeight: '700',
                      cursor: (loading || (emailTouched && !isEmailValid)) ? 'not-allowed' : 'pointer',
                      opacity: (loading || (emailTouched && !isEmailValid)) ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.65)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending recovery code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send recovery code</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFY CODE & NEW PASSWORD */}
            {step === 2 && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '6px', color: '#ffffff' }}>
                    Set new password
                  </h2>
                  <p style={{ color: '#d4d4d8', fontSize: '14.5px', lineHeight: '1.5', margin: 0 }}>
                    Enter the code sent to <strong style={{ color: '#38bdf8' }}>{email}</strong> and choose a new password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label htmlFor="recovery-code" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
                        <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Recovery code (6 digits)</span>
                      </label>

                      {/* Resend Cooldown Timer / Action */}
                      {cooldown > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#94a3b8' }}>
                          <Clock size={13} />
                          <span>Resend in 00:{cooldown < 10 ? `0${cooldown}` : cooldown}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={resending}
                          onClick={handleResendCode}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: resending ? 'not-allowed' : 'pointer',
                            padding: 0
                          }}
                        >
                          <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                          <span>Resend recovery code</span>
                        </button>
                      )}
                    </div>

                    <input 
                      id="recovery-code"
                      className="auth-input"
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 583921" 
                      value={recoveryCode} 
                      onChange={(e) => {
                        setRecoveryCode(e.target.value.replace(/\D/g, ''));
                        if (error) setError(null);
                      }} 
                      required
                      style={{
                        width: '100%',
                        height: '52px',
                        padding: '0 16px',
                        fontSize: '18px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.2em',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        borderRadius: '12px',
                        color: '#38bdf8',
                        fontWeight: '700'
                      }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="new-password" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                      <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>New password</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={18} color="#06b6d4" style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} />
                      <input 
                        id="new-password"
                        className="auth-input"
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="At least 4 characters" 
                        value={newPassword} 
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError(null);
                        }} 
                        required
                        style={{
                          width: '100%',
                          height: '50px',
                          paddingLeft: '46px',
                          paddingRight: '46px',
                          fontSize: '15px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '12px',
                          color: '#ffffff'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '14px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="confirm-password" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                      <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block', flexShrink: 0 }}></span>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.01em' }}>Confirm new password</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={18} color="#06b6d4" style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} />
                      <input 
                        id="confirm-password"
                        className="auth-input"
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Re-enter new password" 
                        value={confirmPassword} 
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError(null);
                        }} 
                        required
                        style={{
                          width: '100%',
                          height: '50px',
                          paddingLeft: '46px',
                          paddingRight: '16px',
                          fontSize: '15px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: confirmPassword && newPassword === confirmPassword 
                            ? '1px solid #10b981' 
                            : (confirmPassword && newPassword !== confirmPassword ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.25)'),
                          borderRadius: '12px',
                          color: '#ffffff'
                        }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !recoveryCode.trim() || !newPassword || newPassword !== confirmPassword}
                    style={{
                      marginTop: '8px',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '15.5px',
                      fontWeight: '700',
                      cursor: (loading || !recoveryCode.trim() || !newPassword || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
                      opacity: (loading || !recoveryCode.trim() || !newPassword || newPassword !== confirmPassword) ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.65)'
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset password & sign in</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: COMPLETED SUCCESS */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div 
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#10b981'
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                  Password updated!
                </h3>
                <p style={{ color: '#d4d4d8', fontSize: '14.5px', lineHeight: '1.5', maxWidth: '380px', margin: '0 auto 24px' }}>
                  Your password has been securely updated in the Aurora Hydrogen platform. You can now sign in immediately.
                </p>

                <button
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '15.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4)'
                  }}
                >
                  Proceed to sign in
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
