import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { Link } from 'react-router-dom';
import NotificationsWidget from '../components/NotificationsWidget';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  if (!profile) return <div className="p-8 text-center text-slate-300">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">My Profile</h1>
          <div className="flex gap-4">
            <NotificationsWidget />
            <Link to="/customer-dashboard" className="px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition">Back to Dashboard</Link>
            <button onClick={logout} className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition">Logout</button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl text-slate-100 font-semibold mb-2">{profile.name}</h2>
          <p className="text-slate-400 mb-6">{profile.email}</p>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 flex flex-col items-center">
            <div className="text-sm text-cyan-400 tracking-wider uppercase font-semibold mb-2">Loyalty Tier</div>
            <div className={`text-4xl font-bold mb-4 ${
              profile.tier === 'Platinum' ? 'text-purple-400' :
              profile.tier === 'Gold' ? 'text-yellow-400' :
              profile.tier === 'Silver' ? 'text-slate-300' : 'text-orange-400'
            }`}>
              {profile.tier}
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-4 mb-2 overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((profile.loyaltyPoints / 500) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between w-full text-xs text-slate-500">
              <span>0 pts</span>
              <span className="text-cyan-400 font-bold">{profile.loyaltyPoints} pts</span>
              <span>500 pts</span>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">Earn 10 points per successful refueling transaction!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
