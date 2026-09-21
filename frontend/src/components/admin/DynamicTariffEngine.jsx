import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Sun, Clock, Zap, Save, Check, RefreshCw } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function DynamicTariffEngine({ onClose }) {
  const [basePrice, setBasePrice] = useState(82);
  const [rules, setRules] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/pricing');
      setBasePrice(res.data.basePrice || 82);
      setRules(res.data.rules || []);
      setStations(res.data.stations || []);
    } catch (err) {
      toast.error('Failed to load tariff configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSaveBasePrice = async () => {
    try {
      setSaving(true);
      await api.put('/admin/pricing', { basePrice: Number(basePrice) });
      toast.success(`Network base price updated to ₹${basePrice}/kg! Broadcasted to all hubs.`);
    } catch (err) {
      toast.error('Failed to update tariff');
    } finally {
      setSaving(false);
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
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(6, 182, 212, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <TrendingUp size={20} color="#06b6d4" />
              </div>
              <span style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Revenue & Smart Grid Automation
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Dynamic H2 Tariff & Surge Pricing Engine
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >
            Close
          </button>
        </div>

        {/* Base Tariff Config Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          marginBottom: '26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'block' }}>Network Base Tariff</span>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Governs standard 700-bar dispenser rates across Tamil Nadu grid</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0 12px', height: '42px' }}>
              <span style={{ color: '#06b6d4', fontWeight: '800', marginRight: '6px' }}>₹</span>
              <input 
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '16px', width: '60px', outline: 'none' }}
              />
              <span style={{ color: '#71717a', fontSize: '12px' }}>/ kg</span>
            </div>

            <button 
              type="button"
              disabled={saving}
              onClick={handleSaveBasePrice}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                height: '42px',
                padding: '0 20px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={14} />
              <span>{saving ? 'Broadcasting...' : 'Broadcast Price'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Automation Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Automated Smart Grid Tariff Rules
          </span>

          {rules.map((rule) => (
            <div 
              key={rule.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  background: rule.discount ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  padding: '8px',
                  borderRadius: '10px'
                }}>
                  {rule.discount ? <Sun size={18} color="#10b981" /> : <Clock size={18} color="#f59e0b" />}
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'block' }}>{rule.name}</span>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Active Window: {rule.window}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: rule.discount ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: rule.discount ? '#10b981' : '#f59e0b',
                  fontWeight: '800',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '8px'
                }}>
                  {rule.discount || rule.surge}
                </span>
                <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '700' }}>● AUTO-ACTIVE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
