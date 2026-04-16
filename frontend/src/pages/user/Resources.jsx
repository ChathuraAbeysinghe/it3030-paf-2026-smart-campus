import { useEffect, useState } from "react";
import { resourceService } from "../../services/api";
import { formatResourceType, getResourceVisual } from "../../components/resource/resourceVisuals";
import ResourceDetailsModal from "../../components/resource/ResourceDetailsModal";
import "../../components/resource/resource-management.css";

var RESOURCE_TYPES = [
  "ALL",
  "LECTURE_HALL",
  "LAB",
  "SEMINAR_ROOM",
  "AUDITORIUM",
  "MEETING_ROOM",
  "STUDY_AREA",
  "EQUIPMENT"
];

export default function Resources() {
  var stateResources = useState([]);
  var resources = stateResources[0];
  var setResources = stateResources[1];

  var stateFilter = useState("ALL");
  var filter = stateFilter[0];
  var setFilter = stateFilter[1];

  var stateSearch = useState("");
  var search = stateSearch[0];
  var setSearch = stateSearch[1];

  var stateLoading = useState(false);
  var loading = stateLoading[0];
  var setLoading = stateLoading[1];

  var stateError = useState("");
  var error = stateError[0];
  var setError = stateError[1];

  var stateSelectedResource = useState(null);
  var selectedResource = stateSelectedResource[0];
  var setSelectedResource = stateSelectedResource[1];

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

      var list = Array.isArray(data) ? data : [];
      setResources(list);
      setError("");
    } catch (err) {
      setResources([]);
      setError(err.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }

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
                className={"filter-chip " + (filter === type ? "filter-chip--active" : "")}
                onClick={function () { setFilter(type); }}
              >
                {type === "ALL" ? "All" : type.split("_").join(" ")}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="glass-card" style={{ marginBottom: 16, color: "#F87171" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="glass-card" style={{ padding: 20 }}>Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="glass-card" style={{ padding: 20 }}>No resources found.</div>
      ) : (
        <div className="rm-card-grid">
          {resources.map(function (resource) {
            var visual = getResourceVisual(resource.type);
            var active = resource.status === "ACTIVE";
            var hoursText = (resource.availableFrom || "--:--") + " - " + (resource.availableTo || "--:--");

            return (
              <div
                className="glass-card rm-resource-card"
                key={resource.id}
                onClick={function () { setSelectedResource(resource); }}
                style={{
                  cursor: "pointer"
                }}
              >
                <div className="rm-resource-image-wrap">
                  <img src={visual.image} alt={visual.label} className="rm-resource-image" />
                  <span className="rm-resource-icon-badge">{visual.icon}</span>
                  <span className={"rm-status-pill " + (active ? "rm-status-pill--active" : "rm-status-pill--out")}>
                    {active ? "Active" : "Out of Service"}
                  </span>
                </div>

                <div className="rm-resource-body">
                  <h3 style={{ margin: 0 }}>{resource.name}</h3>
                  <div className="rm-resource-type">{formatResourceType(resource.type)}</div>
                  <p className="rm-resource-desc">{resource.description || "No description available."}</p>

                  <div className="rm-resource-meta">
                    <span>Location: {resource.location || "-"}</span>
                    <span>Capacity: {resource.capacity || "-"}</span>
                  </div>

                  <div className="rm-resource-meta" style={{ marginTop: -6, marginBottom: 4 }}>
                    <span>Available Hours: {hoursText}</span>
                  </div>

                  <div className="rm-resource-meta" style={{ marginTop: -6, marginBottom: 0 }}>
                    <span>Hall ID: {resource.hallId || resource.location || "-"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ResourceDetailsModal
        resource={selectedResource}
        onClose={function () { setSelectedResource(null); }}
      />
    </div>
  );
}