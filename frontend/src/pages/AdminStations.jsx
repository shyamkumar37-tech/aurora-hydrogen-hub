import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Edit2, Plus, MapPin, Fuel } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function AdminStations() {
  const [stations, setStations] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);

  const fetchStations = async () => {
    try {
      const { data } = await api.get('/stations');
      setStations(data);
    } catch (error) {
      toast.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Station name cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/stations/${editingId}`, { name });
        toast.success('Station updated successfully');
        setEditingId(null);
      } else {
        await api.post('/stations', { name });
        toast.success('Station created successfully');
      }
      setName('');
      fetchStations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (station) => {
    setEditingId(station._id);
    setName(station.name);
  };

  const confirmDelete = (station) => {
    setStationToDelete(station);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!stationToDelete) return;
    try {
      await api.delete(`/stations/${stationToDelete._id}`);
      toast.success('Station deleted successfully');
      fetchStations();
    } catch (error) {
      toast.error('Failed to delete station');
    } finally {
      setDeleteModalOpen(false);
      setStationToDelete(null);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link to="/admin-dashboard" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1rem', textDecoration: 'none' }}>
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Dashboard
      </Link>

      <PageHeader 
        title="Manage Stations" 
        description="Add, edit, or remove hydrogen refueling stations."
      />

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{editingId ? 'Edit Station' : 'Add New Station'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Station Name</label>
            <input 
              className="input-modern"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Downtown Hydrogen Hub" 
            />
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            {editingId ? <><Edit2 size={16} style={{marginRight:'8px'}}/> Update</> : <><Plus size={16} style={{marginRight:'8px'}}/> Add Station</>}
          </Button>
          {editingId && (
            <Button variant="outline" type="button" onClick={() => { setEditingId(null); setName(''); }}>
              Cancel
            </Button>
          )}
        </form>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>
            <Skeleton height="60px" style={{ marginBottom: '12px' }} />
            <Skeleton height="60px" style={{ marginBottom: '12px' }} />
            <Skeleton height="60px" />
          </div>
        ) : stations.length === 0 ? (
          <EmptyState 
            title="No Stations Found" 
            description="Get started by adding your first hydrogen station above."
            icon={MapPin}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stations.map(station => (
              <div key={station._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                    <MapPin size={20} color="var(--accent-cyan)" style={{ marginRight: '12px' }}/>
                    {station.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
                    Status: <span className={`status-badge ${station.status === 'active' || station.status === 'operational' ? 'active' : (station.status === 'maintenance' ? 'pending' : 'offline')}`} style={{ marginLeft: '8px' }}>{station.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Link to={`/admin/stations/${station._id}/dispensers`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" style={{ padding: '8px 12px' }}>
                      <Fuel size={16} style={{ marginRight: '8px' }}/> Dispensers
                    </Button>
                  </Link>
                  <button onClick={() => handleEdit(station)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px' }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => confirmDelete(station)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        actions={<>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button style={{ background: '#ef4444', boxShadow: 'none' }} onClick={handleDelete}>Delete Station</Button>
        </>}
      >
        <p>Are you sure you want to delete <strong>{stationToDelete?.name}</strong>? This action cannot be undone and will also delete all associated dispensers and inventory.</p>
      </Modal>
    </div>
  );
}
