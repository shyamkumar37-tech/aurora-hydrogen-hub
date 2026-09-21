import { useState, useEffect } from 'react';
import api from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Tag, Plus, Edit2 } from 'lucide-react';

export default function AdminPricing() {
  const [basePrice, setBasePrice] = useState('');
  const [stations, setStations] = useState([]);
  const [promocodes, setPromocodes] = useState([]);
  
  // Modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discountPct: '', expiryDate: '' });

  useEffect(() => {
    fetchPricing();
    fetchPromocodes();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await api.get('/admin/pricing');
      setBasePrice(res.data.basePrice);
      setStations(res.data.stations);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPromocodes = async () => {
    try {
      const res = await api.get('/admin/promocodes');
      setPromocodes(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateBasePrice = async () => {
    try {
      await api.put('/admin/pricing', { basePrice });
      alert('Global base price updated successfully');
      fetchPricing();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateOverride = async (stationId, currentOverride) => {
    const newPrice = prompt(`Enter new price override for this station (Leave blank to remove override):`, currentOverride || '');
    if (newPrice !== null) {
      try {
        await api.put(`/admin/pricing/station/${stationId}`, { priceOverride: newPrice ? Number(newPrice) : null });
        fetchPricing();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAddPromo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/promocodes', promoForm);
      setShowPromoModal(false);
      setPromoForm({ code: '', discountPct: '', expiryDate: '' });
      fetchPromocodes();
    } catch (error) {
      console.error(error);
    }
  };

  const togglePromo = async (id, isActive) => {
    try {
      await api.put(`/admin/promocodes/${id}/toggle`, { isActive: !isActive });
      fetchPromocodes();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader 
        title="Pricing & Promotions" 
        description="Control network fuel pricing and manage promotional campaigns."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Pricing Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.125rem' }}>Fuel Pricing Controls</h3>
          
          <div style={{ marginBottom: '32px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Global Base Price (₹/kg)</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <input className="input-modern" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} style={{ flex: 1 }} />
              <Button onClick={handleUpdateBasePrice}>Update Global</Button>
            </div>
          </div>

          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>Station Price Overrides</h4>
          <div className="table-container" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Current Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stations.map(st => (
                  <tr key={st._id}>
                    <td>{st.name}</td>
                    <td>
                      {st.priceOverride ? (
                        <span style={{ color: 'var(--admin-warning)', fontWeight: 600 }}>₹{st.priceOverride} (Override)</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>₹{basePrice} (Base)</span>
                      )}
                    </td>
                    <td>
                      <Button variant="outline" onClick={() => handleUpdateOverride(st._id, st.priceOverride)} style={{ padding: '4px 8px' }}>
                        <Edit2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promotions Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Active Promotions</h3>
            <Button onClick={() => setShowPromoModal(true)}>
              <Plus size={16} style={{ marginRight: '8px' }} /> Add Promo
            </Button>
          </div>

          <div className="table-container" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {promocodes.map(promo => (
                  <tr key={promo._id}>
                    <td><div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={14} /> {promo.code}</div></td>
                    <td>{promo.discountPct}% OFF</td>
                    <td>{new Date(promo.expiryDate).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="outline" 
                        onClick={() => togglePromo(promo._id, promo.isActive)}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', borderColor: promo.isActive ? 'var(--text-muted)' : 'var(--accent-cyan)' }}
                      >
                        {promo.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {promocodes.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No promotional codes found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showPromoModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Create Promo Code</h3>
            <form onSubmit={handleAddPromo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input className="input-modern" placeholder="CODE (e.g. SUMMER20)" style={{ textTransform: 'uppercase' }} value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} required />
              <input className="input-modern" type="number" placeholder="Discount Percentage (%)" value={promoForm.discountPct} onChange={e => setPromoForm({...promoForm, discountPct: e.target.value})} required />
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Expiry Date</label>
                <input className="input-modern" type="date" value={promoForm.expiryDate} onChange={e => setPromoForm({...promoForm, expiryDate: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <Button type="submit" style={{ flex: 1 }}>Create Code</Button>
                <Button type="button" variant="outline" onClick={() => setShowPromoModal(false)} style={{ flex: 1 }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
