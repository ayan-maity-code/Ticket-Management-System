import { useState } from 'react';
import { ALL_STATUSES } from '../utils/statusTransitions';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export default function SearchToolbar({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  searching,
  totalCount,
  showingCount,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="list-toolbar">
      <div className="list-toolbar-head">
        <div>
          <h2 className="list-toolbar-title">All tickets</h2>
          <p className="list-toolbar-meta">
            {showingCount != null && totalCount != null
              ? `${showingCount} shown · ${totalCount} total`
              : 'Search and filter your queue'}
          </p>
        </div>
      </div>
      <div className="list-toolbar-controls">
        <form className="toolbar-search" onSubmit={onSearchSubmit}>
          <label className={`toolbar-search-field${focused ? ' is-focused' : ''}`}>
            <span className="toolbar-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search by title or ID…"
              className="toolbar-search-input"
              aria-label="Search tickets"
            />
            {searchInput && (
              <button type="button" className="toolbar-search-clear" onClick={onClearSearch} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <button type="submit" className={`btn btn-secondary btn-sm${searching ? ' btn-loading' : ''}`} disabled={searching}>
            Search
          </button>
        </form>
        <div className="toolbar-filters">
          <select
            className="select-control select-compact"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">Status ▾</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            className="select-control select-compact"
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">Priority ▾</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
