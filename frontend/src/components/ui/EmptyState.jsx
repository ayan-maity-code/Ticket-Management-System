export default function EmptyState({ icon = '◇', title, description, action, compact }) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h2 className="empty-state-title">{title}</h2>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  );
}
