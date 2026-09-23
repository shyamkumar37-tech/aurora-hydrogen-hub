import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/api';
import toast from 'react-hot-toast';
import CustomerMobileNav from '../components/CustomerMobileNav';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Fuel, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  CalendarCheck, 
  AlertCircle,
  Leaf,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

const PRESET_CITIES = [
  { name: 'Chennai Central Hub', coords: { lat: 13.0827, lng: 80.2707 } },
  { name: 'Guindy Mobility Zone', coords: { lat: 13.0067, lng: 80.2024 } },
  { name: 'Tambaram Clean Corridor', coords: { lat: 12.9249, lng: 80.1000 } },
  { name: 'Kanchipuram Highway Terminal', coords: { lat: 12.8342, lng: 79.7036 } },
  { name: 'Vellore Smart Oasis', coords: { lat: 12.9165, lng: 79.1325 } },
  { name: 'Bengaluru Tech Corridor', coords: { lat: 12.9716, lng: 77.5946 } },
];

// Helper to auto-fit bounds on route change
function RouteMapBounds({ waypoints }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints && waypoints.length >= 2) {
      const bounds = L.latLngBounds(waypoints.map(p => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
  }, [waypoints, map]);
  return null;
}

export default function TripPlanner() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState({
    id: 'custom',
    name: 'Hydrogen Vehicle',
    plateNumber: '',
    tankCapacityKg: 5.6,
    rangeKm: 589,
    pressure: '700 bar Hydrogen',
    efficiency: 0.95
  });
  const [isCustomVehicle, setIsCustomVehicle] = useState(false);
  const [fuelLevelPct, setFuelLevelPct] = useState(70);
  
  const [startCity, setStartCity] = useState(PRESET_CITIES[0].name);
  const [startCoords, setStartCoords] = useState(PRESET_CITIES[0].coords);
  
  const [destCity, setDestCity] = useState(PRESET_CITIES[3].name);
  const [destCoords, setDestCoords] = useState(PRESET_CITIES[3].coords);
  
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);

  // Load real user vehicles from backend garage
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await api.get('/vehicles/my');
        const list = Array.isArray(data) ? data : (data?.vehicles || []);
        if (list && list.length > 0) {
          const formatted = list.map(v => {
            const cap = Number(v.tankCapacityKg || v.tankCapacity || 5.6);
            const eff = Number(v.efficiencyKgPer100Km || 0.95);
            return {
              id: v._id,
              name: v.model,
              plateNumber: v.plateNumber || '',
              tankCapacityKg: cap,
              rangeKm: Number(v.estimatedRangeKm || Math.round((cap / eff) * 100)),
              pressure: v.fuelType || '700 bar Hydrogen',
              efficiency: eff,
              currentFuelPct: v.currentFuelLevelPct !== undefined ? Number(v.currentFuelLevelPct) : 70,
              isActive: !!v.isActive
            };
          });
          setVehicles(formatted);
          const active = formatted.find(f => f.isActive) || formatted[0];
          setSelectedVehicle(active);
          setFuelLevelPct(active.currentFuelPct || 70);
          setIsCustomVehicle(false);
        } else {
          setIsCustomVehicle(true);
        }
      } catch (e) {
        console.warn('No custom vehicles found', e);
        setIsCustomVehicle(true);
      }
    };
    fetchVehicles();
  }, []);

  // Handle URL query parameters from Voice AI
  useEffect(() => {
    const originParam = searchParams.get('origin');
    const destParam = searchParams.get('destination');
    if (!originParam && !destParam) return;

    const resolveCityCoords = async (query, isOrigin) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const list = await res.json();
        if (list && list.length > 0) {
          const lat = parseFloat(list[0].lat);
          const lng = parseFloat(list[0].lon);
          const name = list[0].display_name.split(',')[0];
          if (isOrigin) {
            setStartCity(name);
            setStartCoords({ lat, lng });
          } else {
            setDestCity(name);
            setDestCoords({ lat, lng });
          }
        }
      } catch (e) {
        console.warn('Geocoding query param error:', e);
      }
    };

    if (originParam) resolveCityCoords(originParam, true);
    if (destParam) resolveCityCoords(destParam, false);
  }, [searchParams]);

  const handleCalculateRoute = async (e) => {
    if (e) e.preventDefault();
    if (!selectedVehicle) return;
    setLoading(true);
    try {
      const { data } = await api.post('/routes/plan', {
        start: startCoords,
        destination: destCoords,
        tankCapacityKg: selectedVehicle.tankCapacityKg,
        currentFuelPct: fuelLevelPct,
        modelName: selectedVehicle.name,
        vehicleId: selectedVehicle.id !== 'custom' ? selectedVehicle.id : undefined
      });

      if (data.success) {
        setRouteResult(data.data);
        toast.success('Optimal hydrogen route computed!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to compute route');
    } finally {
      setLoading(false);
    }
  };

  // Run initial calculation
  useEffect(() => {
    handleCalculateRoute();
  }, [selectedVehicle, fuelLevelPct, startCoords, destCoords]);

  const handleStartChange = (cityName) => {
    setStartCity(cityName);
    const found = PRESET_CITIES.find(c => c.name === cityName);
    if (found) setStartCoords(found.coords);
  };

  const handleDestChange = (cityName) => {
    setDestCity(cityName);
    const found = PRESET_CITIES.find(c => c.name === cityName);
    if (found) setDestCoords(found.coords);
  };

  const swapStartAndDest = () => {
    const tempCity = startCity;
    const tempCoords = startCoords;
    setStartCity(destCity);
    setStartCoords(destCoords);
    setDestCity(tempCity);
    setDestCoords(tempCoords);
  };

  return (
    <div className="responsive-page-container">
      <div className="responsive-page-inner">
      
      {/* Top Breadcrumb */}
      <Link 
        to="/customer-dashboard" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#94a3b8', 
          textDecoration: 'none', 
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <PageHeader 
        title="Hydrogen Trip & Range Planner"
        description="Calculate fuel consumption, range safety thresholds, and optimal H2 refill stops along your journey."
      />

      {/* Main Grid */}
      <div className="responsive-split-grid">
        
        {/* Left Form Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Vehicle Config Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Car size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Active Hydrogen Vehicle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomVehicle(!isCustomVehicle)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isCustomVehicle ? 'Choose from Garage' : '+ Custom Vehicle Specs'}
              </button>
            </div>

            {!isCustomVehicle && vehicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVehicle(v);
                      if (v.currentFuelPct !== undefined) setFuelLevelPct(v.currentFuelPct);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: selectedVehicle.id === v.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedVehicle.id === v.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '8px' }}>
                        <Car size={18} color="#38bdf8" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {v.plateNumber ? `${v.plateNumber} • ` : ''}{v.tankCapacityKg} kg Tank • {v.pressure}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#38bdf8', fontWeight: '800', fontSize: '0.85rem' }}>{v.rangeKm} km</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Estimated Range</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vehicle Model / Name</label>
                  <input
                    type="text"
                    value={selectedVehicle.name}
                    onChange={(e) => setSelectedVehicle({ ...selectedVehicle, name: e.target.value })}
                    placeholder="e.g. Tata Starbus H2, Nexo, Swift"
                    style={{ width: '100%', height: '38px', background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '0 10px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tank Capacity (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedVehicle.tankCapacityKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 5.6;
                        setSelectedVehicle({ ...selectedVehicle, tankCapacityKg: val, rangeKm: Math.round((val / 0.95) * 100) });
                      }}
                      style={{ width: '100%', height: '38px', background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '0 10px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pressure Rating</label>
                    <select
                      value={selectedVehicle.pressure}
                      onChange={(e) => setSelectedVehicle({ ...selectedVehicle, pressure: e.target.value })}
                      style={{ width: '100%', height: '38px', background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '0 10px', fontSize: '0.85rem' }}
                    >
                      <option value="700 bar Hydrogen">700 bar (Passenger / SUV)</option>
                      <option value="350 bar Hydrogen">350 bar (Buses / Trucks)</option>
                      <option value="Cryogenic Liquid H2">Cryogenic Liquid H2</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Current Fuel Tank Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Current Tank Level</span>
                <span style={{ fontWeight: '800', color: fuelLevelPct < 25 ? '#f87171' : '#34d399', fontSize: '0.95rem' }}>
                  {fuelLevelPct}% ({((fuelLevelPct / 100) * selectedVehicle.tankCapacityKg).toFixed(2)} kg H₂)
                </span>
              </div>
              
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={fuelLevelPct} 
                onChange={(e) => setFuelLevelPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                <span>Empty (5%)</span>
                <span>Half (50%)</span>
                <span>Full (100%)</span>
              </div>
            </div>
          </div>

          {/* Route Origin & Destination */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Navigation size={20} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Route Locations</h3>
              </div>

              <button
                type="button"
                onClick={swapStartAndDest}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                title="Swap Start & Destination"
              >
                <RotateCcw size={12} />
                <span>Swap</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Departure Point (Start)
                </label>
                <select
                  value={startCity}
                  onChange={(e) => handleStartChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {PRESET_CITIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Arrival Point (Destination)
                </label>
                <select
                  value={destCity}
                  onChange={(e) => handleDestChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {PRESET_CITIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Map & Results View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Range & Route Summary Metric Cards */}
          {routeResult && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Trip Distance</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc', margin: '4px 0' }}>
                  {routeResult.totalDistanceKm} <span style={{ fontSize: '0.9rem', color: '#38bdf8' }}>km</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>~{routeResult.estimatedTimeMins} mins drive</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Current Range</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: routeResult.needsRefuel ? '#f87171' : '#34d399', margin: '4px 0' }}>
                  {routeResult.maxRangeKm} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>km</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: routeResult.needsRefuel ? '#f87171' : '#34d399' }}>
                  {routeResult.needsRefuel ? 'Refuel Required' : 'Sufficient Fuel'}
                </span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Fuel Consumption</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
                  {routeResult.fuelNeededTotalKg} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>kg H₂</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>≈ ₹{(routeResult.fuelNeededTotalKg * 80).toFixed(0)} fuel cost</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Leaf size={14} /> CO₂ Avoided
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
                  {routeResult.co2SavedKg} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>kg</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Zero tailpipe emissions</span>
              </div>

            </div>
          )}

          {/* Interactive Map Preview */}
          <div style={{
            height: '420px',
            borderRadius: '18px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <MapContainer
              center={[startCoords.lat, startCoords.lng]}
              zoom={11}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />

              {routeResult?.waypoints && (
                <>
                  <Polyline 
                    positions={routeResult.waypoints} 
                    color="#38bdf8" 
                    weight={5} 
                    opacity={0.85} 
                    dashArray="8, 6" 
                  />
                  <RouteMapBounds waypoints={routeResult.waypoints} />
                </>
              )}

              {/* Start Marker */}
              <Marker position={[startCoords.lat, startCoords.lng]}>
                <Popup>
                  <strong>Origin: {startCity}</strong>
                </Popup>
              </Marker>

              {/* Destination Marker */}
              <Marker position={[destCoords.lat, destCoords.lng]}>
                <Popup>
                  <strong>Destination: {destCity}</strong>
                </Popup>
              </Marker>

              {/* Recommended Station Stop */}
              {routeResult?.recommendedStop && (
                <Marker position={routeResult.recommendedStop.coordinates}>
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ color: '#0284c7' }}>⭐ Recommended H₂ Stop</strong>
                      <div>{routeResult.recommendedStop.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Pumps: {routeResult.recommendedStop.availablePumps}/{routeResult.recommendedStop.totalPumps} Available
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Refueling Recommendations & 1-Click Booking Action */}
          {routeResult?.recommendedStop && (
            <div style={{
              background: routeResult.needsRefuel ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)' : 'rgba(15, 23, 42, 0.75)',
              border: routeResult.needsRefuel ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '18px',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {routeResult.needsRefuel ? (
                    <AlertCircle size={18} color="#ef4444" />
                  ) : (
                    <CheckCircle2 size={18} color="#34d399" />
                  )}
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc' }}>
                    {routeResult.needsRefuel ? 'Recommended Refueling Stop (Crucial for Journey)' : 'Recommended En-Route Oasis'}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                  <strong style={{ color: '#38bdf8' }}>{routeResult.recommendedStop.name}</strong> • Detour: +{routeResult.recommendedStop.detourKm} km • Available Pumps: {routeResult.recommendedStop.availablePumps}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/customer/book?station=${routeResult.recommendedStop._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
                }}
              >
                <CalendarCheck size={18} />
                <span>Reserve Pump Slot Now</span>
              </button>
            </div>
          )}

        </div>

      </div>
      </div>

      <CustomerMobileNav user={user} logout={logout} />
    </div>
  );
}
