export default function ErrorAlert({ error, onDismiss, shake }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  const details = typeof error === 'object' && error.details ? error.details : [];

  return (
    <div className={`alert alert-error${shake ? ' alert-shake' : ''}`} role="alert">
      <div className="alert-row">
        <strong>{message}</strong>
        {onDismiss && (
          <button type="button" className="btn-link" onClick={onDismiss} aria-label="Dismiss">
            Dismiss
          </button>
        )}
      </div>
      {details.length > 0 && (
        <ul className="field-errors">
          {details.map((d) => (
            <li key={`${d.field}-${d.message}`}>
              <span className="field-name">{d.field}:</span> {d.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
