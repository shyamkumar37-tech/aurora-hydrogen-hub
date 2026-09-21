import { useState, useEffect } from 'react';
import { Users, Shield, Search, UserCheck, UserX, CreditCard, Plus, Check } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function UserRoleManager({ onClose }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(500);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleToggleSuspend = async (userId, isSuspended) => {
    try {
      await api.put(`/admin/customers/${userId}/suspend`, { isSuspended: !isSuspended });
      toast.success(isSuspended ? 'Account unblocked' : 'Account suspended');
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.post(`/admin/users/${selectedUser._id}/adjust-wallet`, { amount: Number(adjustAmount) });
      toast.success(`₹${adjustAmount} credited to ${selectedUser.name}'s wallet`);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to adjust wallet');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(168, 85, 247, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <Users size={20} color="#c084fc" />
              </div>
              <span style={{ color: '#c084fc', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Access Governance & Directory
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              User Directory & RBAC Permissions
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >
            Close
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '22px', position: 'relative' }}>
          <Search size={16} color="#71717a" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input 
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              background: '#12141d',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              paddingLeft: '44px',
              paddingRight: '16px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {/* Wallet Credit Sub-modal */}
        {selectedUser && (
          <form onSubmit={handleAdjustWallet} style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>Credit Wallet: {selectedUser.name}</span>
              <span style={{ fontSize: '12px', color: '#a1a1aa', display: 'block' }}>Current Balance: ₹{selectedUser.walletBalance || 0}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                style={{ width: '100px', height: '38px', background: '#12141d', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', padding: '0 10px', fontSize: '13px' }}
              />
              <button type="submit" style={{ background: '#a855f7', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Credit Funds</button>
              <button type="button" onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map(u => (
            <div 
              key={u._id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>{u.name}</span>
                  <span style={{
                    background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'staff' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: u.role === 'admin' ? '#ef4444' : u.role === 'staff' ? '#3b82f6' : '#10b981',
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {u.role}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{u.email} · Wallet: ₹{u.walletBalance || 0}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select 
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  style={{ background: '#12141d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Station Operator</option>
                  <option value="admin">Administrator</option>
                </select>

                <button 
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  + Credit
                </button>

                <button 
                  type="button"
                  onClick={() => handleToggleSuspend(u._id, u.isSuspended)}
                  style={{
                    background: u.isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${u.isSuspended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: u.isSuspended ? '#10b981' : '#ef4444',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {u.isSuspended ? 'Unblock' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
