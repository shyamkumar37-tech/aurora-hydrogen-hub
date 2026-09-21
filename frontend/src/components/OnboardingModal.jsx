import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Car, Phone, ShieldCheck, ArrowRight, Gauge, Sparkles, Building2, Fuel } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function OnboardingModal({ isOpen, onComplete, onSkip }) {
  const { updateUser } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [fuelType, setFuelType] = useState('700 bar Hydrogen');
  const [tankCapacityKg, setTankCapacityKg] = useState('5.6');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePressureChange = (e) => {
    const selectedType = e.target.value;
    setFuelType(selectedType);
    if (selectedType === '350 bar Hydrogen' && tankCapacityKg === '5.6') {
      setTankCapacityKg('15.0');
    } else if (selectedType === '700 bar Hydrogen' && tankCapacityKg === '15.0') {
      setTankCapacityKg('5.6');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanMake = make.trim();
    const cleanModel = model.trim();
    const cleanPlate = plateNumber.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanMake) {
      toast.error('Please enter your vehicle manufacturer / make');
      return;
    }
    if (!cleanModel) {
      toast.error('Please enter your vehicle model');
      return;
    }
    if (!cleanPlate) {
      toast.error('Please enter your vehicle license plate number');
      return;
    }
    if (cleanPhone && cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const fullVehicleModel = `${cleanMake} ${cleanModel}`.trim();
    const parsedCapacity = parseFloat(tankCapacityKg) || 5.6;

    setLoading(true);
    try {
      const payload = {
        phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : '',
        vehicleModel: fullVehicleModel,
        plateNumber: cleanPlate,
        fuelType,
        tankCapacityKg: parsedCapacity
      };

      const res = await api.post('/auth/onboarding', payload);
      updateUser(res.data.user);
      toast.success('Vehicle registered and linked to your profile!');
      onComplete?.();
    } catch (err) {
      console.error('Onboarding setup error:', err);
      const msg = err.response?.data?.message || 'Failed to save vehicle details. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(4, 6, 11, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(165deg, rgba(16, 22, 34, 0.98) 0%, rgba(8, 12, 20, 0.99) 100%)',
        border: '1px solid rgba(0, 210, 180, 0.35)',
        borderRadius: '22px',
        boxShadow: '0 24px 70px -10px rgba(0, 0, 0, 0.85), 0 0 35px -5px rgba(0, 210, 180, 0.2)',
        width: '100%',
        maxWidth: '520px',
        padding: '28px 26px',
        position: 'relative',
        animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Header Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 210, 180, 0.12)',
            border: '1px solid rgba(0, 210, 180, 0.35)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#00d2b4',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={13} />
            <span>AURORA HYDROGEN BUNK · VEHICLE REGISTRATION</span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '0.78rem',
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            Skip for now
          </button>
        </div>

        <h2 style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: 'Outfit, sans-serif',
          lineHeight: 1.25,
          marginBottom: '6px'
        }}>
          Register Your Fueling Profile
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Connect your real hydrogen vehicle credentials to enable automated dispenser optical check-in, correct pressure nozzle pairing, and SMS alerts.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Vehicle Make & Model */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={13} color="#00d2b4" />
                <span>Manufacturer / Make</span>
              </label>
              <input
                type="text"
                list="indian-makes-list"
                className="auth-input"
                placeholder="e.g. Tata Motors, Hyundai"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                style={{ width: '100%', height: '40px', fontSize: '14px' }}
                required
              />
              <datalist id="indian-makes-list">
                <option value="Tata Motors" />
                <option value="Hyundai" />
                <option value="Ashok Leyland" />
                <option value="Toyota" />
                <option value="Mahindra" />
                <option value="Reliance H2" />
                <option value="Eicher Motors" />
              </datalist>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={13} color="#00d2b4" />
                <span>Vehicle Model</span>
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. Nexo, Starbus H2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ width: '100%', height: '40px', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          {/* License Plate & Contact Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} color="#00d2b4" />
                <span>License Plate No.</span>
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. MH 02 AB 1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                style={{ width: '100%', height: '40px', fontSize: '14px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} color="#00d2b4" />
                <span>Mobile (+91)</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  className="auth-input"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', height: '40px', paddingLeft: '40px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          {/* Fuel Protocol & Tank Capacity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gauge size={13} color="#00d2b4" />
                <span>Pressure Standard</span>
              </label>
              <select
                className="auth-input"
                value={fuelType}
                onChange={handlePressureChange}
                style={{
                  width: '100%',
                  height: '40px',
                  fontSize: '13px',
                  background: 'var(--surface-well)',
                  color: '#ffffff',
                  paddingRight: '10px'
                }}
              >
                <option value="700 bar Hydrogen">700 bar (Passenger / SUV)</option>
                <option value="350 bar Hydrogen">350 bar (Trucks & Buses)</option>
                <option value="Cryogenic Liquid H2">Liquid H2 (Heavy Freight)</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fuel size={13} color="#00d2b4" />
                <span>Tank Capacity (kg)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="120"
                className="auth-input"
                placeholder="5.6"
                value={tankCapacityKg}
                onChange={(e) => setTankCapacityKg(e.target.value)}
                style={{ width: '100%', height: '40px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-cta-btn"
            style={{
              marginTop: '8px',
              height: '44px',
              background: 'linear-gradient(90deg, #00d2b4 0%, #0284c7 100%)',
              color: '#04070e',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving Vehicle to Database...' : (
              <>
                <span>Save Vehicle & Access Dashboard</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
