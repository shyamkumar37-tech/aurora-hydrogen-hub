import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import { 
  Activity, 
  Droplets, 
  Gauge, 
  Thermometer, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  Radio,
  ArrowRight,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';
import Button from '../components/ui/Button';
import { printInvoicePDF } from '../utils/reportExportUtils';
import { 
  startDispensingSound, 
  updateDispensingAcousticPressure, 
  stopDispensingSound, 
  playRefuelCompleteChime 
} from '../utils/h2AcousticEngine';

export default function LivePumping() {
  const { id } = useParams(); // Dispenser ID
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting'); // connecting, pumping, complete
  const [fuelAmount, setFuelAmount] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [temperature, setTemperature] = useState(-39.4);
  const [flowRateKgMin, setFlowRateKgMin] = useState(1.45);
  const [chartData, setChartData] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (!soundEnabled) {
      stopDispensingSound();
    }
  }, [soundEnabled]);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [dispenserInfo, setDispenserInfo] = useState(null);
  const [completedTx, setCompletedTx] = useState(null);
  const [stationPrice, setStationPrice] = useState(82);

  useEffect(() => {
    // Fetch dispenser & user vehicle details
    const loadSessionContext = async () => {
      try {
        let matchedDisp = null;
        try {
          const directDisp = await api.get(`/dispensers/${id}`);
          if (directDisp.data) matchedDisp = directDisp.data;
        } catch (e) {
          const dispRes = await api.get(`/dispensers`);
          matchedDisp = (dispRes.data || []).find(d => String(d._id) === String(id));
        }

        const vehRes = await api.get(`/vehicles/my`).catch(() => ({ data: [] }));
        
        if (matchedDisp) {
          setDispenserInfo(matchedDisp);
          if (matchedDisp.station?.pricePerKg) setStationPrice(matchedDisp.station.pricePerKg);
        }
        const vehicles = Array.isArray(vehRes.data) ? vehRes.data : (vehRes.data?.vehicles || []);
        if (vehicles.length > 0) {
          const active = vehicles.find(v => v.isActive) || vehicles[0];
          setVehicleInfo(active);
        }
      } catch (err) {
        console.error('Failed to load session context', err);
      }
    };
    loadSessionContext();

    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('Telemetry socket connected, initiating pumping...');
      setStatus('pumping');
      // Trigger pump simulation on socket connect
      api.post(`/dispensers/${id}/simulate-pump`).then((res) => {
        if (res.data?.pricePerKg) setStationPrice(res.data.pricePerKg);
      }).catch(err => console.error('Simulate pump error:', err));
    });
    
    let timeStep = 0;
    socket.on('fuelFlowing', (data) => {
      if (String(data.dispenserId) === String(id)) {
        setStatus('pumping');
        setFuelAmount(data.currentAmount);
        setPressure(data.pressure);
        if (data.pricePerKg) setStationPrice(data.pricePerKg);

        // Acoustic cryogenic flow synthesis
        if (soundEnabledRef.current) {
          startDispensingSound(data.pressure);
          updateDispensingAcousticPressure(data.pressure);
        }
        
        // Dynamic temperature fluctuations (-40C ± 1.5C)
        const tempFluct = parseFloat((-39.5 - Math.sin(timeStep * 0.3) * 1.2).toFixed(1));
        setTemperature(tempFluct);

        // Measured flow rate
        const rate = parseFloat((1.35 + Math.cos(timeStep * 0.2) * 0.25).toFixed(2));
        setFlowRateKgMin(rate);
        
        setChartData(prev => {
          const newData = [...prev, {
            time: `${timeStep++}s`,
            pressure: data.pressure,
            amount: data.currentAmount,
            temp: tempFluct
          }];
          if (newData.length > 25) newData.shift();
          return newData;
        });
      }
    });

    socket.on('fuelComplete', (data) => {
      if (String(data.dispenserId) === String(id)) {
        setStatus('complete');
        setCompletedTx(data);
        stopDispensingSound();
        if (soundEnabledRef.current) {
          playRefuelCompleteChime();
        }
      }
    });

    return () => {
      stopDispensingSound();
      socket.disconnect();
    };
  }, [id]);

  const targetPressure = 700;
  const pressurePct = Math.min(100, Math.round((pressure / targetPressure) * 100));
  const currentCost = (fuelAmount * stationPrice).toFixed(2);

  const handlePrintReceipt = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    printInvoicePDF({
      _id: completedTx?.transactionId || id,
      quantityDispensed: completedTx?.quantity || fuelAmount,
      cost: completedTx?.cost || currentCost,
      createdAt: new Date(),
      station: { name: dispenserInfo?.station?.name || 'Aurora Hydrogen Hub' }
    }, { 
      name: user.name || 'EcoDriver', 
      email: user.email || 'driver@aurora.com', 
      tier: user.tier || 'Silver',
      vehicle: vehicleInfo ? `${vehicleInfo.model} (${vehicleInfo.plateNumber})` : 'Fuel Cell EV'
    });
  };


  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', color: '#f8fafc' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="Active Refueling Telemetry Cockpit" 
          description="High-frequency IoT sensor telemetry running on SAE J2601 protocol."
        />

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem'
          }}
        >
          {soundEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} />}
          <span>{soundEnabled ? 'Acoustic Feedback ON' : 'Muted'}</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '24px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)' }}>
        
        {status === 'connecting' && (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Activity size={48} className="animate-pulse" style={{ color: '#38bdf8', margin: '0 auto 16px auto' }} />
            <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: '800' }}>Initializing Secure Cryogenic Coupling...</h2>
            <p style={{ color: '#94a3b8' }}>Performing 350/700 bar nozzle seal leak check and vacuum verification.</p>
          </div>
        )}
        
        {status === 'pumping' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Top Telemetry Header Pill */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>DISPENSER ARMED & FLOWING</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <ShieldCheck size={16} color="#34d399" />
                <span>SAE J2601 / ISO 19880-1 Cryo-Lock Active</span>
              </div>
            </div>

            {/* Main Gauge Cockpit Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px' }}>
              
              {/* Dispensed Fuel */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
                <Droplets size={26} color="#38bdf8" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>
                  {fuelAmount.toFixed(2)} <span style={{ fontSize: '1rem', color: '#38bdf8' }}>kg</span>
                </div>
                <div style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '6px', fontWeight: '700' }}>
                  H₂ Dispensed
                </div>
              </div>

              {/* Tank Pressure */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
                <Gauge size={26} color="#34d399" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#34d399', lineHeight: 1 }}>
                  {pressure} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>bar</span>
                </div>
                <div style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '6px', fontWeight: '700' }}>
                  Target: 700 bar ({pressurePct}%)
                </div>
              </div>

              {/* SAE J2601 Pre-cooling Temperature */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
                <Thermometer size={26} color="#06b6d4" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#06b6d4', lineHeight: 1 }}>
                  {temperature} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>°C</span>
                </div>
                <div style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '6px', fontWeight: '700' }}>
                  Pre-Cooling Protocol T40
                </div>
              </div>

              {/* Flow Rate & Accrued Cost */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
                <Zap size={26} color="#fbbf24" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>
                  ₹{currentCost}
                </div>
                <div style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '6px', fontWeight: '700' }}>
                  Flow: {flowRateKgMin} kg/min
                </div>
              </div>

            </div>

            {/* Pressure Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                <span>Compression Fill Progression</span>
                <span style={{ fontWeight: '700', color: '#38bdf8' }}>{pressure} / 700 Bar ({pressurePct}%)</span>
              </div>
              <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pressurePct}%`,
                  background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.8)',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>
            </div>

            {/* Real-Time Dual-Axis Chart */}
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '18px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                Real-Time Pressure (Bar) & Mass Flow (kg) Curves
              </div>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis yAxisId="left" stroke="#10b981" domain={[200, 800]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="pressure" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#38bdf8" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {status === 'complete' && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }} className="animate-fade-in">
            <div style={{ 
              width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', 
              border: '2px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.35)'
            }}>
              <CheckCircle2 size={44} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 8px 0' }}>Refueling Completed Successfully</h2>
            <p style={{ color: '#94a3b8', maxWidth: '520px', margin: '0 auto 28px auto', fontSize: '0.95rem' }}>
              Tank topped to 700 bar with fuel-cell grade hydrogen (99.999% pure). The nozzle lock has disengaged safely.
            </p>

            <div style={{ display: 'inline-flex', gap: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px 32px', marginBottom: '32px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Dispensed Quantity</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8' }}>{fuelAmount.toFixed(2)} kg</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '24px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Amount</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34d399' }}>₹{currentCost}</div>
              </div>
              {completedTx?.newLoyaltyPoints && (
                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '24px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Loyalty Points</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24' }}>+{Math.round(fuelAmount * 10)} pts</div>
                </div>
              )}
            </div>

            {vehicleInfo && (
              <div style={{ marginBottom: '24px', fontSize: '0.85rem', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ShieldCheck size={16} />
                <span>Garage Synced: <strong>{vehicleInfo.model} ({vehicleInfo.plateNumber})</strong> tank restored to 100% (700 bar)</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Button onClick={handlePrintReceipt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                <Printer size={16} />
                <span>View / Print Tax Invoice</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/customer-dashboard')} style={{ padding: '12px 24px' }}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
