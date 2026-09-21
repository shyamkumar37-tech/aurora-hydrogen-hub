import { useState, useEffect } from 'react';
import api from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Users, UserX, Shield, Edit, Trash2, Search, Plus } from 'lucide-react';

export default function AdminStaffCustomers() {
  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stations, setStations] = useState([]);
  
  // Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'staff', stationId: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'staff') {
        const res = await api.get('/admin/staff');
        setStaff(res.data);
        const statRes = await api.get('/stations');
        setStations(statRes.data);
      } else {
        const res = await api.get('/admin/customers');
        setCustomers(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/staff', staffForm);
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', role: 'staff', stationId: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add staff');
    }
  };

  const toggleStaffStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.put(`/admin/staff/${id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleCustomerSuspension = async (id, isSuspended) => {
    try {
      await api.put(`/admin/customers/${id}/suspend`, { isSuspended: !isSuspended });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader 
        title="Staff & Customers" 
        description="Manage your workforce and user accounts."
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Button 
          variant={activeTab === 'staff' ? 'primary' : 'outline'} 
          onClick={() => setActiveTab('staff')}
        >
          <Shield size={16} style={{ marginRight: '8px' }} /> Staff Management
        </Button>
        <Button 
          variant={activeTab === 'customers' ? 'primary' : 'outline'} 
          onClick={() => setActiveTab('customers')}
        >
          <Users size={16} style={{ marginRight: '8px' }} /> Customers Directory
        </Button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {activeTab === 'staff' && (
          <div>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Network Staff</h3>
              <Button onClick={() => setShowStaffModal(true)}>
                <Plus size={16} style={{ marginRight: '8px' }} /> Add Staff
              </Button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name & Email</th>
                    <th>Role</th>
                    <th>Assigned Station</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                      <td>{user.stationId ? user.stationId.name : 'Global/None'}</td>
                      <td>
                        <span className={`status-badge ${user.status === 'active' ? 'active' : 'offline'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <Button 
                          variant="outline" 
                          onClick={() => toggleStaffStatus(user._id, user.status)}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          {user.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Registered Customers</h3>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name & Email</th>
                    <th>Tier</th>
                    <th>Wallet Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </td>
                      <td>{user.tier}</td>
                      <td>₹{user.walletBalance.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${user.isSuspended ? 'cancelled' : 'active'}`}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <Button 
                          variant="outline" 
                          onClick={() => toggleCustomerSuspension(user._id, user.isSuspended)}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: user.isSuspended ? 'var(--accent-cyan)' : 'var(--admin-warning)', color: user.isSuspended ? 'var(--accent-cyan)' : 'var(--admin-warning)' }}
                        >
                          {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showStaffModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Add New Staff</h3>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input className="input-modern" placeholder="Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required />
              <input className="input-modern" type="email" placeholder="Email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} required />
              <input className="input-modern" type="password" placeholder="Password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required />
              <select className="input-modern" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                <option value="staff">Station Manager / Staff</option>
                <option value="admin">Global Admin</option>
              </select>
              {staffForm.role === 'staff' && (
                <select className="input-modern" value={staffForm.stationId} onChange={e => setStaffForm({...staffForm, stationId: e.target.value})}>
                  <option value="">-- Assign to Station --</option>
                  {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              )}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <Button type="submit" style={{ flex: 1 }}>Create Account</Button>
                <Button type="button" variant="outline" onClick={() => setShowStaffModal(false)} style={{ flex: 1 }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
