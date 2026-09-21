import { useState, useEffect } from 'react';
import { Shield, FileText, Download, Filter, Search, Terminal, RefreshCw } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function AuditForensicsViewer({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data || []);
    } catch (err) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    const header = "Timestamp,Action,Entity,IP Address,User ID,Details\n";
    const rows = logs.map(l => 
      `"${new Date(l.createdAt).toISOString()}","${l.action}","${l.entity}","${l.ipAddress || '127.0.0.1'}","${l.user || 'SYSTEM'}","${(l.details || '').replace(/"/g, '""')}"`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurora_security_audit_log_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Security audit log exported as CSV!');
  };

  const filteredLogs = logs.filter(l => 
    l.action?.toLowerCase().includes(search.toLowerCase()) || 
    l.entity?.toLowerCase().includes(search.toLowerCase()) ||
    l.ipAddress?.includes(search)
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(16, 185, 129, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <Terminal size={20} color="#10b981" />
              </div>
              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ISO-27001 Security & SIEM Forensics
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Live Security Audit Trail & Event Logs
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleExportCSV}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text"
            placeholder="Search audit trail by action (e.g. LOGIN, UPDATE, SHUTOFF), entity, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 14px', fontSize: '13px' }}
          />
        </div>

        {/* Logs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: '24px' }}>No security log records found.</div>
          ) : (
            filteredLogs.map(log => (
              <div 
                key={log._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
              >
                <div>
                  <span style={{ color: '#10b981', fontWeight: '700', marginRight: '10px' }}>[{log.action}]</span>
                  <span style={{ color: '#ffffff' }}>{log.entity}</span>
                  <span style={{ color: '#71717a', marginLeft: '10px' }}>IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>
                <span style={{ color: '#a1a1aa' }}>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
