import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';

export default function AdminDispensers() {
  const { id } = useParams(); // station id
  const [dispensers, setDispensers] = useState([]);
  const [nozzleType, setNozzleType] = useState('350 bar');
  const [editingId, setEditingId] = useState(null);

  const fetchDispensers = async () => {
    const { data } = await api.get(`/dispensers?station=${id}`);
    setDispensers(data);
  };

  useEffect(() => {
    fetchDispensers();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/dispensers/${editingId}`, { nozzleType });
      setEditingId(null);
    } else {
      await api.post('/dispensers', { station: id, nozzleType });
    }
    setNozzleType('350 bar');
    fetchDispensers();
  };

  const handleEdit = (d) => {
    setEditingId(d._id);
    setNozzleType(d.nozzleType);
  };

  const handleDelete = async (dispId) => {
    await api.delete(`/dispensers/${dispId}`);
    fetchDispensers();
  };

  return (
    <div>
      <h2>Admin - Manage Dispensers for Station</h2>
      <form onSubmit={handleSubmit}>
        <select value={nozzleType} onChange={(e) => setNozzleType(e.target.value)}>
          <option value="350 bar">350 bar</option>
          <option value="700 bar">700 bar</option>
        </select>
        <button type="submit">{editingId ? 'Update Dispenser' : 'Add Dispenser'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setNozzleType('350 bar'); }}>Cancel</button>}
      </form>
      <ul>
        {dispensers.map(d => (
          <li key={d._id}>
            {d.nozzleType} - {d.status}
            <button onClick={() => handleEdit(d)}>Edit</button>
            <button onClick={() => handleDelete(d._id)}>Delete</button>
          </li>
        ))}
      </ul>
      <Link to="/admin/stations">Back to Stations</Link>
    </div>
  );
}
