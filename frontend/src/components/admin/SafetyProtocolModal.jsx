import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck2, 
  X, 
  Flame, 
  Zap, 
  Wind, 
  Cpu, 
  Lock,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SafetyProtocolModal({ isOpen, onClose, stationName, onProtocolCertified }) {
  const [checklist, setChecklist] = useState({
    groundingClamp: false,
    flameSensors: false,
    esdButton: false,
    breakawayNozzle: false,
    canopyVentilation: false
  });
  const [inspectorName, setInspectorName] = useState('Staff Engineer');
  const [certifiedTime, setCertifiedTime] = useState(null);

  if (!isOpen) return null;

  const allChecked = Object.values(checklist).every(Boolean);

  const toggleItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCertify = () => {
    if (!allChecked) {
      toast.error('All 5 safety criteria must be physically verified before certification.');
      return;
    }
    const timestamp = new Date().toLocaleString();
    setCertifiedTime(timestamp);
    toast.success(`OSHA/PESO Safety Protocol Certified for ${stationName || 'Hub'}! Dispensers Energized.`, { icon: '🛡️' });
    if (onProtocolCertified) {
      onProtocolCertified({
        inspector: inspectorName,
        timestamp,
        checklist
      });
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div style={{
        background: '#090d16',
        border: '1px solid rgba(0, 210, 180, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(0, 210, 180, 0.1)',
        color: '#f8fafc',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(0, 210, 180, 0.15)', padding: '10px', borderRadius: '14px', border: '1px solid rgba(0, 210, 180, 0.3)' }}>
              <ShieldCheck size={26} color="#00d2b4" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                Pre-Shift Safety Inspection Protocol
              </h2>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                PESO / OSHA Standard 1910.103 — {stationName || 'Hydrogen Hub'}
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

        {/* Info Banner */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '22px',
          fontSize: '0.8rem',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>Mandatory physical check: Dispensers remain in safety standby until all criteria pass.</span>
        </div>

        {/* 5-Point Safety Inspection Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            {
              key: 'groundingClamp',
              icon: Zap,
              title: '1. Static Dissipative Grounding Clamps',
              desc: 'Continuous earth bond verified (< 10 ohms). Clamps free of oxidation and grease.'
            },
            {
              key: 'flameSensors',
              icon: Flame,
              title: '2. Multi-Spectrum UV/IR H2 Flame & Optical Sensors',
              desc: 'Optical lenses wiped clean. Self-diagnostic test confirms 100% optical sensitivity.'
            },
            {
              key: 'esdButton',
              icon: Lock,
              title: '3. Emergency Shut-Off (ESD) Mushroom Switches',
              desc: 'Physical perimeter buttons unlatched, responsive, and dual pneumatic trip tested.'
            },
            {
              key: 'breakawayNozzle',
              icon: Cpu,
              title: '4. 700-Bar Breakaway Coupling & Hose Integrity',
              desc: 'Cryogenic flex-hose free of micro-abrasions, seals intact, breakaway cables secured.'
            },
            {
              key: 'canopyVentilation',
              icon: Wind,
              title: '5. High-Point Canopy Ventilation & Relief Vents',
              desc: 'Louvered vents unobstructed to prevent lighter-than-air hydrogen pocket accumulation.'
            }
          ].map(item => {
            const Icon = item.icon;
            const checked = checklist[item.key];
            return (
              <div 
                key={item.key}
                onClick={() => toggleItem(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: checked ? 'rgba(0, 210, 180, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: checked ? '1px solid rgba(0, 210, 180, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: checked ? 'none' : '2px solid rgba(255,255,255,0.3)',
                  background: checked ? '#00d2b4' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {checked && <CheckCircle2 size={16} color="#000" strokeWidth={3} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: checked ? '#ffffff' : '#e2e8f0', marginBottom: '2px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                </div>

                <Icon size={18} color={checked ? '#00d2b4' : '#64748b'} />
              </div>
            );
          })}
        </div>

        {/* Inspector Signature Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
              Certified Shift Technician Name
            </label>
            <input 
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="input-modern"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
              Certification Status
            </label>
            <div style={{ 
              padding: '8px 12px', 
              fontSize: '0.85rem', 
              fontWeight: '700',
              color: allChecked ? '#00d2b4' : '#f59e0b',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '8px'
            }}>
              {allChecked ? 'READY TO ENERGIZE PUMPS' : `${Object.values(checklist).filter(Boolean).length} / 5 Checked`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            type="button" 
            onClick={handleCertify} 
            disabled={!allChecked}
            className="btn btn-primary"
            style={{ 
              padding: '10px 24px', 
              fontSize: '0.85rem', 
              opacity: allChecked ? 1 : 0.45,
              cursor: allChecked ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileCheck2 size={16} />
            <span>Certify & Energize Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
