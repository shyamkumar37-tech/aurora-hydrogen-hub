import { useState, useEffect } from 'react';
import { Zap, Sun, Wind, Bell, Check, TrendingDown, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DynamicPricingWidget({ station, basePrice = 82 }) {
  const [isAlertSubscribed, setIsAlertSubscribed] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Solar Peak Window: 11:00 AM - 3:00 PM (11 to 15)
  const isSolarPeak = currentHour >= 11 && currentHour <= 15;
  const isNightOffPeak = currentHour >= 23 || currentHour <= 5;
  const isDiscountActive = isSolarPeak || isNightOffPeak;

  const discountPct = isSolarPeak ? 15 : isNightOffPeak ? 10 : 0;
  const livePrice = (basePrice * (1 - discountPct / 100)).toFixed(1);

  const toggleAlert = () => {
    setIsAlertSubscribed(!isAlertSubscribed);
    if (!isAlertSubscribed) {
      toast.success('Price drop alerts enabled for this station!');
    } else {
      toast('Price alerts disabled', { icon: '🔕' });
    }
  };

  return (
    <div style={{
      background: 'rgba(6, 182, 212, 0.04)',
      border: '1px solid rgba(6, 182, 212, 0.2)',
      borderRadius: '16px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: isDiscountActive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(6, 182, 212, 0.15)',
            border: `1px solid ${isDiscountActive ? '#10b981' : 'rgba(6, 182, 212, 0.3)'}`,
            padding: '5px 10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isSolarPeak ? <Sun size={14} color="#10b981" /> : isNightOffPeak ? <Wind size={14} color="#10b981" /> : <Zap size={14} color="#06b6d4" />}
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.06em', color: isDiscountActive ? '#10b981' : '#06b6d4', textTransform: 'uppercase' }}>
              {isSolarPeak ? '15% Off Solar Peak Window' : isNightOffPeak ? '10% Night Off-Peak' : 'Standard Green Grid'}
            </span>
          </div>
        </div>

        <button 
          onClick={toggleAlert}
          style={{
            background: isAlertSubscribed ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isAlertSubscribed ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)'}`,
            color: isAlertSubscribed ? '#22d3ee' : '#a1a1aa',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.2s ease'
          }}
        >
          {isAlertSubscribed ? <Check size={12} /> : <Bell size={12} />}
          <span>{isAlertSubscribed ? 'Alerts Active' : 'Price Alert'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Live Dispenser Tariff
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: isDiscountActive ? '#10b981' : '#ffffff' }}>
              ₹{livePrice} <span style={{ fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>/ kg</span>
            </span>
            {isDiscountActive && (
              <span style={{ fontSize: '13px', color: '#71717a', textDecoration: 'line-through' }}>
                ₹{basePrice}
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'right' }}>
          <span style={{ display: 'block', color: '#d4d4d8' }}>⚡ 100% Certified Green H2</span>
          <span>Electrolysis from Pavagada Solar Farm</span>
        </div>
      </div>
    </div>
  );
}
