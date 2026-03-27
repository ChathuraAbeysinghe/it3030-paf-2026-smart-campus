/**
 * Reusable StatCard component with glassmorphism design.
 * Used across all dashboards.
 */
export default function StatCard({ icon, label, value, accent, trend }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
        {trend && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: trend > 0 ? '#34D399' : '#F87171',
            background: trend > 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            padding: '2px 8px',
            borderRadius: 999,
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value" style={{ color: accent ?? 'var(--primary)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
