export default function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem' }}>{title}</h3>
        
        <div style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
          {children}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {actions}
        </div>
      </div>
    </div>
  );
}
