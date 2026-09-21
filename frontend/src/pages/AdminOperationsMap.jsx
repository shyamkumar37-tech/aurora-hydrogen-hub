import { useEffect, useState } from 'react';
import api from '../api/api';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Clock, Users, Zap, MapPin } from 'lucide-react';
import { io } from 'socket.io-client';

// Fix for default leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons based on status
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  operational: createIcon('green'),
  busy: createIcon('gold'), // Yellow-ish
  maintenance: createIcon('orange'),
  offline: createIcon('red')
};

// Default center: San Francisco
const defaultCenter = [37.7749, -122.4194];

export default function AdminOperationsMap() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchStations();
    
    // Connect to Socket.io for live updates
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Admin Operations Map connected to live feed');
      newSocket.emit('join_admin_room'); // Assume backend handles this or just listen to global station updates
    });

    // Live telemetry events from backend socket emitter
    newSocket.on('dispenser_status_changed', (data) => {
      fetchStations();
      setSelectedStation(prev => {
        if (prev && prev._id === data.stationId) {
          return { ...prev, lastUpdated: new Date() };
        }
        return prev;
      });
    });

    newSocket.on('inventoryUpdated', (data) => {
      fetchStations();
    });

    newSocket.on('station_status_changed', () => {
      fetchStations();
    });

    setSocket(newSocket);


    return () => newSocket.disconnect();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await api.get(`/stations`);
      setStations(res.data);
    } catch (error) {
      console.error('Failed to fetch stations', error);
    }
  };

  const getMarkerIcon = (station) => {
    if (station.status === 'offline') return icons.offline;
    if (station.status === 'maintenance') return icons.maintenance;
    if (station.queueLength > 5) return icons.busy;
    return icons.operational;
  };

  // Helper component to auto-fit map to station bounds
  const MapBounds = () => {
    const map = useMap();
    useEffect(() => {
      if (stations.length > 0) {
        const bounds = L.latLngBounds(
          stations
            .filter(s => s.location && s.location.coordinates)
            .map(s => [s.location.coordinates[1], s.location.coordinates[0]])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, [map]);
    return null;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', width: '100%', overflow: 'hidden' }}>
      
      {/* Side Panel */}
      <div className="glass-sidebar" style={{ width: '350px', flexShrink: 0, padding: '24px', borderRight: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--bg-slate)', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-cyan)" /> Live Operations
        </h2>
        
        {selectedStation ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{selectedStation.name}</h3>
              <span className={`status-badge ${selectedStation.status === 'active' || selectedStation.status === 'operational' ? 'active' : (selectedStation.status === 'maintenance' ? 'pending' : 'offline')}`}>
                {selectedStation.status.toUpperCase()}
              </span>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} /> Pumps</span>
                <span style={{ fontWeight: 600 }}>{selectedStation.availablePumps} / {selectedStation.totalPumps}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Queue</span>
                <span style={{ fontWeight: 600 }}>{selectedStation.queueLength} cars</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> Wait Time</span>
                <span style={{ fontWeight: 600 }}>~{selectedStation.waitTime} min</span>
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
              Last updated: {new Date(selectedStation.lastUpdated || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <MapPin size={48} opacity={0.2} style={{ marginBottom: '16px' }} />
            <p>Select a station marker on the map to view live details.</p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div style={{ flexGrow: 1, height: '100%', position: 'relative', zIndex: 1 }}>
        <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%', backgroundColor: '#f3f4f6' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapBounds />
          
          {stations.map(station => (
            <Marker 
              key={station._id} 
              position={[station.location?.coordinates[1] || 0, station.location?.coordinates[0] || 0]} 
              icon={getMarkerIcon(station)}
              eventHandlers={{
                click: () => setSelectedStation(station)
              }}
            >
              <Popup>
                <div style={{ fontWeight: 600, color: '#111827' }}>{station.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>Queue: {station.queueLength} | Pumps: {station.availablePumps}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
