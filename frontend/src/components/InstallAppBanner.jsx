import { useState, useEffect } from 'react';
import { Download, Sparkles, X, Smartphone } from 'lucide-react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone/installed mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed banner recently
      const dismissed = localStorage.getItem('aurora_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install Aurora on iOS: Tap the Share button in Safari, then choose 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('aurora_pwa_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
      border: '1px solid rgba(6, 182, 212, 0.35)',
      borderRadius: '16px',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #06b6d4, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)'
        }}>
          <Smartphone size={22} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>Install Aurora App</span>
            <span style={{ 
              fontSize: '0.7rem', 
              padding: '2px 6px', 
              background: 'rgba(6, 182, 212, 0.25)', 
              borderRadius: '6px', 
              color: '#38bdf8', 
              fontWeight: '600' 
            }}>
              PWA
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Get instant offline access, fast dispenser telemetry, and native mobile notifications.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          <Download size={15} />
          <span>Install Now</span>
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
