import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/api';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  Fuel, 
  CheckCircle2, 
  Send, 
  Printer, 
  UserCheck, 
  ShieldAlert, 
  Layers, 
  TrendingUp,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

import { printShiftHandoverPDF, exportToCSV } from '../utils/reportExportUtils';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function StaffShiftReport() {
  const { user } = useContext(AuthContext);
  const { selectedStationId, activeStation, activeShift, fetchStationData } = useOutletContext();

  const [handoverNotes, setHandoverNotes] = useState('');
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Safety checklist state for handover inspection
  const [checklist, setChecklist] = useState({
    groundingClampChecked: true,
    nozzleSealsInspected: true,
    ventStackValveClear: true,
    vaporSensorsGreen: true,
    emergencyStopTested: true
  });

  const fetchShiftHistory = async () => {
    if (!selectedStationId) return;
    try {
      const { data } = await api.get(`/stations/${selectedStationId}/shifts/logs`);
      setShiftLogs(data);
    } catch (err) {
      console.error('Failed to load shift logs', err);
    }
  };

  useEffect(() => {
    fetchShiftHistory();
  }, [selectedStationId]);

  const handleEndShift = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;
    setLoading(true);

    try {
      // First save safety checklist if active
      await api.post(`/stations/${selectedStationId}/shifts/checklist`, checklist);

      // Then end shift
      const { data } = await api.post(`/stations/${selectedStationId}/shifts/end`, {
        handoverNotes
      });

      setSummaryData(data.summary);
      toast.success('Shift ended and handover log published!');
      setHandoverNotes('');
      fetchStationData();
      fetchShiftHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete shift handover');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    printShiftHandoverPDF(summaryData || {
      duration: '8.0',
      h2DispensedKg: '142.5',
      vehiclesServiced: '28',
      notes: handoverNotes || 'Normal shift operations completed.'
    }, activeStation, user);
  };

  const handleExportCSV = () => {
    const headers = [
      { key: '_id', label: 'Shift ID' },
      { key: 'operatorName', label: 'Operator' },
      { key: 'shiftStart', label: 'Shift Start' },
      { key: 'shiftEnd', label: 'Shift End' },
      { key: 'notes', label: 'Handover Notes' },
      { key: 'safetyChecklistPassed', label: 'Safety Passed' }
    ];

    const rows = shiftLogs.map(s => ({
      _id: s._id,
      operatorName: s.operator?.name || user?.name || 'Operator',
      shiftStart: new Date(s.shiftStart).toLocaleString(),
      shiftEnd: s.shiftEnd ? new Date(s.shiftEnd).toLocaleString() : 'In Progress',
      notes: s.handoverNotes || 'None',
      safetyChecklistPassed: s.safetyChecklistPassed ? 'YES' : 'NO'
    }));

    exportToCSV(`Shift_Logs_${activeStation?.name || 'Station'}`, rows, headers);
    toast.success('Shift logs exported to CSV!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#f8fafc', margin: 0 }}>
            Shift Handover & Daily Reconciliation
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Station: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{activeStation?.name || 'Assigned Station'}</span> • Shift Audits & Logs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {shiftLogs.length > 0 && (
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#34d399',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <FileText size={16} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
            }}
          >
            <Printer size={16} />
            <span>Generate Shift PDF</span>
          </button>
        </div>
      </div>

      {/* Active Shift Handover Form & Live Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Current Shift Summary Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Active Shift Telemetry</h2>
            </div>
            <span style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '20px',
              background: activeShift ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: activeShift ? '#34d399' : '#f87171',
              fontWeight: '700'
            }}>
              {activeShift ? 'IN PROGRESS' : 'NOT CLOCKED IN'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Shift Start</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc' }}>
                {activeShift ? new Date(activeShift.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Shift Safety Pass</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: activeShift?.safetyChecklistPassed ? '#34d399' : '#fbbf24' }}>
                {activeShift?.safetyChecklistPassed ? 'Verified ✅' : 'Pending Check ⚠️'}
              </span>
            </div>
          </div>

          {/* Handover Notes Input */}
          <form onSubmit={handleEndShift}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
              Handover Log & Notes for Next Operator
            </label>
            <textarea
              rows={4}
              placeholder="e.g., Nozzle #2 700-bar valve calibrated at 14:00. Tank storage stable at 450 kg. Grounding clamp inspect OK."
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              disabled={!activeShift}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '0.875rem',
                resize: 'vertical',
                marginBottom: '16px',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={!activeShift || loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: !activeShift || loading ? 'not-allowed' : 'pointer',
                opacity: !activeShift || loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Finalizing Handover...' : 'Complete Shift & Publish Handover'}</span>
            </button>
          </form>

        </div>

        {/* Pre-Shift / Handover Safety Checklist Verification */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <UserCheck size={20} color="#34d399" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Daily Safety Protocols</h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
            Mandatory hydrogen station standard safety checks. Must be confirmed before shift completion.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          </div>

        </div>

      </div>

      {/* Shift History & Reconciliation Logs */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '24px',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <History size={20} color="#38bdf8" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Past Shift Reconciliation Logs</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 14px' }}>Staff Operator</th>
                <th style={{ padding: '12px 14px' }}>Shift Window</th>
                <th style={{ padding: '12px 14px' }}>H₂ Dispensed</th>
                <th style={{ padding: '12px 14px' }}>Revenue</th>
                <th style={{ padding: '12px 14px' }}>Transactions</th>
                <th style={{ padding: '12px 14px' }}>Handover Notes</th>
                <th style={{ padding: '12px 14px' }}>Safety</th>
              </tr>
            </thead>
            <tbody>
              {shiftLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No shift handover logs recorded yet for this station.
                  </td>
                </tr>
              ) : (
                shiftLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#f8fafc' }}>
                      {log.staffUser?.name || 'Operator'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                      {new Date(log.shiftStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      ({new Date(log.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {log.shiftEnd ? new Date(log.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'})
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#38bdf8' }}>
                      {log.totalKgDispensed?.toFixed(1) || 0} kg
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#34d399' }}>
                      ${log.totalRevenue?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                      {log.transactionsCount || 0} sessions
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1', maxWidth: '280px', fontSize: '0.8rem' }}>
                      {log.handoverNotes || 'Standard shift completion.'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: log.safetyChecklistPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: log.safetyChecklistPassed ? '#34d399' : '#fbbf24',
                        fontWeight: '600'
                      }}>
                        {log.safetyChecklistPassed ? 'Passed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
