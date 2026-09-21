import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = Inbox }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <Icon size={48} color="var(--accent-cyan)" />
      </div>
      <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
