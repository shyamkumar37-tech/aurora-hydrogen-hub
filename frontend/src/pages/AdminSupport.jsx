import { useState, useEffect } from 'react';
import api from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { AlertTriangle, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { io } from 'socket.io-client';

export default function AdminSupport() {
  const [alerts, setAlerts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchAlerts();
    fetchTickets();
    
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Support Desk connected to live feed');
    });

    newSocket.on('sos-alert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      // Play a sound or show browser notification here if desired
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/support/sos'); // Requires admin auth mapping
      setAlerts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/support/sos/${id}/acknowledge`);
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTicketStatus = async (id, newStatus) => {
    try {
      await api.put(`/support/tickets/${id}/status`, { status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader 
        title="Support Desk & Emergency SOS" 
        description="Monitor active emergencies and manage customer support tickets."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* SOS Alerts Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-warning)' }}>
            <AlertTriangle size={20} /> Active SOS Alerts
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map(alert => (
              <div key={alert._id} className="glass-panel pulse-alert" style={{ padding: '16px', borderLeft: '4px solid var(--admin-warning)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.125rem' }}>{alert.user?.name || 'Unknown User'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{alert.station?.name || 'Unknown Station'}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <Button variant="primary" style={{ width: '100%', backgroundColor: 'var(--admin-warning)' }} onClick={() => handleAcknowledge(alert._id)}>
                  Acknowledge & Resolve
                </Button>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={48} opacity={0.2} style={{ marginBottom: '16px', color: '#10b981' }} />
                <p>No active emergencies.<br/>All clear.</p>
              </div>
            )}
          </div>
        </div>

        {/* Support Tickets Section */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} /> Support Tickets
          </h3>
          
          <div className="table-container" style={{ flexGrow: 1 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ticket.user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{ticket.subject}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{ticket.description.substring(0, 50)}...</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="var(--text-muted)" /> {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <select 
                        className="input-modern"
                        style={{ appearance: 'none', padding: '6px 12px', minHeight: 'auto', fontSize: '0.75rem', width: '110px' }}
                        value={ticket.status} 
                        onChange={(e) => handleUpdateTicketStatus(ticket._id, e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No support tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
      {/* Add keyframe for pulsing alert */}
      <style>{`
        @keyframes alert-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-alert {
          animation: alert-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
