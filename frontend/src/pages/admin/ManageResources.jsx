import { useState, useEffect } from 'react';
import { resourceService } from '../../services/api';
import GlassTable from '../../components/GlassTable';
import GlassModal from '../../components/GlassModal';

/**
 * Admin — Manage Resources (CRUD table).
 */
export default function ManageResources() {
  const [resources, setResources] = useState([]);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', available: true });

  useEffect(() => { load(); }, []);
  const load = async () => setResources(await resourceService.getAll());

  const openCreate = () => {
    setForm({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', available: true });
    setModal({ open: true, editing: null });
  };

  const openEdit = (r) => {
    setForm({ name: r.name, type: r.type, capacity: r.capacity, location: r.location, available: r.available });
    setModal({ open: true, editing: r });
  };

  const handleSave = async () => {
    if (modal.editing) {
      await resourceService.update(modal.editing.id, form);
    } else {
      await resourceService.create(form);
    }
    setModal({ open: false, editing: null });
    load();
  };

  const handleDelete = async (r) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    await resourceService.delete(r.id);
    load();
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => <span className="filter-chip filter-chip--active" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{v.replace('_', ' ')}</span> },
    { key: 'capacity', label: 'Capacity' },
    { key: 'location', label: 'Location' },
    { key: 'available', label: 'Status', render: (v) => <span style={{ color: v ? '#34D399' : '#F87171', fontWeight: 600, fontSize: '0.82rem' }}>{v ? '● Available' : '● In Use'}</span> },
  ];

  return (
    <div className="animate-in">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manage Resources</h1>
          <p>Add, edit, and manage campus facilities.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={openCreate}>➕ Add Resource</button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <GlassTable
          columns={columns}
          data={resources}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-sm btn-sm--primary" onClick={() => openEdit(row)}>Edit</button>
              <button className="btn-sm btn-sm--danger" onClick={() => handleDelete(row)}>Delete</button>
            </div>
          )}
        />
      </div>

      <GlassModal open={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? 'Edit Resource' : 'Add Resource'} width={480}>
        <div className="auth-form" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <div className="form-input-wrapper">
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="form-input-wrapper">
                <select className="form-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {['LECTURE_HALL','LAB','SEMINAR_ROOM','AUDITORIUM','MEETING_ROOM','STUDY_AREA'].map(t =>
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <div className="form-input-wrapper">
                <input type="number" className="form-input" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <div className="form-input-wrapper">
              <input className="form-input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary btn-glow" onClick={handleSave}>
            {modal.editing ? '💾 Update Resource' : '✅ Create Resource'}
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
