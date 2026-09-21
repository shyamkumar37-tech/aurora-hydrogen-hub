import React, { useState, useEffect } from 'react';
import { X, Navigation, IndianRupee, Clock, BatteryCharging, Zap } from 'lucide-react';
import api from '../api/api';

export default function StationCompareModal({ onClose, onBook }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bestOverall');

  useEffect(() => {
    const fetchCompare = async () => {
      try {
        const res = await api.get('/stations/compare');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch compare data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompare();
  }, []);

  if (loading) return null; // Or a spinner overlay

  const renderList = (list) => {
    if (!list || list.length === 0) {
      return <div style={{ color: '#a1a1aa', padding: '24px', textAlign: 'center' }}>No stations available to compare.</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {list.map((station, i) => (
          <div key={station._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: i === 0 ? 'var(--accent-cyan)' : '#71717a', width: '24px' }}>#{i+1}</div>
              <div>
                <div style={{ fontWeight: '600', color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>{station.name}</div>
                <div style={{ display: 'flex', gap: '16px', color: '#a1a1aa', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IndianRupee size={14}/> {station.pricePerKg}/kg</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {station.waitTime || 0}m wait</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BatteryCharging size={14}/> {station.availablePumps}/{station.totalPumps}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onBook(station._id)}
              style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
            >
              Book
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', width: '90%', maxWidth: '700px', maxHeight: '80vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap color="var(--accent-cyan)" /> Smart Compare
            </h2>
            <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.875rem' }}>Real-time analysis of operational stations</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          {[
            { id: 'bestOverall', label: 'Best Overall' },
            { id: 'cheapest', label: 'Cheapest' },
            { id: 'fastest', label: 'Fastest' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '16px', background: 'transparent', border: 'none',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : '#a1a1aa',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {data && renderList(data[activeTab])}
        </div>

      </div>
    </div>
  );
}
