import { formatResourceType, getResourceVisual } from "./resourceVisuals";

export default function ResourceDetailsModal({ resource, onClose }) {
  if (!resource) return null;

  var visual = getResourceVisual(resource.type);
  var active = resource.status === "ACTIVE";
  var hoursText = (resource.availableFrom || "--:--") + " - " + (resource.availableTo || "--:--");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: 0,
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
        }}
        onClick={function (e) { e.stopPropagation(); }}
      >
        {/* Header Image */}
        <div style={{ position: "relative", height: "280px", overflow: "hidden" }}>
          <img
            src={visual.image}
            alt={visual.label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              left: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(0,0,0,0.3), rgba(59,130,246,0.2))",
              pointerEvents: "none"
            }}
          />

          {/* Icon Badge */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              fontSize: "2.5rem",
              lineHeight: 1,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: "8px 12px",
              borderRadius: "12px",
              border: "2px solid rgba(59, 130, 246, 0.3)"
            }}
          >
            {visual.icon}
          </div>

          {/* Status Badge */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: active ? "rgba(52, 211, 153, 0.9)" : "rgba(248, 113, 113, 0.9)",
              color: active ? "#10B981" : "#EF4444",
              border: "1px solid " + (active ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)")
            }}
          >
            {active ? "ACTIVE\" : \"OUT OF SERVICE\"}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              fontSize: "1.2rem",
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              padding: 0
            }}
            onMouseEnter={function (e) {
              e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              e.target.style.borderColor = "rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={function (e) {
              e.target.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {/* Title */}
          <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "1.5rem", fontWeight: 700 }}>
            {resource.name}
          </h2>
          <p style={{ marginBottom: "16px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            {formatResourceType(resource.type)}
          </p>

          {/* Description */}
          <p
            style={{
              marginBottom: "20px",
              fontSize: "0.95rem\",
              lineHeight: \"1.6\",
              color: \"var(--text-secondary)\"
            }}
          >
            {resource.description || \"No description available.\"}
          </p>

          {/* Details Grid */}
          <div
            style={{
              display: \"grid\",
              gridTemplateColumns: \"1fr 1fr\",
              gap: \"16px\",
              marginBottom: \"20px\"
            }}
          >
            {/* Location */}
            <div
              style={{
                padding: \"12px\",
                borderRadius: \"10px\",
                backgroundColor: \"rgba(59, 130, 246, 0.1)\",
                border: \"1px solid rgba(59, 130, 246, 0.2)\"
              }}
            >
              <div style={{ fontSize: \"0.75rem\", color: \"var(--text-muted)\", marginBottom: \"4px\" }}>
                LOCATION
              </div>
              <div style={{ fontSize: \"0.9rem\", fontWeight: 600 }}>
                {resource.location || \"Not specified\"}
              </div>
            </div>

            {/* Capacity */}
            <div
              style={{
                padding: \"12px\",
                borderRadius: \"10px\",
                backgroundColor: \"rgba(59, 130, 246, 0.1)\",
                border: \"1px solid rgba(59, 130, 246, 0.2)\"
              }}
            >
              <div style={{ fontSize: \"0.75rem\", color: \"var(--text-muted)\", marginBottom: \"4px\" }}>
                CAPACITY
              </div>
              <div style={{ fontSize: \"0.9rem\", fontWeight: 600 }}>
                {resource.capacity || \"N/A\"} persons
              </div>
            </div>

            {/* Available Hours */}
            <div
              style={{
                padding: \"12px\",
                borderRadius: \"10px\",
                backgroundColor: \"rgba(59, 130, 246, 0.1)\",
                border: \"1px solid rgba(59, 130, 246, 0.2)\"
              }}
            >
              <div style={{ fontSize: \"0.75rem\", color: \"var(--text-muted)\", marginBottom: \"4px\" }}>
                AVAILABLE HOURS
              </div>
              <div style={{ fontSize: \"0.9rem\", fontWeight: 600 }}>
                {hoursText}
              </div>
            </div>

            {/* Status */}
            <div
              style={{
                padding: \"12px\",
                borderRadius: \"10px\",
                backgroundColor: active ? \"rgba(52, 211, 153, 0.1)\" : \"rgba(248, 113, 113, 0.1)\",
                border: \"1px solid \" + (active ? \"rgba(52, 211, 153, 0.2)\" : \"rgba(248, 113, 113, 0.2)\")
              }}
            >
              <div style={{ fontSize: \"0.75rem\", color: \"var(--text-muted)\", marginBottom: \"4px\" }}>
                STATUS
              </div>
              <div
                style={{
                  fontSize: \"0.9rem\",
                  fontWeight: 600,
                  color: active ? \"#34D399\" : \"#F87171\"
                }}
              >
                {active ? \"Active\" : \"Out of Service\"}
              </div>
            </div>
          </div>

          {/* Close Button at Bottom */}
          <button
            onClick={onClose}
            style={{
              width: \"100%\",
              padding: \"10px 16px\",
              borderRadius: \"8px\",
              border: \"1px solid rgba(59, 130, 246, 0.3)\",
              backgroundColor: \"rgba(59, 130, 246, 0.1)\",
              color: \"#3B82F6\",
              fontWeight: 600,
              cursor: \"pointer\",
              fontSize: \"0.9rem\",
              transition: \"all 0.2s\"
            }}
            onMouseEnter={function (e) {
              e.target.style.backgroundColor = \"rgba(59, 130, 246, 0.2)\";
              e.target.style.borderColor = \"rgba(59, 130, 246, 0.5)\";
            }}
            onMouseLeave={function (e) {
              e.target.style.backgroundColor = \"rgba(59, 130, 246, 0.1)\";
              e.target.style.borderColor = \"rgba(59, 130, 246, 0.3)\";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
