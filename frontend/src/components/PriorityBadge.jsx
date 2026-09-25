const STYLES = {
  LOW: 'priority-low',
  MEDIUM: 'priority-medium',
  HIGH: 'priority-high',
};

export default function PriorityBadge({ priority, compact }) {
  const key = priority?.toUpperCase();
  const className = STYLES[key] || 'priority-default';
  const label = priority || '—';
  return (
    <span className={`priority-badge ${className}${compact ? ' priority-compact' : ''}`}>
      <span className="priority-dot" aria-hidden="true" />
      {compact ? label : label}
    </span>
  );
}
