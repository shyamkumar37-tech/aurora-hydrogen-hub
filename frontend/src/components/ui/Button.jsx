import { Loader2 } from 'lucide-react';

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false,
  className = '',
  ...props 
}) {
  const baseClass = variant === 'primary' ? 'btn btn-primary' : 'btn btn-outline';
  const isDisabled = disabled || isLoading;
  
  return (
    <button 
      className={`${baseClass} ${className}`} 
      disabled={isDisabled}
      style={{ opacity: isDisabled ? 0.6 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />}
      {children}
    </button>
  );
}
