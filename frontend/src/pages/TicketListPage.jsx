import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTickets } from '../api/ticketApi';
import { ApiError } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import SearchToolbar from '../components/SearchToolbar';
import TicketList from '../components/TicketList';
import EmptyState from '../components/ui/EmptyState';
import { TicketListSkeleton } from '../components/ui/Skeleton';
import { usePageMeta } from '../context/PageMetaContext';
import { useTicketCount } from '../context/TicketCountContext';

const LIST_EXIT_MS = 220;

export default function TicketListPage({ activeTicketId, compact }) {
  const { setMeta } = usePageMeta();
  const { setTotal } = useTicketCount();
  const [tickets, setTickets] = useState([]);
  const [shownTickets, setShownTickets] = useState([]);
  const [listExiting, setListExiting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchSubmitting, setSearchSubmitting] = useState(false);
  const exitTimer = useRef(null);

  useEffect(() => {
    setMeta({ title: 'All tickets' });
  }, [setMeta]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTickets({ q: q || undefined, status: statusFilter || undefined });
      const items = data.items ?? [];
      setTickets(items);
      setTotal(items.length);
    } catch (err) {
      setTickets([]);
      setTotal(0);
      setError(err instanceof ApiError ? err : new ApiError('Failed to load tickets'));
    } finally {
      setLoading(false);
      setSearchSubmitting(false);
    }
  }, [q, statusFilter, setTotal]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading) {
      setShownTickets(tickets);
      setListExiting(false);
      return undefined;
    }
    if (shownTickets.length === 0) {
      return undefined;
    }
    setListExiting(true);
    exitTimer.current = window.setTimeout(() => {
      setShownTickets([]);
      setListExiting(false);
    }, LIST_EXIT_MS);
    return () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    };
  }, [loading, tickets, shownTickets.length]);

  const filteredTickets = useMemo(() => {
    if (!priorityFilter) return shownTickets;
    return shownTickets.filter((t) => t.priority === priorityFilter);
  }, [shownTickets, priorityFilter]);

  const hasFilters = Boolean(q || statusFilter || priorityFilter);
  const listKey = `${q}|${statusFilter}|${priorityFilter}|${filteredTickets.map((t) => t.id).join(',')}`;
  const showSkeleton = loading && shownTickets.length === 0;

  return (
    <div className={`page page-list${compact ? ' page-list-compact' : ''}`}>
      <SearchToolbar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={(e) => {
          e.preventDefault();
          setSearchSubmitting(true);
          setQ(searchInput.trim());
        }}
        onClearSearch={() => {
          setSearchInput('');
          setQ('');
        }}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        searching={searchSubmitting && loading}
        totalCount={tickets.length}
        showingCount={filteredTickets.length}
      />

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {showSkeleton && <TicketListSkeleton count={compact ? 6 : 10} />}

      {!loading && !error && tickets.length === 0 && !hasFilters && (
        <EmptyState
          icon="◇"
          title="No tickets yet"
          description="Create a ticket to start tracking support requests."
          action={<Link className="btn btn-primary" to="/tickets/new">Create ticket</Link>}
        />
      )}

      {!loading && !error && filteredTickets.length === 0 && hasFilters && (
        <EmptyState
          icon="⌕"
          title="No matching tickets"
          description="Adjust search or filters to find what you need."
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchInput('');
                setQ('');
                setStatusFilter('');
                setPriorityFilter('');
              }}
            >
              Clear filters
            </button>
          }
        />
      )}

      {!loading && filteredTickets.length > 0 && (
        <TicketList
          tickets={filteredTickets}
          listKey={listKey}
          exiting={listExiting}
          activeTicketId={activeTicketId}
          compact={compact}
        />
      )}
    </div>
  );
}
