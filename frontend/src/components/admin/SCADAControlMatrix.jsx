import { useState, useEffect } from 'react';
import { Activity, Power, AlertTriangle, ShieldCheck, Thermometer, Gauge, Zap, Check, RefreshCw } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function SCADAControlMatrix({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSCADA = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/scada');
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Admin session expired or unauthorized. Please re-login.');
      } else {
        toast.error('Failed to load SCADA telemetry');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSCADA();
  }, []);

  const handleToggleESD = async (stationId, dispenserId, currentStatus) => {
    const isShutoff = currentStatus === 'available' || currentStatus === 'active';
    try {
      setActionLoading(true);
      await api.post('/admin/scada/emergency-shutoff', {
        stationId,
        dispenserId,
        active: isShutoff
      });
      toast.success(isShutoff ? '🚨 Emergency ESD Activated!' : '✅ Dispenser Reset & Online');
      fetchSCADA();
    } catch (err) {
      toast.error('Emergency command failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(239, 68, 68, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '6px', borderRadius: '10px' }}>
                <Zap size={20} color="#ef4444" />
              </div>
              <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Central SCADA & Industrial Automation
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Remote Emergency Control & Valve Matrix
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={fetchSCADA}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#06b6d4', borderRadius: '12px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Grid Safety Index</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{data?.gridSafetyIndex || '99.4%'}</span>
            <span style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginTop: '2px' }}>Normal operating bounds</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Chiller Loop Temp</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#06b6d4' }}>{data?.chillerTempAvg || '-38.4°C'}</span>
            <span style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginTop: '2px' }}>SAE J2601 T40 Nominal</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Compressor Efficiency</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{data?.compressorHealth || '98.6%'}</span>
            <span style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginTop: '2px' }}>900 bar ionic liquid stage</span>
          </div>
        </div>

        {/* Remote Dispensers Control List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Live Dispensers & Emergency Shutoff Valves
          </span>

          {loading ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: '24px' }}>Loading SCADA valves...</div>
          ) : (
            (data?.dispensers || []).map(disp => {
              const isOffline = disp.status === 'offline' || disp.status === 'maintenance';
              return (
                <div 
                  key={disp._id}
                  style={{
                    background: isOffline ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isOffline ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '16px',
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Gauge size={20} color={isOffline ? '#ef4444' : '#10b981'} />
                    </div>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'block' }}>
                        Pump #{disp.dispenserNumber} — {disp.stationId?.name || 'Main Station'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                        Pressure: {disp.pressureType || '700 bar'} · Protocol: SAE J2601 Fast · Status: <b style={{ color: isOffline ? '#ef4444' : '#10b981' }}>{disp.status.toUpperCase()}</b>
                      </span>
                    </div>
                  </div>

                  <div>
                    <button 
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleToggleESD(null, disp._id, disp.status)}
                      style={{
                        background: isOffline ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: actionLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isOffline ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      <Power size={14} />
                      <span>{isOffline ? 'RESET / RESUME' : 'EMERGENCY SHUTOFF (ESD)'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
