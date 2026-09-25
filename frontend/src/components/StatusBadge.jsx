const STYLES = {
  OPEN: 'status-open',
  IN_PROGRESS: 'status-progress',
  RESOLVED: 'status-resolved',
  CLOSED: 'status-closed',
  CANCELLED: 'status-cancelled',
};

const ICONS = {
  OPEN: '○',
  IN_PROGRESS: '◔',
  RESOLVED: '✓',
  CLOSED: '■',
  CANCELLED: '×',
};

const COMPACT_LABEL = {
  OPEN: 'Open',
  IN_PROGRESS: 'Active',
  RESOLVED: 'Done',
  CLOSED: 'Closed',
  CANCELLED: 'Cancel',
};

export default function StatusBadge({ status, animate, compact }) {
  const className = STYLES[status] || 'status-default';
  const label = status ? status.replace(/_/g, ' ') : 'UNKNOWN';
  const displayLabel = compact ? (COMPACT_LABEL[status] || label) : label;
  const icon = ICONS[status] || '•';
  return (
    <span
      className={`status-badge ${className}${animate ? ' status-badge-pulse' : ''}${compact ? ' status-badge-compact' : ''}`}
      title={label}
    >
      {!compact && <span className="status-icon" aria-hidden="true">{icon}</span>}
      <span className="status-label">{displayLabel}</span>
    </span>
  );
}
