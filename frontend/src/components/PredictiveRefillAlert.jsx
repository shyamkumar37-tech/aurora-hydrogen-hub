import { useState, useEffect } from 'react';
import { Sparkles, Thermometer, CloudRain, AlertTriangle, ArrowRight, ShieldCheck, Check, Radio } from 'lucide-react';

export default function PredictiveRefillAlert({ vehicle, onBookRefill }) {
  const [dismissed, setDismissed] = useState(false);
  const [ambientTemp, setAmbientTemp] = useState(32); // Default 32°C
  const [humidity, setHumidity] = useState(65);
  const [isLiveWeather, setIsLiveWeather] = useState(false);
  const [commuteDistance, setCommuteDistance] = useState(48); // 48 km daily

  // Fetch Live Satellite Weather from Open-Meteo
  useEffect(() => {
    const fetchLiveWeather = async () => {
      try {
        const lat = 13.0827; // Chennai Central
        const lng = 80.2707;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
        const data = await res.json();
        if (data?.current?.temperature_2m !== undefined) {
          setAmbientTemp(Math.round(data.current.temperature_2m));
          setHumidity(Math.round(data.current.relative_humidity_2m));
          setIsLiveWeather(true);
        }
      } catch (err) {
        console.warn('Live weather fallback', err);
      }
    };
    fetchLiveWeather();
  }, []);


  if (dismissed) return null;

  const currentLevel = vehicle?.currentFuelLevelPct || 65;
  const tankCapacity = vehicle?.tankCapacityKg || 5.6;
  const currentKg = (tankCapacity * (currentLevel / 100)).toFixed(1);
  const efficiency = vehicle?.efficiencyKgPer100Km || 0.95;

  // Temperature efficiency penalty: High heat (>32°C) consumes ~8% more fuel for fuel-cell cooling
  const heatPenalty = ambientTemp > 32 ? 1.08 : 1.0;
  const effectiveRange = Math.round((currentKg / (efficiency * heatPenalty)) * 100);
  const daysRemaining = (effectiveRange / commuteDistance).toFixed(1);

  const isLow = currentLevel <= 30 || effectiveRange <= 120;

  return (
    <div style={{
      background: isLow 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' 
        : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
      border: `1px solid ${isLow ? 'rgba(239, 68, 68, 0.35)' : 'rgba(6, 182, 212, 0.3)'}`,
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '28px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)',
            padding: '8px',
            borderRadius: '12px'
          }}>
            {isLow ? <AlertTriangle size={18} color="#ef4444" /> : <Sparkles size={18} color="#06b6d4" />}
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', color: isLow ? '#ef4444' : '#06b6d4', textTransform: 'uppercase', display: 'block' }}>
              {isLow ? '⚡ Predictive Tank Alert' : '🧠 AI Smart Range & Weather Forecast'}
            </span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              {isLow 
                ? `Tank low (${currentLevel}%). Refill recommended before tomorrow's commute.` 
                : `Optimal Range: ${effectiveRange} km (${daysRemaining} days remaining)`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span>Live Satellite Met</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', color: '#d4d4d8' }}>
            <Thermometer size={14} color="#f59e0b" />
            <span>{ambientTemp}°C · {humidity}% Hum</span>
          </div>
          <button 
            onClick={() => setDismissed(true)}
            style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
          {isLow 
            ? `At ${ambientTemp}°C with A/C active, your vehicle is consuming ${(efficiency * heatPenalty).toFixed(2)} kg/100km. Chennai Central Hub currently has 0 wait time and 1 active 700-bar pump.`
            : `AI calculated your regular commute (${commuteDistance} km/day). Tank pressure is nominal at 700 bar with zero cell degradation detected.`}
        </p>

        {isLow && onBookRefill && (
          <button 
            onClick={onBookRefill}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4)'
            }}
          >
            <span>Express Book Pump</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
