import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/api';
import socket from '../socket';
import { 
  Fuel, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  PlusCircle, 
  Radio, 
  Gauge, 
  ShieldCheck, 
  ArrowUpRight, 
  FileText,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffInventory() {
  const { selectedStationId, activeStation, fetchStationData } = useOutletContext();

  const [inventory, setInventory] = useState(null);
  const [refillLogs, setRefillLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tanker Delivery Intake Modal
  const [tankerModalOpen, setTankerModalOpen] = useState(false);
  const [tankerData, setTankerData] = useState({
    carrier: 'Air Liquide Hydrogen Logistics',
    tankerId: 'H2-TN-8802',
    batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
    quantityAddedKg: '250',
    tankPressureAfterBar: '700',
    notes: 'Standard cryogenic tanker delivery, pressure verified.'
  });

  // Restock Request Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockAmount, setRestockAmount] = useState('500');
  const [restockUrgent, setRestockUrgent] = useState(false);
  const [restockNotes, setRestockNotes] = useState('');

  const fetchInventoryAndRefills = async () => {
    if (!selectedStationId) return;
    setLoading(true);
    try {
      const [invRes, refillsRes] = await Promise.allSettled([
        api.get('/inventory'),
        api.get(`/stations/${selectedStationId}/refills`)
      ]);

      if (invRes.status === 'fulfilled') {
        const stationInv = invRes.value.data.find(i => i.station?._id === selectedStationId || i.station === selectedStationId);
        setInventory(stationInv || null);
      }

      if (refillsRes.status === 'fulfilled') {
        setRefillLogs(refillsRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load inventory logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAndRefills();
  }, [selectedStationId]);

  useEffect(() => {
    const handleInv = () => fetchInventoryAndRefills();
    socket.on('inventoryUpdated', handleInv);
    return () => socket.off('inventoryUpdated', handleInv);
  }, [selectedStationId]);

  // Log Tanker Delivery Submit
  const handleTankerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;

    try {
      const { data } = await api.post(`/stations/${selectedStationId}/refills`, tankerData);
      toast.success(data.message || 'Tanker delivery logged & storage replenished!');
      setTankerModalOpen(false);
      fetchInventoryAndRefills();
      fetchStationData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record tanker refill');
    }
  };

  // Submit Restock Request Ticket
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;

    try {
      const { data } = await api.post(`/stations/${selectedStationId}/restock-request`, {
        requestedKg: Number(restockAmount),
        urgent: restockUrgent,
        message: restockNotes
      });
      toast.success(data.message || 'Restock request dispatched to logistics!');
      setRestockModalOpen(false);
      setRestockNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit restock request');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#f8fafc', margin: 0 }}>
            H₂ Tanker Logistics & Storage Monitoring
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Station: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{activeStation?.name || 'Assigned Terminal'}</span> • Tank Inventory & Supply Deliveries
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setTankerModalOpen(true)}
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
            <Truck size={18} />
            <span>Intake Tanker Delivery</span>
          </button>

          <button
            onClick={() => setRestockModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <AlertTriangle size={18} />
            <span>Request Emergency Supply</span>
          </button>
        </div>
      </div>

      {/* Storage Tank Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Main Tank Gauge Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Fuel size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Cryogenic Storage Tank</h2>
            </div>
            <span style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '20px',
              background: inventory?.isLowStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: inventory?.isLowStock ? '#f87171' : '#34d399',
              fontWeight: '700'
            }}>
              {inventory?.isLowStock ? 'RESTOCK REQUIRED' : 'STORAGE HEALTHY'}
            </span>
          </div>

          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
            {inventory?.currentStock || 0} <span style={{ fontSize: '1.2rem', color: '#38bdf8' }}>kg H₂</span>
          </div>

          {/* Visual Storage Bar */}
          <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, ((inventory?.currentStock || 0) / 1000) * 100)}%`,
              background: inventory?.isLowStock ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)',
              transition: 'width 0.5s ease'
            }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
            <div>
              <span>Safety Threshold: </span>
              <strong style={{ color: '#f8fafc' }}>{inventory?.threshold || 100} kg</strong>
            </div>
            <div>
              <span>Last Refill: </span>
              <strong style={{ color: '#f8fafc' }}>
                {inventory?.lastRefillAt ? new Date(inventory.lastRefillAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
              </strong>
            </div>
          </div>
        </div>

        {/* Compression & Pressure Status */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Gauge size={20} color="#34d399" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>Compressor & Pressure</h2>
            </div>
            <span style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontWeight: '700'
            }}>
              NORMAL OPERATING
            </span>
          </div>

          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#34d399', marginBottom: '8px' }}>
            {activeStation?.currentPressureBar || 700} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>BAR</span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
            Type-IV Composite Buffer cylinders pressurized for dual 700-bar H70 and 350-bar H35 dispensers.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>H70 Buffer</span>
              <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>700 Bar OK</strong>
            </div>
            <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>H35 Buffer</span>
              <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>350 Bar OK</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Tanker Delivery Intake Logs Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '24px',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
              Tanker Delivery & Refill Log History
            </h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Showing last {refillLogs.length} shipments
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 14px' }}>Delivery Timestamp</th>
                <th style={{ padding: '12px 14px' }}>H₂ Carrier / Supplier</th>
                <th style={{ padding: '12px 14px' }}>Tanker & Batch</th>
                <th style={{ padding: '12px 14px' }}>Quantity Added</th>
                <th style={{ padding: '12px 14px' }}>Pressure After</th>
                <th style={{ padding: '12px 14px' }}>Logged By</th>
                <th style={{ padding: '12px 14px' }}>Purity Certificate</th>
              </tr>
            </thead>
            <tbody>
              {refillLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No tanker delivery logs recorded yet. Click "Intake Tanker Delivery" to log a shipment.
                  </td>
                </tr>
              ) : (
                refillLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', color: '#f8fafc' }}>
                      {new Date(log.deliveredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {new Date(log.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#38bdf8' }}>
                      {log.carrier}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#f8fafc', fontWeight: '600' }}>{log.tankerId}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Batch: {log.batchNumber}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: '#34d399' }}>
                      +{log.quantityAddedKg} kg
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                      {log.tankPressureAfterBar || 700} Bar
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                      {log.loggedBy?.name || 'Operator'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        <ShieldCheck size={12} />
                        <span>99.999% Pure</span>
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
      {/* TANKER INTAKE MODAL */}
      {/* ======================================================== */}
      {tankerModalOpen && (
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
            maxWidth: '520px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setTankerModalOpen(false)}
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
              <Truck size={24} color="#38bdf8" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Hydrogen Tanker Delivery Intake
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Record bulk hydrogen delivery into station storage buffer tanks.
            </p>

            <form onSubmit={handleTankerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Carrier / Supplier
                </label>
                <input
                  type="text"
                  value={tankerData.carrier}
                  onChange={(e) => setTankerData({ ...tankerData, carrier: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                    Tanker Truck ID
                  </label>
                  <input
                    type="text"
                    value={tankerData.tankerId}
                    onChange={(e) => setTankerData({ ...tankerData, tankerId: e.target.value })}
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
                    Batch / Purity Pass ID
                  </label>
                  <input
                    type="text"
                    value={tankerData.batchNumber}
                    onChange={(e) => setTankerData({ ...tankerData, batchNumber: e.target.value })}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                    Delivered Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={tankerData.quantityAddedKg}
                    onChange={(e) => setTankerData({ ...tankerData, quantityAddedKg: e.target.value })}
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
                    Storage Pressure After (Bar)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tankerData.tankPressureAfterBar}
                    onChange={(e) => setTankerData({ ...tankerData, tankPressureAfterBar: e.target.value })}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Intake Notes
                </label>
                <input
                  type="text"
                  value={tankerData.notes}
                  onChange={(e) => setTankerData({ ...tankerData, notes: e.target.value })}
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
                  Verify & Log Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setTankerModalOpen(false)}
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

      {/* ======================================================== */}
      {/* RESTOCK DISPATCH MODAL */}
      {/* ======================================================== */}
      {restockModalOpen && (
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
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setRestockModalOpen(false)}
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
              <AlertTriangle size={24} color="#ef4444" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Request Supply Tanker Dispatch
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Dispatch an urgent supply reorder request to central logistics and station administration.
            </p>

            <form onSubmit={handleRestockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Requested Quantity (kg)
                </label>
                <input
                  type="number"
                  step="50"
                  min="50"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
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
                  Urgency Level
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f87171', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={restockUrgent}
                    onChange={(e) => setRestockUrgent(e.target.checked)}
                    style={{ accentColor: '#ef4444', width: '16px', height: '16px' }}
                  />
                  <span>Mark as CRITICAL / Tanker Needed within 2 Hours</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Reason / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. High fleet traffic arriving this afternoon, buffer dropping below 15%."
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Send Dispatch Alert
                </button>
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
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
