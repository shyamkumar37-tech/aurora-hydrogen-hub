import React, { useState, useEffect } from 'react';
import { Truck, Plus, Shield, User, Fuel, Activity, Trash2, CheckCircle2, AlertCircle, X, Leaf } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function FleetManager({ isOpen, onClose }) {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({ totalVehicles: 0, activeVehicles: 0, totalCapacityKg: 0, totalDispensedKg: 0, co2SavedKg: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New vehicle form state
  const [formData, setFormData] = useState({
    vin: '',
    plateNumber: '',
    model: 'Hyundai XCIENT Fuel Cell 4x2',
    vehicleType: 'Heavy Duty Truck',
    tankCapacityKg: 35,
    pressureRating: '700 bar',
    driverName: '',
    driverPhone: '',
    dailyLimitKg: 30
  });

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fleet');
      if (res.data.success) {
        setVehicles(res.data.data || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to fetch fleet', err);
      toast.error('Could not load corporate fleet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFleet();
    }
  }, [isOpen]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!formData.vin || !formData.plateNumber || !formData.model || !formData.driverName) {
      toast.error('Please fill in all required vehicle and driver fields');
      return;
    }

    try {
      const res = await api.post('/fleet', {
        vin: formData.vin,
        plateNumber: formData.plateNumber,
        model: formData.model,
        vehicleType: formData.vehicleType,
        tankCapacityKg: Number(formData.tankCapacityKg),
        pressureRating: formData.pressureRating,
        assignedDriver: {
          name: formData.driverName,
          phone: formData.driverPhone
        },
        dailyLimitKg: Number(formData.dailyLimitKg)
      });

      if (res.data.success) {
        toast.success(`Vehicle ${formData.plateNumber} added to fleet!`);
        setShowAddModal(false);
        setFormData({
          vin: '',
          plateNumber: '',
          model: 'Hyundai XCIENT Fuel Cell 4x2',
          vehicleType: 'Heavy Duty Truck',
          tankCapacityKg: 35,
          pressureRating: '700 bar',
          driverName: '',
          driverPhone: '',
          dailyLimitKg: 30
        });
        fetchFleet();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error registering vehicle';
      toast.error(msg);
    }
  };

  const handleDeleteVehicle = async (id, plate) => {
    if (!window.confirm(`Are you sure you want to remove ${plate} from your corporate fleet?`)) return;
    try {
      await api.delete(`/fleet/${id}`);
      toast.success(`Removed ${plate}`);
      fetchFleet();
    } catch (err) {
      toast.error('Failed to remove vehicle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, backdropFilter: 'blur(12px)', background: 'rgba(3, 7, 18, 0.88)' }}>
      <div style={{
        background: 'linear-gradient(145deg, #090e1a 0%, #040711 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '32px',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 50px rgba(6, 182, 212, 0.12)',
        position: 'relative',
        color: '#ffffff'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <Truck size={24} color="#06b6d4" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Corporate Fleet Command Portal</h2>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>B2B Logistics, Multi-Vehicle Telemetry & Driver Quotas</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              <span>Add Fleet Vehicle</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '12px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Fleet KPI Metric Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={14} color="#06b6d4" /> Total Fleet Vehicles
            </span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', display: 'block', marginTop: '6px' }}>
              {stats.totalVehicles || 0}
            </span>
            <span style={{ fontSize: '11px', color: '#10b981' }}>{stats.activeVehicles || 0} In Active Service</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fuel size={14} color="#38bdf8" /> Fleet Tank Capacity
            </span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8', display: 'block', marginTop: '6px' }}>
              {stats.totalCapacityKg || 0} <span style={{ fontSize: '14px' }}>kg H₂</span>
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>700 bar Cryo-Compressed</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#f59e0b" /> Lifetime Dispensed
            </span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', display: 'block', marginTop: '6px' }}>
              {stats.totalDispensedKg || 0} <span style={{ fontSize: '14px' }}>kg</span>
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>B2B Central Invoicing</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Leaf size={14} color="#10b981" /> Net CO₂ Abatement
            </span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', display: 'block', marginTop: '6px' }}>
              {stats.co2SavedKg || 0} <span style={{ fontSize: '14px' }}>kg CO₂</span>
            </span>
            <span style={{ fontSize: '11px', color: '#10b981' }}>100% Zero Tailpipe Emission</span>
          </div>
        </div>

        {/* Fleet Vehicles List */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Registered Fleet Roster ({vehicles.length})
          </h3>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading fleet registry...</div>
          ) : vehicles.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <Truck size={40} color="#64748b" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: '0 0 12px 0', color: '#94a3b8' }}>No corporate vehicles registered in this account yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#06b6d4',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Register First Fleet Vehicle
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {vehicles.map((v) => (
                <div
                  key={v._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '18px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {v.vehicleType}
                      </span>
                      <h4 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                        {v.plateNumber}
                      </h4>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: v.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: v.status === 'Active' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${v.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      {v.status}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#cbd5e1' }}>
                    {v.model}
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8' }}>
                      <span>Driver:</span>
                      <strong style={{ color: '#ffffff' }}>{v.assignedDriver?.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8' }}>
                      <span>Tank Spec:</span>
                      <span style={{ color: '#06b6d4' }}>{v.tankCapacityKg} kg ({v.pressureRating})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Daily Fuel Quota:</span>
                      <span style={{ color: '#f59e0b' }}>{v.dailyLimitKg} kg / day</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                      VIN: {v.vin.slice(0, 10)}...
                    </span>
                    <button
                      onClick={() => handleDeleteVehicle(v._id, v.plateNumber)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.8
                      }}
                      title="Remove Vehicle"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Vehicle Sub-Modal */}
        {showAddModal && (
          <div className="modal-overlay" style={{ zIndex: 1300, background: 'rgba(0,0,0,0.85)' }}>
            <div style={{
              background: '#0a0f1d',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              padding: '28px',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Add Corporate Fleet Vehicle</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddVehicle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Plate Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. KA-01-H2-9988"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>VIN Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. H2TRUCK9988"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Vehicle Model *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyundai XCIENT Fuel Cell / Nikola Tre"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                    >
                      <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                      <option value="City Transit Bus">City Transit Bus</option>
                      <option value="Delivery Van">Delivery Van</option>
                      <option value="Passenger Sedan">Passenger Sedan</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Tank Capacity (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.tankCapacityKg}
                      onChange={(e) => setFormData({ ...formData, tankCapacityKg: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Assigned Driver Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Chandra"
                      value={formData.driverName}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Daily Fuel Quota (kg)</label>
                    <input
                      type="number"
                      value={formData.dailyLimitKg}
                      onChange={(e) => setFormData({ ...formData, dailyLimitKg: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm & Enroll Vehicle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#94a3b8',
                      borderRadius: '10px',
                      padding: '10px 18px',
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
    </div>
  );
}
