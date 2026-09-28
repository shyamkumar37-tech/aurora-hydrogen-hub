import React, { useState } from 'react';
import { 
  Truck, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Droplet, 
  Gauge, 
  FileText,
  Building2,
  Calendar
} from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function TankerDeliveryModal({ isOpen, onClose, stationId, stationName, inventoryId, onDeliveryLogged }) {
  const [formData, setFormData] = useState({
    supplier: 'Linde Clean Hydrogen India',
    challanNumber: `DC-H2-${Math.floor(10000 + Math.random() * 90000)}`,
    trailerPlate: 'TN 04 CD 8912',
    initialPressure: '250',
    finalPressure: '35',
    kgTransferred: '380',
    purityGrade: '99.999% (SAE J2719)',
    driverName: 'R. Veeramani'
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.kgTransferred);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid transferred kilogram amount.');
      return;
    }

    setSubmitting(true);
    try {
      // If inventoryId provided, update central stock in MongoDB
      if (inventoryId) {
        await api.put(`/inventory/${inventoryId}`, {
          amountToAdd: amount
        });
      }

      toast.success(`Successfully offloaded ${amount} kg of green H2 into ${stationName || 'Hub Storage'}!`, { icon: '🚛' });
      if (onDeliveryLogged) {
        onDeliveryLogged(formData);
      }
      onClose();
    } catch (err) {
      console.error('Delivery log error', err);
      toast.error(err.response?.data?.message || 'Failed to register delivery in inventory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div style={{
        background: '#090d16',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(56, 189, 248, 0.1)',
        color: '#f8fafc',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <Truck size={26} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                Cryogenic Tube-Trailer Inward Log
              </h2>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                Bulk Hydrogen Offloading Register — {stationName || 'Primary Storage'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Supplier & Challan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                Industrial H2 Producer / Supplier
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
              >
                <option value="Linde Clean Hydrogen India">Linde Clean Hydrogen India</option>
                <option value="INOX Air Products">INOX Air Products</option>
                <option value="Air Liquide Industrial">Air Liquide Industrial</option>
                <option value="Reliance Green H2 Fleet">Reliance Green H2 Fleet</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                Delivery Challan # (E-Way Bill)
              </label>
              <input
                type="text"
                value={formData.challanNumber}
                onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
                required
              />
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                Tube-Trailer Vehicle Plate
              </label>
              <input
                type="text"
                value={formData.trailerPlate}
                onChange={(e) => setFormData({ ...formData, trailerPlate: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                Authorized HAZMAT Driver
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Pressures & Net Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                Inlet Pressure (Bar)
              </label>
              <input
                type="number"
                value={formData.initialPressure}
                onChange={(e) => setFormData({ ...formData, initialPressure: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                Residual Pressure (Bar)
              </label>
              <input
                type="number"
                value={formData.finalPressure}
                onChange={(e) => setFormData({ ...formData, finalPressure: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700', marginBottom: '6px' }}>
                Net H2 Delivered (kg) *
              </label>
              <input
                type="number"
                value={formData.kgTransferred}
                onChange={(e) => setFormData({ ...formData, kgTransferred: e.target.value })}
                className="input-modern"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', borderColor: '#38bdf8', color: '#38bdf8', fontWeight: '700' }}
                required
              />
            </div>
          </div>

          {/* Quality & Safety Confirmation Badge */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#10b981' }}>
                  Gas Purity Laboratory Verified: {formData.purityGrade}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  CO &lt; 0.2 ppm, Total Sulfur &lt; 0.004 ppm. Safe for fuel cell membrane injectors.
                </div>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: '6px' }}>
              PASSED
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="btn btn-primary"
              style={{ 
                padding: '10px 24px', 
                fontSize: '0.85rem', 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Offloading...' : 'Confirm Inward Stock Deposit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
