import { useState, useEffect } from 'react';
import { resourceService } from '../../services/api';
import GlassTable from '../../components/GlassTable';
import GlassModal from '../../components/GlassModal';

var RESOURCE_TYPES = [
  'LECTURE_HALL',
  'LAB',
  'SEMINAR_ROOM',
  'AUDITORIUM',
  'MEETING_ROOM',
  'STUDY_AREA',
  'EQUIPMENT'
];

var RESOURCE_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE'];

var EMPTY_FORM = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  description: '',
  status: 'ACTIVE'
};

export default function ManageResources() {
  var initialModal = { open: false, editing: null };

  var stateResources = useState([]);
  var resources = stateResources[0];
  var setResources = stateResources[1];

  var stateModal = useState(initialModal);
  var modal = stateModal[0];
  var setModal = stateModal[1];

  var stateForm = useState(EMPTY_FORM);
  var form = stateForm[0];
  var setForm = stateForm[1];

  var stateLoading = useState(false);
  var loading = stateLoading[0];
  var setLoading = stateLoading[1];

  var stateSaving = useState(false);
  var saving = stateSaving[0];
  var setSaving = stateSaving[1];

  var stateError = useState('');
  var error = stateError[0];
  var setError = stateError[1];

  useEffect(function () {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      var data = await resourceService.getAll();
      setResources(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  }

  function openEdit(resource) {
    setForm({
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      capacity: resource.capacity != null ? String(resource.capacity) : '',
      location: resource.location || '',
      description: resource.description || '',
      status: resource.status || 'ACTIVE'
    });
    setModal({ open: true, editing: resource });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.location.trim() || !form.description.trim()) {
      window.alert('Name, location and description are required.');
      return;
    }

    var numericCapacity = Number(form.capacity);
    if (!Number.isFinite(numericCapacity) || numericCapacity < 1) {
      window.alert('Capacity must be at least 1.');
      return;
    }

    var payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: numericCapacity,
      location: form.location.trim(),
      description: form.description.trim(),
      status: form.status
    };

    setSaving(true);
    try {
      if (modal.editing) {
        await resourceService.update(modal.editing.id, payload);
      } else {
        await resourceService.create(payload);
      }

      setModal(initialModal);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      window.alert(err.message || 'Failed to save resource.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resource) {
    var confirmed = window.confirm('Delete "' + resource.name + '"?');
    if (!confirmed) {
      return;
    }

    try {
      await resourceService.delete(resource.id);
      await load();
    } catch (err) {
      window.alert(err.message || 'Failed to delete resource.');
    }
  }

  var columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'type',
      label: 'Type',
      render: function (value) {
        var text = String(value || '').replace('_', ' ');
        return (
          <span className="filter-chip filter-chip--active" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
            {text}
          </span>
        );
      }
    },
    { key: 'capacity', label: 'Capacity' },
    { key: 'location', label: 'Location' },
    {
      key: 'description',
      label: 'Description',
      render: function (value) {
        var text = value || '';
        return (
          <span style={{ maxWidth: 220, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {text}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: function (value) {
        var active = value === 'ACTIVE';
        return (
          <span style={{ color: active ? '#34D399' : '#F87171', fontWeight: 600, fontSize: '0.82rem' }}>
            {active ? 'ACTIVE' : 'OUT OF SERVICE'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="animate-in">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manage Resources</h1>
          <p>Add, edit, and manage campus resources.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={openCreate}>
          Add Resource
        </button>
      </div>

      {error ? (
        <div className="glass-card" style={{ marginBottom: 16, color: '#F87171' }}>
          {error}
        </div>
      ) : null}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <GlassTable
          columns={columns}
          data={resources}
          emptyMessage={loading ? 'Loading...' : 'No resources found'}
          actions={function (row) {
            return (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-sm btn-sm--primary" onClick={function () { openEdit(row); }}>
                  Edit
                </button>
                <button className="btn-sm btn-sm--danger" onClick={function () { handleDelete(row); }}>
                  Delete
                </button>
              </div>
            );
          }}
        />
      </div>

      <GlassModal
        open={modal.open}
        onClose={function () { setModal(initialModal); }}
        title={modal.editing ? 'Edit Resource' : 'Add Resource'}
        width={520}
      >
        <div className="auth-form" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <div className="form-input-wrapper">
              <input
                className="form-input"
                value={form.name}
                onChange={function (e) { setForm({ ...form, name: e.target.value }); }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="form-input-wrapper">
                <select
                  className="form-input"
                  value={form.type}
                  onChange={function (e) { setForm({ ...form, type: e.target.value }); }}
                >
                  {RESOURCE_TYPES.map(function (type) {
                    return (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Capacity</label>
              <div className="form-input-wrapper">
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.capacity}
                  onChange={function (e) { setForm({ ...form, capacity: e.target.value }); }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <div className="form-input-wrapper">
              <input
                className="form-input"
                value={form.location}
                onChange={function (e) { setForm({ ...form, location: e.target.value }); }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <div className="form-input-wrapper" style={{ alignItems: 'flex-start' }}>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={function (e) { setForm({ ...form, description: e.target.value }); }}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="form-input-wrapper">
              <select
                className="form-input"
                value={form.status}
                onChange={function (e) { setForm({ ...form, status: e.target.value }); }}
              >
                {RESOURCE_STATUSES.map(function (status) {
                  return (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <button className="btn-primary btn-glow" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (modal.editing ? 'Update Resource' : 'Create Resource')}
          </button>
        </div>
      </GlassModal>
    </div>
  );
}