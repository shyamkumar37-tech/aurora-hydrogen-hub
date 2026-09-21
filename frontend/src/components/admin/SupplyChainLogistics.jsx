import { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, ShieldCheck, ArrowRight, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function SupplyChainLogistics({ onClose }) {
  const [shipments, setShipments] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    stationId: '',
    quantityKg: 1400,
    driverName: 'Ramesh Sundaram',
    truckPlate: 'TN-01-TT-5582'
  });
  const [dispatching, setDispatching] = useState(false);

  const fetchLogistics = async () => {
    try {
      setLoading(true);
      const [shipRes, stRes] = await Promise.all([
        api.get('/admin/shipments'),
        api.get('/stations')
      ]);
      setShipments(shipRes.data || []);
      setStations(stRes.data || []);
      if (stRes.data?.length > 0 && !dispatchForm.stationId) {
        setDispatchForm(prev => ({ ...prev, stationId: stRes.data[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load supply chain logistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, []);

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      setDispatching(true);
      await api.post('/admin/shipments/dispatch', dispatchForm);
      toast.success('Tube-Trailer bulk hydrogen shipment dispatched!');
      setShowDispatchForm(false);
      fetchLogistics();
    } catch (err) {
      toast.error('Dispatch failed');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(59, 130, 246, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <Truck size={20} color="#3b82f6" />
              </div>
              <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Bulk Logistics & Cryogenic Distribution
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Tube-Trailer Hydrogen Logistics Tracker
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowDispatchForm(!showDispatchForm)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={15} />
              <span>Dispatch Tanker</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Dispatch Form Modal */}
        {showDispatchForm && (
          <form onSubmit={handleDispatch} style={{
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '18px',
            padding: '22px',
            marginBottom: '26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Dispatch Emergency / Scheduled Tube-Trailer</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Destination Hub</label>
                <select 
                  value={dispatchForm.stationId} 
                  onChange={(e) => setDispatchForm({ ...dispatchForm, stationId: e.target.value })}
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                >
                  {stations.map(st => (
                    <option key={st._id} value={st._id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Quantity (kg H2)</label>
                <input 
                  type="number"
                  value={dispatchForm.quantityKg}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, quantityKg: e.target.value })}
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Driver Name</label>
                <input 
                  type="text"
                  value={dispatchForm.driverName}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Truck Plate</label>
                <input 
                  type="text"
                  value={dispatchForm.truckPlate}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, truckPlate: e.target.value })}
                  style={{ width: '100%', height: '42px', background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '0 12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowDispatchForm(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={dispatching} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', cursor: dispatching ? 'wait' : 'pointer' }}>
                {dispatching ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </div>
          </form>
        )}

        {/* Shipments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active Fleet En Route & Scheduled Restocks
          </span>

          {shipments.length === 0 ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: '24px' }}>No shipments currently in transit.</div>
          ) : (
            shipments.map(ship => {
              const inTransit = ship.status === 'in_transit';
              return (
                <div 
                  key={ship._id}
                  style={{
                    background: inTransit ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${inTransit ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '18px',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: inTransit ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Truck size={22} color={inTransit ? '#3b82f6' : '#a1a1aa'} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{ship.trackingId}</span>
                        <span style={{ background: inTransit ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.08)', color: inTransit ? '#60a5fa' : '#a1a1aa', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                          {ship.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#d4d4d8', display: 'block', marginTop: '2px' }}>
                        Destination: <b>{ship.station?.name || 'Chennai Hub'}</b> · Cargo: <b style={{ color: '#06b6d4' }}>{ship.quantityKg} kg H2</b> ({ship.purityGrade})
                      </span>
                      <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '2px' }}>
                        Driver: {ship.driverName} ({ship.truckPlate}) · Origin: {ship.sourcePlant}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: '700', fontSize: '14px' }}>
                      <Clock size={15} />
                      <span>ETA ~{ship.etaMinutes} mins</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#10b981', display: 'block', marginTop: '4px' }}>
                      ● Satellite GPS Lock Nominal
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
