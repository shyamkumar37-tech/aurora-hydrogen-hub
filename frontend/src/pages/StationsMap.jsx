import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, MapPin } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import api from '../api/api';
import Skeleton from '../components/ui/Skeleton';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import CustomerMobileNav from '../components/CustomerMobileNav';

// Fix for default leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for stations
const stationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default center: San Francisco
const defaultCenter = [37.7749, -122.4194];

export default function StationsMap() {
  const { user, logout } = useContext(AuthContext);
  const [stations, setStations] = useState([]);
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          fetchNearbyStations(position.coords.longitude, position.coords.latitude);
        },
        () => {
          fetchNearbyStations(defaultCenter[1], defaultCenter[0]);
        }
      );
    } else {
      fetchNearbyStations(defaultCenter[1], defaultCenter[0]);
    }
  }, []);

  const fetchNearbyStations = async (lng, lat) => {
    try {
      const res = await api.get(`/stations/nearby?lng=${lng}&lat=${lat}`);
      setStations(res.data);
    } catch (error) {
      console.error('Failed to fetch stations', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsive-page-container">
      <div className="responsive-page-inner">
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
        title="Nearby Stations" 
        description="Find hydrogen refueling stations around your current location."
      />

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <Skeleton height="min(600px, 68vh)" borderRadius="12px" />
        ) : (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', height: 'min(600px, 68vh)', zIndex: 1 }}>
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
              {/* OpenStreetMap Standard Tiles (No API key needed) */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* User Location Marker */}
              <Marker position={center}>
                <Popup>
                  <strong>You are here</strong>
                </Popup>
              </Marker>
              
              {/* Station Markers */}
              {stations.map(station => (
                <Marker 
                  key={station._id} 
                  position={[station.location.coordinates[1], station.location.coordinates[0]]} 
                  icon={stationIcon}
                >
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <MapPin size={14} style={{ marginRight: '4px', color: '#10b981' }}/> {station.name}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>Status: {station.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
      </div>
      <CustomerMobileNav user={user} logout={logout} />
    </div>
  );
}
