import { useState, useEffect } from 'react';
import { resourceService } from '../../services/api';
import GlassTable from '../../components/GlassTable';

var RESOURCE_TYPES = [
  'ALL',
  'LECTURE_HALL',
  'LAB',
  'SEMINAR_ROOM',
  'AUDITORIUM',
  'MEETING_ROOM',
  'STUDY_AREA',
  'EQUIPMENT'
];

export default function Resources() {
  var stateResources = useState([]);
  var resources = stateResources[0];
  var setResources = stateResources[1];

  var stateFilter = useState('ALL');
  var filter = stateFilter[0];
  var setFilter = stateFilter[1];

  var stateSearch = useState('');
  var search = stateSearch[0];
  var setSearch = stateSearch[1];

  var stateLoading = useState(false);
  var loading = stateLoading[0];
  var setLoading = stateLoading[1];

  var stateError = useState('');
  var error = stateError[0];
  var setError = stateError[1];

  useEffect(function () {
    loadResources();
  }, [filter, search]);

  async function loadResources() {
    setLoading(true);
    try {
      var data = await resourceService.getAll({
        type: filter,
        search: search.trim()
      });
      setResources(data);
      setError('');
    } catch (err) {
      setResources([]);
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }

  var columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'type',
      label: 'Type',
      render: function (value) {
        return (
          <span className="filter-chip filter-chip--active" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
            {String(value || '').replace('_', ' ')}
          </span>
        );
      }
    },
    { key: 'capacity', label: 'Capacity' },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: function (value) {
        var active = value === 'ACTIVE';
        return (
          <span style={{ color: active ? '#34D399' : '#F87171', fontWeight: 600 }}>
            {active ? 'ACTIVE' : 'OUT OF SERVICE'}
          </span>
        );
      }
    },
    {
      key: 'description',
      label: 'Description',
      render: function (value) {
        var text = value || '';
        return (
          <span style={{ maxWidth: 300, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {text}
          </span>
        );
      }
    }
  ];

  return (
    <div className="page-content animate-in">
      <div className="content-header">
        <h1>Campus Resources</h1>
        <p>View available campus facilities and assets.</p>
      </div>

      <div className="filter-bar glass-card">
        <div className="filter-search">
          <span className="form-input-icon">Search</span>
          <input
            type="text"
            placeholder="Search by name, location, or description"
            value={search}
            onChange={function (e) { setSearch(e.target.value); }}
            className="form-input"
          />
        </div>

        <div className="filter-chips">
          {RESOURCE_TYPES.map(function (type) {
            return (
              <button
                key={type}
                className={'filter-chip ' + (filter === type ? 'filter-chip--active' : '')}
                onClick={function () { setFilter(type); }}
              >
                {type === 'ALL' ? 'All' : type.replace('_', ' ')}
              </button>
            );
          })}
        </div>
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
        />
      </div>
    </div>
  );
}