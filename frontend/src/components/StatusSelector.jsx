import { getAllowedNextStatuses } from '../utils/statusTransitions';

function actionLabel(status) {
  if (status === 'CLOSED') return 'Close ticket';
  if (status === 'IN_PROGRESS') return 'Start progress';
  if (status === 'RESOLVED') return 'Mark resolved';
  if (status === 'CANCELLED') return 'Cancel ticket';
  return status.replace(/_/g, ' ');
}

export default function StatusSelector({ currentStatus, onChange, disabled, loading }) {
  const options = getAllowedNextStatuses(currentStatus);

  if (options.length === 0) {
    return <p className="muted">No further status changes are available for this ticket.</p>;
  }

  return (
    <div className={`status-selector${loading ? ' status-selector-loading' : ''}`}>
      <div className="status-quick-actions" role="group" aria-label="Status actions">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            className={`btn btn-sm${s === 'CLOSED' ? ' btn-close-ticket' : ' btn-secondary'}`}
            disabled={disabled || loading}
            onClick={() => onChange(s)}
          >
            {actionLabel(s)}
          </button>
        ))}
      </div>
      <label htmlFor="status-change">Or choose from list</label>
      <select
        id="status-change"
        className="select-control"
        defaultValue=""
        disabled={disabled || loading}
        aria-busy={loading}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            onChange(value);
            e.target.value = '';
          }
        }}
      >
        <option value="" disabled>Select next status…</option>
        {options.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
      {loading && <p className="muted small" role="status">Updating status…</p>}
    </div>
  );
}
