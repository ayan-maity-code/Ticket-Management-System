export default function Reveal({ children, delay = 0, className = '' }) {
  return (
    <div
      className={`reveal ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </div>
  );
}
