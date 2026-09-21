import { useState, useEffect } from 'react';
import api from '../api/api';
import Skeleton from './ui/Skeleton';
import { Leaf, Award, Trophy, Medal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/analytics/leaderboard');
        setLeaders(data);
      } catch (error) {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy size={20} color="#fbbf24" />; // Gold
      case 1: return <Medal size={20} color="#94a3b8" />; // Silver
      case 2: return <Medal size={20} color="#b45309" />; // Bronze
      default: return <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', width: '20px', textAlign: 'center' }}>{index + 1}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Leaf size={24} color="#10b981" style={{ marginRight: '12px' }} />
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Global Carbon Offset Leaders</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Top drivers saving the planet with Hydrogen.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="48px" borderRadius="8px" />
          <Skeleton height="48px" borderRadius="8px" />
          <Skeleton height="48px" borderRadius="8px" />
        </div>
      ) : leaders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
          No data available yet. Start refueling!
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {leaders.map((leader, index) => (
            <li key={leader._id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px', 
              background: index === 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(0,0,0,0.2)', 
              borderRadius: '8px', 
              marginBottom: '8px', 
              border: index === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                  {getRankIcon(index)}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: index === 0 ? '#fbbf24' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {leader.name}
                    {leader.tier && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--bg-slate-light)', borderRadius: '4px', textTransform: 'uppercase' }}>{leader.tier}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {leader.totalH2Kg.toFixed(1)} kg H₂ Refueled
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.125rem' }}>
                  {leader.co2SavedKg.toFixed(0)} <span style={{ fontSize: '0.75rem' }}>kg CO₂</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
