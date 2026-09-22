/**
 * Aurora Native Browser & Desktop Push Notification System
 * Integrates Web Notification API with synthesized audio chimes
 */

// Synthesize pleasant futuristic notification chime using Web Audio API
export const playNotificationChime = (type = 'success') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    if (type === 'alert') {
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc2.frequency.setValueAtTime(554, now);
      osc2.frequency.exponentialRampToValueAtTime(1108, now + 0.15);
    } else {
      // Pleasant double bell (C6 -> G6)
      osc1.frequency.setValueAtTime(1046.5, now);
      osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12);
      osc2.frequency.setValueAtTime(1318.5, now);
      osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.12);
    }

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

/**
 * Check if notifications are supported and permitted
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationChime('success');
      sendDesktopNotification('Aurora Push Alerts Activated', {
        body: 'You will receive real-time updates for pump status, refills, and price changes.',
        icon: '/favicon.ico'
      });
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Send a native desktop push notification
 */
export const sendDesktopNotification = (title, options = {}) => {
  playNotificationChime(options.type || 'success');

  if (!isNotificationSupported()) {
    return null;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: options.icon || '/favicon.ico',
        badge: '/favicon.ico',
        silent: true, // We play our custom high-fidelity Web Audio chime
        ...options
      });

      notification.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notification.close();
      };

      return notification;
    } catch (e) {
      console.warn('Native notification spawn failed, falling back', e);
    }
  }

  return null;
};
