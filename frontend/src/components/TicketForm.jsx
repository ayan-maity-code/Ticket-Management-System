import { useState } from 'react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export default function TicketForm({
  initialValues = {},
  onSubmit,
  submitLabel,
  loading,
  serverFieldErrors = {},
  compact = false,
}) {
  const [title, setTitle] = useState(initialValues.title ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [priority, setPriority] = useState(initialValues.priority ?? 'MEDIUM');
  const [assignee, setAssignee] = useState(initialValues.assignee ?? '');
  const [clearAssignee, setClearAssignee] = useState(false);
  const [clientError, setClientError] = useState('');

  const isUpdate = submitLabel?.toLowerCase().includes('update');

  function handleSubmit(e) {
    e.preventDefault();
    setClientError('');

    if (!title.trim()) {
      setClientError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setClientError('Description is required.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
    };

    if (isUpdate) {
      if (clearAssignee) payload.assignee = null;
      else if (assignee.trim()) payload.assignee = assignee.trim();
    } else if (assignee.trim()) {
      payload.assignee = assignee.trim();
    }

    onSubmit(payload);
  }

  return (
    <form className={`ticket-form${compact ? ' ticket-form-compact' : ''}`} onSubmit={handleSubmit} noValidate>
      {clientError && <p className="form-error" role="alert">{clientError}</p>}

      <div className="form-grid">
        <label className="form-span-2">
          Title
          <input
            className="field-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(serverFieldErrors.title)}
          />
          {serverFieldErrors.title && <span className="field-error">{serverFieldErrors.title}</span>}
        </label>

        <label className="form-span-2">
          Description
          <textarea
            className="field-control"
            rows={compact ? 3 : 5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(serverFieldErrors.description)}
          />
          {serverFieldErrors.description && <span className="field-error">{serverFieldErrors.description}</span>}
        </label>

        <label>
          Priority
          <select
            className="select-control"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={loading}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Assignee (optional)
          <input
            className="field-control"
            value={assignee}
            onChange={(e) => {
              setAssignee(e.target.value);
              setClearAssignee(false);
            }}
            disabled={loading || clearAssignee}
            placeholder="Name or team"
          />
        </label>
      </div>

      {isUpdate && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={clearAssignee}
            onChange={(e) => setClearAssignee(e.target.checked)}
            disabled={loading}
          />
          Clear assignee
        </label>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
