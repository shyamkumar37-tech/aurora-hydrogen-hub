import { useState, useEffect } from 'react';
import { Car, Plus, Check, Trash2, Shield, BatteryCharging, Gauge, Sparkles } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function GarageManager({ onClose, onVehicleChanged }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [fuelType, setFuelType] = useState('700 bar Hydrogen');
  const [tankCapacityKg, setTankCapacityKg] = useState('5.6');
  const [efficiencyKgPer100Km, setEfficiencyKgPer100Km] = useState('0.95');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles/my');
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.vehicles ? data.vehicles : (data ? [data] : []));
      setVehicles(list);
    } catch (err) {
      console.error('Failed to load garage', err);
      toast.error('Failed to load garage vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleActivate = async (id) => {
    try {
      const res = await api.put(`/vehicles/${id}/activate`);
      toast.success(res.data.message || 'Vehicle activated');
      fetchVehicles();
      if (onVehicleChanged) onVehicleChanged(res.data.vehicle);
    } catch (err) {
      toast.error('Could not switch active vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this vehicle from your garage?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle removed');
      fetchVehicles();
    } catch (err) {
      toast.error('Could not remove vehicle');
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const cleanModel = model.trim();
    const cleanMake = make.trim();
    const fullModel = cleanMake ? `${cleanMake} ${cleanModel}`.trim() : cleanModel;

    if (!fullModel) {
      toast.error('Please enter vehicle model or manufacturer');
      return;
    }
    if (!plateNumber) {
      toast.error('Please enter a license plate number');
      return;
    }
    try {
      const res = await api.post('/vehicles', {
        make: cleanMake,
        model: fullModel,
        plateNumber: plateNumber.trim().toUpperCase(),
        fuelType,
        tankCapacityKg: Number(tankCapacityKg),
        efficiencyKgPer100Km: Number(efficiencyKgPer100Km)
      });
      toast.success('Vehicle added to your Aurora Garage!');
      setShowAddForm(false);
      setMake('');
      setModel('');
      setPlateNumber('');
      fetchVehicles();
      if (onVehicleChanged) onVehicleChanged(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add vehicle');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '760px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(6, 182, 212, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <Car size={20} color="#06b6d4" />
              </div>
              <span style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Multi-Vehicle Fleet & Diagnostics
              </span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Virtual Hydrogen Garage
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: showAddForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              {showAddForm ? 'Cancel' : 'Add Vehicle'}
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Add Vehicle Form */}
        {showAddForm && (
          <form onSubmit={handleAddVehicle} style={{
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '18px',
            padding: '24px',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Add Real Hydrogen Vehicle</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Make / Manufacturer</label>
                <input 
                  type="text"
                  list="garage-makes-list"
                  placeholder="e.g. Tata Motors, Hyundai" 
                  value={make} 
                  onChange={(e) => setMake(e.target.value)} 
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
                <datalist id="garage-makes-list">
                  <option value="Tata Motors" />
                  <option value="Hyundai" />
                  <option value="Ashok Leyland" />
                  <option value="Toyota" />
                  <option value="Mahindra" />
                  <option value="Reliance H2" />
                  <option value="Eicher Motors" />
                </datalist>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Vehicle Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nexo, Starbus H2, Swift" 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)} 
                  required
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Plate Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. TN-09-H2-7777" 
                  value={plateNumber} 
                  onChange={(e) => setPlateNumber(e.target.value)} 
                  required
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nozzle / Pressure Rating</label>
                <select 
                  value={fuelType} 
                  onChange={(e) => setFuelType(e.target.value)}
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                >
                  <option value="700 bar Hydrogen">700 bar (Fast-Dispense)</option>
                  <option value="350 bar Hydrogen">350 bar (Standard)</option>
                  <option value="Cryogenic Liquid H2">Cryogenic Liquid H2</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Tank Capacity (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={tankCapacityKg} 
                  onChange={(e) => setTankCapacityKg(e.target.value)} 
                  required
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Save Vehicle
              </button>
            </div>
          </form>
        )}

        {/* Vehicles Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(Array.isArray(vehicles) ? vehicles : []).map(veh => {
            const isActive = veh.isActive;

            return (
              <div 
                key={veh._id}
                style={{
                  background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isActive ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '18px',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Car size={24} color={isActive ? '#06b6d4' : '#a1a1aa'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>{veh.model}</span>
                      {isActive && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', fontSize: '10px', fontWeight: '700', padding: '2px 8px' }}>
                          ACTIVE CAR
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                      <span style={{ color: '#d4d4d8' }}>{veh.plateNumber}</span>
                      <span>•</span>
                      <span>{veh.fuelType}</span>
                      <span>•</span>
                      <span>{veh.tankCapacityKg} kg Tank</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right', marginRight: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block' }}>Range</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#06b6d4' }}>{veh.estimatedRangeKm || 420} km</span>
                  </div>

                  {!isActive && (
                    <button 
                      onClick={() => handleActivate(veh._id)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#d4d4d8',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Set Active
                    </button>
                  )}

                  {vehicles.length > 1 && (
                    <button 
                      onClick={() => handleDelete(veh._id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        padding: '8px',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                      title="Delete vehicle"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
