import { formatResourceType, getResourceVisual } from "./resourceVisuals";

function formatFacility(value) {
  return String(value || "").split("_").join(" ");
}

export default function ResourceDetailsModal({ resource, onClose }) {
  if (!resource) return null;

  var visual = getResourceVisual(resource.type);
  var active = resource.status === "ACTIVE";
  var hoursText = (resource.availableFrom || "--:--") + " - " + (resource.availableTo || "--:--");
  var facilities = Array.isArray(resource.facilities) ? resource.facilities : [];

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="glass-card rm-modal-card" onClick={function (e) { e.stopPropagation(); }}>
        <div className="rm-modal-header-image">
          <img src={visual.image} alt={visual.label} className="rm-modal-image" />
          <span className={"rm-status-pill " + (active ? "rm-status-pill--active" : "rm-status-pill--out")}>
            {active ? "Active" : "Out of Service"}
          </span>
        </div>

        <div className="rm-modal-body">
          <h3 style={{ margin: 0 }}>{resource.name}</h3>
          <div className="rm-resource-type">{formatResourceType(resource.type)}</div>

          <p style={{ marginTop: 8, marginBottom: 10 }}>
            {resource.description || "No description available."}
          </p>

          <div className="rm-resource-meta">
            <span>Building: {resource.buildingName || "-"}</span>
            <span>Block: {resource.block || "-"}</span>
          </div>
          <div className="rm-resource-meta">
            <span>Floor: {resource.floor != null ? resource.floor : "-"}</span>
            <span>Hall No: {resource.hallNumber != null ? resource.hallNumber : "-"}</span>
          </div>
          <div className="rm-resource-meta">
            <span>Hall ID: {resource.hallId || resource.location || "-"}</span>
            <span>Capacity: {resource.capacity || "-"}</span>
          </div>
          <div className="rm-resource-meta">
            <span>Available Hours: {hoursText}</span>
          </div>
          <div className="rm-resource-meta">
            <span>Facilities: {facilities.length > 0 ? facilities.map(formatFacility).join(", ") : "-"}</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
              Facilities
            </div>
            <div className="rm-facility-grid">
              {facilities.length === 0 ? (
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No facilities listed</span>
              ) : facilities.map(function (f) {
                return (
                  <span key={f} className="rm-facility-chip rm-facility-chip--active">
                    {formatFacility(f)}
                  </span>
                );
              })}
            </div>
          </div>

          <button className="btn-secondary" style={{ marginTop: 14 }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
