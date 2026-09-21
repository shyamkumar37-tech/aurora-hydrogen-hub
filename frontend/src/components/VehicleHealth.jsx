import React, { useState, useEffect } from 'react';
import { Activity, BatteryCharging, Droplet, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../api/api';

export default function VehicleHealth({ vehicleId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) return;
    const fetchHealth = async () => {
      try {
        const res = await api.get(`/vehicles/${vehicleId}/health`);
        setHealth(res.data.data);
      } catch (err) {
        console.error('Failed to fetch vehicle health', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [vehicleId]);

  if (loading) return <div style={{ color: '#71717a' }}>Loading telemetry...</div>;
  if (!health) return <div style={{ color: '#71717a' }}>No vehicle telemetry available. Please connect a vehicle.</div>;

  const { vehicle, healthStatus, estimatedRange, totalHydrogenConsumed30d, averageConsumptionPerDay } = health;

  let statusColor = '#10b981';
  let StatusIcon = ShieldCheck;
  if (healthStatus === 'ATTENTION') { statusColor = '#f59e0b'; StatusIcon = AlertTriangle; }
  if (healthStatus === 'CRITICAL') { statusColor = '#ef4444'; StatusIcon = AlertTriangle; }

  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#00ffff" />
          </div>
          <div>
            <div style={{ fontWeight: '500', color: '#fff', fontSize: '1.125rem' }}>{vehicle.make} {vehicle.model}</div>
            <div style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Telemetry System</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${statusColor}20`, color: statusColor, padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          <StatusIcon size={14} />
          {healthStatus}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '0.875rem', marginBottom: '8px' }}>
            <BatteryCharging size={16} />
            Est. Range
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>
            {estimatedRange.toFixed(0)} <span style={{ fontSize: '1rem', color: '#71717a', fontWeight: 'normal' }}>km</span>
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '0.875rem', marginBottom: '8px' }}>
            <Droplet size={16} />
            30d Consumption
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>
            {totalHydrogenConsumed30d.toFixed(1)} <span style={{ fontSize: '1rem', color: '#71717a', fontWeight: 'normal' }}>kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
