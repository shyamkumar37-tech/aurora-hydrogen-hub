export default function PageHeader({ title, description, action }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-light)'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>{title}</h1>
        {description && <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0' }}>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
