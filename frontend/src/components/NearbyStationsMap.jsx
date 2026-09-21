import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Navigation, ArrowRight } from 'lucide-react';

const defaultCenter = [13.0827, 80.2707]; // Chennai fallback

// Helper component to recenter map when selectedStation changes
function MapRecenter({ selectedStationId, stations, userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedStationId && stations.length > 0) {
      const st = stations.find(s => s._id === selectedStationId);
      if (st && st.location?.coordinates) {
        map.flyTo([st.location.coordinates[1], st.location.coordinates[0]], 14, {
          duration: 1.5
        });
      }
    } else if (userLocation && !selectedStationId) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.5 });
    }
  }, [selectedStationId, stations, map, userLocation]);

  return null;
}

const createCustomIcon = (status, isHovered) => {
  let color = '#a1a1aa'; // gray
  let shadowColor = 'rgba(161, 161, 170, 0.4)';
  if (status === 'operational' || status === 'active') { color = '#10b981'; shadowColor = 'rgba(16, 185, 129, 0.4)'; }
  if (status === 'maintenance' || status === 'limited') { color = '#f59e0b'; shadowColor = 'rgba(245, 158, 11, 0.4)'; }
  if (status === 'offline') { color = '#ef4444'; shadowColor = 'rgba(239, 68, 68, 0.4)'; }

  const size = isHovered ? 24 : 16;
  const border = isHovered ? '2px solid #00ffff' : '2px solid #000';
  const shadow = isHovered ? `0 0 16px ${color}` : `0 0 10px ${shadowColor}`;

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      width: ${size}px; 
      height: ${size}px; 
      background-color: ${color}; 
      border: ${border}; 
      border-radius: 50%;
      box-shadow: ${shadow};
      transition: all 0.2s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

const userIcon = L.divIcon({
  className: 'user-location-icon',
  html: `<div style="
    width: 16px; 
    height: 16px; 
    background-color: #3b82f6; 
    border: 2px solid #fff; 
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function NearbyStationsMap({ stations, selectedStationId, onSelectStation, hoveredStationId, setHoveredStationId, routeCoords, searchQuery, onSearchChange, activeFilter, onFilterChange }) {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.warn("Geolocation denied or unavailable.");
          setUserLocation({ lat: 13.0827, lng: 80.2707 });
        }
      );
    } else {
      setUserLocation({ lat: 13.0827, lng: 80.2707 });
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0A0A0B' }}>
      <MapContainer 
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter} 
        zoom={14} 
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
        ref={setMapRef}
        onClick={() => onSelectStation(null)}
      >
        {/* OpenStreetMap Standard Tiles (High Contrast Wording and Labels) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapRecenter selectedStationId={selectedStationId} stations={stations} userLocation={userLocation} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
        )}
        
        {routeCoords && routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="#00ffff" weight={4} dashArray="10, 10" />
        )}

        {stations.map(station => {
          const lat = station.location?.coordinates?.[1];
          const lng = station.location?.coordinates?.[0];
          
          if (!lat || !lng) return null;

          return (
            <Marker
              key={station._id}
              position={[lat, lng]}
              icon={createCustomIcon(station.status, hoveredStationId === station._id)}
              eventHandlers={{
                click: () => onSelectStation(station._id),
                mouseover: () => setHoveredStationId && setHoveredStationId(station._id),
                mouseout: () => setHoveredStationId && setHoveredStationId(null),
              }}
            >
              <Popup closeButton={false} autoPan={false} offset={[0, -8]}>
                <div style={{ background: '#0A0A0B', color: '#fff', padding: '16px', borderRadius: '8px', minWidth: '240px', border: '1px solid rgba(255,255,255,0.1)', margin: '-14px', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '4px', color: '#fff' }}>{station.name}</div>
                  <div style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '12px' }}>5.7 km away</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: station.status === 'operational' || station.status === 'active' ? '#10b981' : '#f59e0b' }}></div>
                    <span style={{ fontSize: '0.875rem', color: station.status === 'operational' || station.status === 'active' ? '#10b981' : '#f59e0b', textTransform: 'capitalize', fontWeight: 'bold' }}>
                      {station.status === 'active' ? 'Operational' : station.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', color: '#fff' }}>
                    <div>
                      <div style={{ color: '#a1a1aa', fontSize: '0.625rem', textTransform: 'uppercase' }}>Available Pumps</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{station.availablePumps || 0} / {station.totalPumps || 0}</div>
                    </div>
                    <div>
                      <div style={{ color: '#a1a1aa', fontSize: '0.625rem', textTransform: 'uppercase' }}>Price</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>₹{station.pricePerKg || 82}/kg</div>
                    </div>
                    <div>
                      <div style={{ color: '#a1a1aa', fontSize: '0.625rem', textTransform: 'uppercase' }}>Queue</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{station.queueLength || 0} vehicles</div>
                    </div>
                    <div>
                      <div style={{ color: '#a1a1aa', fontSize: '0.625rem', textTransform: 'uppercase' }}>ETA</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{station.waitTime || 0} min</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/customer/book?station=${station._id}`); }}
                      style={{ flex: 1, background: 'linear-gradient(180deg, #27272a 0%, #18181b 100%)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                    >
                      BOOK SLOT
                    </button>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                    >
                      DIRECTIONS
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Absolute positioned Map Controls (Search/Location) */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 1000 }}>
        <input 
          type="text" 
          placeholder="Search hydrogen stations..."
          value={searchQuery || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          style={{ flex: 1, background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 16px', borderRadius: '6px', fontSize: '0.875rem', outline: 'none', backdropFilter: 'blur(12px)' }}
        />
        <button 
          onClick={() => {
            if (userLocation && mapRef) {
              mapRef.flyTo([userLocation.lat, userLocation.lng], 14);
              onSelectStation(null);
            }
          }}
          style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--accent-cyan)', padding: '0 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}
          title="Use My Location"
        >
          <Navigation size={18} />
        </button>
      </div>
      
      {/* Filter chips */}
      <div style={{ position: 'absolute', top: '72px', left: '16px', display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: 'calc(100% - 32px)', paddingBottom: '4px', zIndex: 1000 }}>
        {['Available now', 'Open 24/7', 'Nearest', 'Fastest'].map(filter => (
          <button 
            key={filter} 
            onClick={() => onFilterChange && onFilterChange(activeFilter === filter ? '' : filter)}
            style={{ background: activeFilter === filter ? 'var(--accent-cyan)' : 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: activeFilter === filter ? '#000' : '#d4d4d8', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', backdropFilter: 'blur(12px)' }}>
            {filter}
          </button>
        ))}
      </div>
      
      {/* CSS to override default Leaflet popup styling which conflicts with dark mode */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: #888 !important;
        }
        .leaflet-control-attribution a {
          color: #aaa !important;
        }
      `}</style>
    </div>
  );
}
