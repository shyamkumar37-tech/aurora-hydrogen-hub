import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChevronDown, BarChart3, Filter } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function AdminAnalytics() {
  const [stations, setStations] = useState([]);
  
  // Filters
  const [stationId, setStationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data
  const [revenueData, setRevenueData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data } = await api.get('/stations');
        setStations(data);
      } catch (error) {
        console.error('Failed to fetch stations', error);
      }
    };
    fetchStations();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (stationId) params.append('stationId', stationId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [revRes, peakRes, utilRes] = await Promise.all([
        api.get(`/analytics/revenue${qs}`),
        api.get(`/analytics/peak-hours${qs}`),
        api.get(`/analytics/utilization${qs}`)
      ]);

      setRevenueData(revRes.data);
      
      // Ensure hour formatting is categorical and spaced properly
      const formattedPeakHours = Array.from({ length: 24 }, (_, i) => {
        const hourData = peakRes.data.find(d => parseInt(d._id) === i);
        return {
          hour: `${i.toString().padStart(2, '0')}:00`,
          bookings: hourData ? hourData.bookingCount : 0
        };
      });
      setPeakHoursData(formattedPeakHours);
      setUtilizationData(utilRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    }
  }, [stationId, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const EmptyChartState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
      <BarChart3 size={48} opacity={0.3} style={{ marginBottom: '16px' }} />
      <p>No data available for the selected period.</p>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader 
        title="Analytics Dashboard" 
        description="Monitor network performance, revenue, and station utilization."
      />
      
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Filter size={18} /> Filters:
          </div>
          
          <div className="input-group" style={{ marginBottom: 0, width: '220px' }}>
            <div style={{ position: 'relative' }}>
              <select 
                className="input-modern"
                value={stationId} 
                onChange={e => setStationId(e.target.value)}
                style={{ appearance: 'none', width: '100%' }}
              >
                <option value="">All Stations</option>
                {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0, width: '180px' }}>
            <input 
              className="input-modern" 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          
          <div className="input-group" style={{ marginBottom: 0, width: '180px' }}>
            <input 
              className="input-modern" 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        {/* Revenue Chart */}
        <div className="glass-panel" style={{ padding: '24px', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.125rem' }}>Revenue & Fuel Dispensed</h3>
          <div style={{ flexGrow: 1 }}>
            {revenueData.length === 0 ? <EmptyChartState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="_id" stroke="var(--text-muted)" />
                  <YAxis yAxisId="left" orientation="left" stroke="var(--accent-cyan)" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-slate)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="totalRevenue" name="Revenue ($)" stroke="var(--accent-cyan)" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="totalQuantity" name="Fuel (kg)" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="glass-panel" style={{ padding: '24px', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.125rem' }}>Peak Booking Hours</h3>
          <div style={{ flexGrow: 1 }}>
            {peakHoursData.every(d => d.bookings === 0) ? <EmptyChartState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="hour" stroke="var(--text-muted)" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-slate)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="bookings" name="Number of Bookings" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Utilization Chart */}
        <div className="glass-panel" style={{ padding: '24px', height: '400px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.125rem' }}>Daily Utilization (%)</h3>
          <div style={{ flexGrow: 1 }}>
            {utilizationData.length === 0 ? <EmptyChartState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="_id" stroke="var(--text-muted)" />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-slate)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="utilizationPct" name="Utilization %" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
