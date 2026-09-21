import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { MapPin, ArrowLeft, Navigation, BatteryCharging } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StationsPublic() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data } = await api.get('/stations');
        setStations(data);
      } catch (error) {
        toast.error('Failed to fetch stations');
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          display: 'inline-flex', 
          alignItems: 'center', 
          color: 'var(--text-muted)', 
          marginBottom: '1rem', 
          cursor: 'pointer',
          padding: 0
        }}
      >
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back
      </button>

      <PageHeader 
        title="Hydrogen Network" 
        description="Find and navigate to clean energy refueling stations near you."
        action={
          <Link to="/stations/map" style={{ textDecoration: 'none' }}>
            <Button>
              <Navigation size={18} style={{ marginRight: '8px' }} /> View Map
            </Button>
          </Link>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {loading ? (
          <>
            <Skeleton height="160px" borderRadius="16px" />
            <Skeleton height="160px" borderRadius="16px" />
            <Skeleton height="160px" borderRadius="16px" />
          </>
        ) : stations.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState 
              title="No Stations Available" 
              description="We couldn't find any active hydrogen stations in the network right now."
              icon={MapPin}
            />
          </div>
        ) : (
          stations.map(station => (
            <div key={station._id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={20} color="var(--accent-cyan)" style={{ marginRight: '8px' }} />
                  {station.name}
                </h3>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  background: station.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: station.status === 'active' ? '#10b981' : '#f59e0b',
                  textTransform: 'uppercase'
                }}>
                  {station.status}
                </span>
              </div>
              
              <div style={{ color: 'var(--text-muted)', marginBottom: '24px', flex: 1 }}>
                Located at [{station.location?.coordinates?.join(', ') || 'Unknown coordinates'}]
              </div>

              <Link to={`/stations/${station._id}`} style={{ textDecoration: 'none' }}>
                <Button variant="outline" style={{ width: '100%' }}>
                  <BatteryCharging size={16} style={{ marginRight: '8px' }} /> Check Availability
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
