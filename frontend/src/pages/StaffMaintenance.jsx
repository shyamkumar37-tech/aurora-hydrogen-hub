import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/api';
import socket from '../socket';
import { 
  Wrench, 
  AlertTriangle, 
  Power, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Radio, 
  Sliders, 
  Layers, 
  PlusCircle,
  FileWarning,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffMaintenance() {
  const { selectedStationId, activeStation, fetchStationData } = useOutletContext();

  const [dispensers, setDispensers] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Safety checklist state
  const [checklist, setChecklist] = useState({
    groundingClampChecked: true,
    nozzleSealsInspected: true,
    ventStackValveClear: true,
    vaporSensorsGreen: true,
    emergencyStopTested: true
  });

  // New Maintenance Log Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logData, setLogData] = useState({
    dispenserId: '',
    issue: '',
    technician: 'On-Duty Station Operator',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    status: 'in-progress'
  });

  const fetchMaintenanceData = async () => {
    if (!selectedStationId) return;
    setLoading(true);
    try {
      const [dispRes, logsRes] = await Promise.allSettled([
        api.get(`/dispensers/station/${selectedStationId}`),
        api.get('/maintenance')
      ]);

      if (dispRes.status === 'fulfilled') {
        setDispensers(dispRes.value.data);
      }

      if (logsRes.status === 'fulfilled') {
        const stationLogs = logsRes.value.data.filter(l => 
          l.station?._id === selectedStationId || l.station === selectedStationId
        );
        setMaintenanceLogs(stationLogs);
      }
    } catch (err) {
      console.error('Failed to load maintenance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, [selectedStationId]);

  useEffect(() => {
    const handleDispenser = () => fetchMaintenanceData();
    socket.on('dispenser_status_changed', handleDispenser);
    return () => socket.off('dispenser_status_changed', handleDispenser);
  }, [selectedStationId]);

  // E-Stop Toggle
  const handleEmergencyStopToggle = async () => {
    const confirm = window.confirm(
      activeStation?.emergencyStop 
        ? 'Deactivate emergency stop and restore dispensers to available?'
        : '⚠️ DANGER: Activate Emergency Stop? All station dispensers will be locked offline!'
    );

    if (!confirm) return;

    try {
      const { data } = await api.post(`/stations/${selectedStationId}/emergency-stop`);
      toast.success(data.message);
      fetchStationData();
      fetchMaintenanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle emergency stop');
    }
  };

  // Toggle Dispenser status directly
  const handleDispenserStatusChange = async (dispenserId, newStatus) => {
    try {
      await api.put(`/dispensers/${dispenserId}`, { status: newStatus });
      toast.success(`Dispenser status set to ${newStatus}`);
      fetchMaintenanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update dispenser status');
    }
  };

  // Submit Safety Checklist
  const handleSafetyChecklistSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;

    try {
      const { data } = await api.post(`/stations/${selectedStationId}/shifts/checklist`, checklist);
      toast.success(data.message || 'Safety checklist verified and logged!');
      fetchStationData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit checklist');
    }
  };

  // Submit Maintenance Incident Log
  const handleMaintenanceLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;

    try {
      await api.post('/maintenance', {
        station: selectedStationId,
        dispenser: logData.dispenserId || undefined,
        issue: logData.issue,
        technician: logData.technician,
        startTime: logData.startTime,
        endTime: logData.endTime,
        status: logData.status
      });

      // If dispenser was selected, put in maintenance
      if (logData.dispenserId && logData.status !== 'completed') {
        await api.put(`/dispensers/${logData.dispenserId}`, { status: 'maintenance' });
      }

      toast.success('Maintenance event recorded successfully!');
      setLogModalOpen(false);
      setLogData({
        dispenserId: '',
        issue: '',
        technician: 'On-Duty Station Operator',
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        status: 'in-progress'
      });
      fetchMaintenanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record maintenance log');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#f8fafc', margin: 0 }}>
            Safety Interlocks & Dispenser Maintenance
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Station: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{activeStation?.name || 'Assigned Terminal'}</span> • Safety Shutdowns & Nozzle Servicing
          </p>
        </div>

        <button
          onClick={() => setLogModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          <PlusCircle size={18} />
          <span>Log Maintenance Event</span>
        </button>
      </div>

      {/* Emergency Stop Hero Card */}
      <div style={{
        background: activeStation?.emergencyStop ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(153, 27, 27, 0.3) 100%)' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.7) 100%)',
        border: activeStation?.emergencyStop ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '20px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: activeStation?.emergencyStop ? '0 0 40px rgba(239, 68, 68, 0.35)' : 'none'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AlertTriangle size={24} color={activeStation?.emergencyStop ? '#ef4444' : '#fbbf24'} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Station Emergency Safety Interlock (E-STOP)
            </h2>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            Activating E-Stop immediately isolates cryogenic valve solenoids, closes pressure lines, and places all dispensers in locked SAFE OFFLINE mode.
          </p>
        </div>

        <button
          onClick={handleEmergencyStopToggle}
          style={{
            padding: '14px 28px',
            borderRadius: '14px',
            background: activeStation?.emergencyStop ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '1rem',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            boxShadow: activeStation?.emergencyStop ? '0 0 20px rgba(16, 185, 129, 0.5)' : '0 0 24px rgba(239, 68, 68, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Power size={20} />
          <span>{activeStation?.emergencyStop ? 'OVERRIDE & RESTORE STATION' : 'TRIGGER EMERGENCY STOP'}</span>
        </button>
      </div>

      {/* Split Grid: Dispenser Controls + Daily Safety Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Dispensers Maintenance Controls */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sliders size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
              Individual Dispenser Controls
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {dispensers.map((d, idx) => (
              <div
                key={d._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.95rem' }}>
                    Dispenser #{idx + 1} — {d.nozzleType}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {d.pressureRating || 700} Bar • Status: <strong style={{ color: d.status === 'available' ? '#34d399' : d.status === 'in-use' ? '#38bdf8' : '#f87171' }}>{d.status}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleDispenserStatusChange(d._id, 'available')}
                    disabled={d.status === 'available'}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: d.status === 'available' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: d.status === 'available' ? 'default' : 'pointer'
                    }}
                  >
                    Online
                  </button>

                  <button
                    onClick={() => handleDispenserStatusChange(d._id, 'maintenance')}
                    disabled={d.status === 'maintenance'}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: d.status === 'maintenance' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: d.status === 'maintenance' ? 'default' : 'pointer'
                    }}
                  >
                    Service
                  </button>

                  <button
                    onClick={() => handleDispenserStatusChange(d._id, 'offline')}
                    disabled={d.status === 'offline'}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: d.status === 'offline' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: d.status === 'offline' ? 'default' : 'pointer'
                    }}
                  >
                    Halt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Safety Checklist Module */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CheckCircle2 size={20} color="#34d399" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
              Daily Station Safety Checklist
            </h2>
          </div>

          <form onSubmit={handleSafetyChecklistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'groundingClampChecked', label: 'Static Grounding Clamp Verified & Secure' },
              { key: 'nozzleSealsInspected', label: '700 Bar / 350 Bar Nozzle O-Ring Seals Inspected' },
              { key: 'ventStackValveClear', label: 'Vent Stack Relief Valve Clear of Obstructions' },
              { key: 'vaporSensorsGreen', label: 'H2 Ambient Vapor Leak Sensors in Normal (Green) State' },
              { key: 'emergencyStopTested', label: 'Station Emergency Stop (E-Stop) Button Tested & Armed' }
            ].map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: checklist[item.key] ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: checklist[item.key] ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: checklist[item.key] ? '#e2e8f0' : '#94a3b8'
                }}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                />
                <span>{item.label}</span>
              </label>
            ))}

            <button
              type="submit"
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Verify & Log Safety Inspection
            </button>
          </form>
        </div>

      </div>

      {/* Maintenance Logs History Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '24px',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileWarning size={20} color="#fbbf24" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
              Maintenance & Safety Incident Logs
            </h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {maintenanceLogs.length} logged events
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 14px' }}>Issue Description</th>
                <th style={{ padding: '12px 14px' }}>Dispenser</th>
                <th style={{ padding: '12px 14px' }}>Technician / Operator</th>
                <th style={{ padding: '12px 14px' }}>Logged Time</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No active maintenance incidents reported for this station.
                  </td>
                </tr>
              ) : (
                maintenanceLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#f8fafc' }}>
                      {log.issue}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#38bdf8' }}>
                      {log.dispenser?.nozzleType || (log.dispenser ? 'Dispenser Unit' : 'Entire Station')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                      {log.technician}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                      {new Date(log.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: log.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : log.status === 'in-progress' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: log.status === 'completed' ? '#34d399' : log.status === 'in-progress' ? '#fbbf24' : '#f87171',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* LOG MAINTENANCE MODAL */}
      {/* ======================================================== */}
      {logModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setLogModalOpen(false)}
              style={{
                position: 'absolute',
                right: '18px',
                top: '18px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Wrench size={24} color="#38bdf8" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Log Maintenance or Fault Event
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Document nozzle recalibration, seal replacements, or pressure sensor anomalies.
            </p>

            <form onSubmit={handleMaintenanceLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Target Dispenser (Optional)
                </label>
                <select
                  value={logData.dispenserId}
                  onChange={(e) => setLogData({ ...logData, dispenserId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                >
                  <option value="">Entire Station / Terminal Buffer</option>
                  {dispensers.map((d, i) => (
                    <option key={d._id} value={d._id}>
                      Dispenser #{i + 1} ({d.nozzleType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Issue / Action Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Replaced 700-bar nozzle O-ring seal & tested pressure"
                  value={logData.issue}
                  onChange={(e) => setLogData({ ...logData, issue: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Technician / Handler
                </label>
                <input
                  type="text"
                  value={logData.technician}
                  onChange={(e) => setLogData({ ...logData, technician: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={logData.status}
                  onChange={(e) => setLogData({ ...logData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                >
                  <option value="in-progress">In Progress</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed & Verified</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Save Maintenance Log
                </button>
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
