export default function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) {
  return (
    <div 
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        display: 'inline-block'
      }}
    />
  );
}
