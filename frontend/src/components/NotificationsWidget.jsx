import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { io } from 'socket.io-client';
import { Bell, Check, Trash2 } from 'lucide-react';
import Button from './ui/Button';

const socket = io('http://localhost:5000');

export default function NotificationsWidget() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(true); // Always open in dashboard view for better UX

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    socket.on('notification', (data) => {
      const currentUserId = user?._id || user?.id;
      if (data.userId === currentUserId) {
        fetchNotifications();
        // Web Push native notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Aurora Hydrogen Alert', {
            body: data.message || 'You have an update on your hydrogen fueling.',
            icon: '/favicon.svg'
          });
        }
      }
    });

    return () => {
      socket.off('notification');
    };
  }, [user]);

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('Aurora Push Enabled', {
        body: 'Real-time telemetry and station alerts are now activated!',
        icon: '/favicon.svg'
      });
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'var(--text-main)' }}>
          <Bell size={20} style={{ marginRight: '8px', color: 'var(--accent-cyan)' }} />
          Notifications
          {unreadCount > 0 && (
            <span style={{ 
              marginLeft: '12px', 
              background: 'var(--accent-cyan)', 
              color: '#000', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.75rem', 
              fontWeight: 'bold' 
            }}>
              {unreadCount} New
            </span>
          )}
        </h3>
        <button
          onClick={requestPushPermission}
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: 'var(--accent-cyan)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Bell size={12} />
          <span>Enable Web Push</span>
        </button>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>You're all caught up!</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.map(n => (
              <li key={n._id} style={{ 
                padding: '16px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)', 
                backgroundColor: n.read ? 'transparent' : 'rgba(6, 182, 212, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: n.read ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: n.read ? 'normal' : '500' }}>
                    {n.message}
                  </p>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </div>
                {!n.read && (
                  <button 
                    onClick={() => markAsRead(n._id)}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--accent-cyan)', 
                      color: 'var(--accent-cyan)', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Check size={14} style={{ marginRight: '4px' }} /> Mark Read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
