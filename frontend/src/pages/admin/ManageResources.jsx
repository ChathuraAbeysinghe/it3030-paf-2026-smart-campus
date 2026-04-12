import { useEffect, useState } from "react";
import { resourceService } from "../../services/api";
import GlassTable from "../../components/GlassTable";
import { formatResourceType, getResourceVisual } from "../../components/resource/resourceVisuals";
import "../../components/resource/resource-management.css";

var RESOURCE_TYPES = [
  "LECTURE_HALL",
  "LAB",
  "SEMINAR_ROOM",
  "AUDITORIUM",
  "MEETING_ROOM",
  "STUDY_AREA",
  "EQUIPMENT"
];

var RESOURCE_STATUSES = ["ACTIVE", "OUT_OF_SERVICE"];

var EMPTY_FORM = {
  name: "",
  type: "LECTURE_HALL",
  capacity: "",
  location: "",
  description: "",
  availableFrom: "08:00",
  availableTo: "18:00",
  status: "ACTIVE"
};

function cloneEmptyForm() {
  return {
    name: EMPTY_FORM.name,
    type: EMPTY_FORM.type,
    capacity: EMPTY_FORM.capacity,
    location: EMPTY_FORM.location,
    description: EMPTY_FORM.description,
    availableFrom: EMPTY_FORM.availableFrom,
    availableTo: EMPTY_FORM.availableTo,
    status: EMPTY_FORM.status
  };
}

function parseTimeToMinutes(raw) {
  if (typeof raw !== "string") return -1;
  var text = raw.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) return -1;
  var parts = text.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

