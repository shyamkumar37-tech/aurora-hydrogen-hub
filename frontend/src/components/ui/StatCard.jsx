export default function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</h4>
        {Icon && <Icon size={20} color="var(--accent-cyan)" />}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
        {value}
      </div>
      {description && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{description}</p>}
    </div>
  );
}