export default function ManageResources() {
  var stateResources = useState([]);
  var resources = stateResources[0];
  var setResources = stateResources[1];

  var stateForm = useState(cloneEmptyForm());
  var form = stateForm[0];
  var setForm = stateForm[1];

  var stateEditingId = useState(null);
  var editingId = stateEditingId[0];
  var setEditingId = stateEditingId[1];

  var stateLoading = useState(false);
  var loading = stateLoading[0];
  var setLoading = stateLoading[1];

  var stateSaving = useState(false);
  var saving = stateSaving[0];
  var setSaving = stateSaving[1];

  var stateError = useState("");
  var error = stateError[0];
  var setError = stateError[1];

  var stateFormErrors = useState({});
  var formErrors = stateFormErrors[0];
  var setFormErrors = stateFormErrors[1];

  var stateSuccessMessage = useState("");
  var successMessage = stateSuccessMessage[0];
  var setSuccessMessage = stateSuccessMessage[1];

  useEffect(function () {
    loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);
    try {
      var data = await resourceService.getAll();
      setResources(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load resources.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(cloneEmptyForm());
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function openEdit(resource) {
    setEditingId(resource.id);
    setForm({
      name: resource.name || "",
      type: resource.type || "LECTURE_HALL",
      capacity: resource.capacity != null ? String(resource.capacity) : "",
      location: resource.location || "",
      description: resource.description || "",
      availableFrom: resource.availableFrom || "08:00",
      availableTo: resource.availableTo || "18:00",
      status: resource.status || "ACTIVE"
    });
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(cloneEmptyForm());
  }

  async function handleQuickStatusToggle(resource) {
    var newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
    var confirmed = window.confirm(
      "Change " + resource.name + " status to " + newStatus.replace("_", " ") + "?"
    );
    if (!confirmed) return;

    try {
      await resourceService.updateStatus(resource.id, newStatus);
      setSuccessMessage("Status updated successfully!");
      setTimeout(function () { setSuccessMessage(""); }, 3000);
      await loadResources();
    } catch (err) {
      window.alert(err.message || "Failed to update status.");
    }
  }

  async function handleSave() {
    var errors = {};
    setSuccessMessage("");

    if (!form.name.trim()) {
      errors.name = "Name is required";
    }
    if (!form.location.trim()) {
      errors.location = "Location is required";
    }
    if (!form.description.trim()) {
      errors.description = "Description is required";
    }

    var numericCapacity = Number(form.capacity);
    if (!Number.isFinite(numericCapacity) || numericCapacity < 1) {
      errors.capacity = "Capacity must be at least 1";
    }

    var fromMinutes = parseTimeToMinutes(form.availableFrom);
    var toMinutes = parseTimeToMinutes(form.availableTo);

    if (fromMinutes < 0 || toMinutes < 0) {
      errors.availableTime = "Please enter valid time in HH:mm format";
    } else if (fromMinutes >= toMinutes) {
      errors.availableTime = "Available from must be earlier than available to";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.alert("Please fix the errors below before saving.");
      return;
    }

    setFormErrors({});

    var payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: numericCapacity,
      location: form.location.trim(),
      description: form.description.trim(),
      availableFrom: form.availableFrom,
      availableTo: form.availableTo,
      status: form.status
    };

    setSaving(true);
    try {
      if (editingId) {
        await resourceService.update(editingId, payload);
        setSuccessMessage("Resource updated successfully!");
      } else {
        await resourceService.create(payload);
        setSuccessMessage("Resource created successfully!");
      }

      resetForm();
      setTimeout(function () { setSuccessMessage(""); }, 3000);
      await loadResources();
    } catch (err) {
      var errorMsg = err.message || "Failed to save resource.";
      setError(errorMsg);
      window.alert(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resource) {
    var confirmed = window.confirm("Delete " + resource.name + "?");
    if (!confirmed) return;

    try {
      await resourceService.delete(resource.id);
      await loadResources();
    } catch (err) {
      window.alert(err.message || "Failed to delete resource.");
    }
  }

  var currentVisual = getResourceVisual(form.type);

  var columns = [
    {
      key: "type",
      label: "Visual",
      render: function (value) {
        var visual = getResourceVisual(value);
        return (
          <div className="rm-resource-mini">
            <img src={visual.image} alt={visual.label} className="rm-resource-mini-image" />
            <span className="rm-resource-mini-icon">{visual.icon}</span>
          </div>
        );
      }
    },
    { key: "name", label: "Name" },
    {
      key: "type",
      label: "Type",
      render: function (value) {
        return (
          <span className="filter-chip filter-chip--active" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
            {formatResourceType(value)}
          </span>
        );
      }
    },
    {
      key: "hours",
      label: "Daily Hours",
      render: function (_value, row) {
        return (row.availableFrom || "--:--") + " - " + (row.availableTo || "--:--");
      }
    },
    { key: "capacity", label: "Capacity" },
    { key: "location", label: "Location" },
    {
      key: "status",
      label: "Status",
      render: function (value, row) {
        var active = value === "ACTIVE";
        return (
          <span
            title="Click to change status"
            style={{
              color: active ? "#34D399" : "#F87171",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "2px"
            }}
            onClick={function () { handleQuickStatusToggle(row); }}
          >
              {active ? "ACTIVE" : "OUT OF SERVICE"}
          </span>
        );
      }
    }
  ];

  return (
    <div className="animate-in">
      <div className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Manage Resources</h1>
          <p>Add, edit, and manage campus resources.</p>
        </div>
        <button className="btn-primary" style={{ width: "auto" }} onClick={openCreate}>
          Add Resource
        </button>
      </div>

      {error ? (
        <div className="glass-card" style={{ marginBottom: 16, color: "#F87171" }}>
          {error}
        </div>
      ) : null}

      <div className="rm-admin-layout">
        <div className="glass-card rm-form-card">
          <h3 style={{ margin: 0 }}>{editingId ? "Edit Resource" : "Add Resource"}</h3>
          <p className="rm-form-note">Manage resource metadata and status.</p>

          {successMessage ? (
            <div style={{ 
              padding: "10px 12px", 
              borderRadius: "8px", 
              backgroundColor: "rgba(52, 211, 153, 0.2)",
              color: "#34D399",
              fontSize: "0.8rem",
              marginBottom: "12px",
              border: "1px solid rgba(52, 211, 153, 0.4)"
            }}>
              ✓ {successMessage}
            </div>
          ) : null}

          <div className="rm-form-preview">
            <img src={currentVisual.image} alt={currentVisual.label} className="rm-form-preview-image" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{currentVisual.label}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Icon: {currentVisual.icon}</div>
            </div>
          </div>

          <div className="auth-form" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  value={form.name}
                  onChange={function (e) { setForm({ ...form, name: e.target.value }); }}
                  style={{ borderColor: formErrors.name ? "#F87171" : undefined }}
                />
              </div>
              {formErrors.name ? (
                <div style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "4px" }}>
                  {formErrors.name}
                </div>
              ) : null}
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
                          {formatResourceType(type)}
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
                    style={{ borderColor: formErrors.capacity ? "#F87171" : undefined }}
                  />
                </div>
                {formErrors.capacity ? (
                  <div style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "4px" }}>
                    {formErrors.capacity}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Available From</label>
                <div className="form-input-wrapper">
                  <input
                    type="time"
                    className="form-input"
                    value={form.availableFrom}
                    onChange={function (e) { setForm({ ...form, availableFrom: e.target.value }); }}
                    style={{ borderColor: formErrors.availableTime ? "#F87171" : undefined }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Available To</label>
                <div className="form-input-wrapper">
                  <input
                    type="time"
                    className="form-input"
                    value={form.availableTo}
                    onChange={function (e) { setForm({ ...form, availableTo: e.target.value }); }}
                    style={{ borderColor: formErrors.availableTime ? "#F87171" : undefined }}
                  />
                </div>
              </div>
            </div>
            {formErrors.availableTime ? (
              <div style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "4px", marginBottom: "8px" }}>
                {formErrors.availableTime}
              </div>
            ) : null}

            <div className="form-group">
              <label className="form-label">Location</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  value={form.location}
                  onChange={function (e) { setForm({ ...form, location: e.target.value }); }}
                  style={{ borderColor: formErrors.location ? "#F87171" : undefined }}
                />
              </div>
              {formErrors.location ? (
                <div style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "4px" }}>
                  {formErrors.location}
                </div>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <div className="form-input-wrapper" style={{ alignItems: "flex-start" }}>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description}
                  onChange={function (e) { setForm({ ...form, description: e.target.value }); }}
                  style={{ resize: "vertical", borderColor: formErrors.description ? "#F87171" : undefined }}
                />
              </div>
              {formErrors.description ? (
                <div style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "4px" }}>
                  {formErrors.description}
                </div>
              ) : null}
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
                        {status.split("_").join(" ")}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="rm-form-actions">
              <button className="btn-primary btn-glow" style={{ width: "auto" }} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : (editingId ? "Update Resource" : "Create Resource")}
              </button>
              <button className="btn-secondary" style={{ width: "auto" }} onClick={resetForm}>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <GlassTable
            columns={columns}
            data={resources}
            emptyMessage={loading ? "Loading..." : "No resources found"}
            actions={function (row) {
              return (
                <div style={{ display: "flex", gap: 6 }}>
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
      </div>
    </div>
  );
}