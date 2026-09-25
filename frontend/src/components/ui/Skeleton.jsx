export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

const ROW_GRID = '1.25rem 3.5rem 1fr 6rem 5rem 6.5rem 5.5rem 5.5rem 2rem';

export function TicketListSkeleton({ count = 8 }) {
  return (
    <div className="ticket-table ticket-table-skeleton">
      <div className="ticket-table-head" aria-hidden="true">
        <span className="col-dot" />
        <span>#</span>
        <span>Subject</span>
        <span>Assignee</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Created</span>
        <span>Updated</span>
        <span className="col-action" />
      </div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 40}ms`, gridTemplateColumns: ROW_GRID }}>
          <Skeleton className="sk-dot" />
          <Skeleton className="sk-id" />
          <Skeleton className="sk-main" />
          <Skeleton className="sk-assignee" />
          <Skeleton className="sk-chip" />
          <Skeleton className="sk-chip" />
          <Skeleton className="sk-date" />
          <Skeleton className="sk-date" />
          <Skeleton className="sk-action" />
        </div>
      ))}
    </div>
  );
}

export function TicketDetailSkeleton({ embedded }) {
  return (
    <div className={`page page-detail${embedded ? ' page-detail-embedded' : ''}`}>
      <div className="detail-layout detail-layout-embedded">
        <div className="panel">
          <Skeleton className="sk-h2" />
          <Skeleton className="sk-line" />
          <Skeleton className="sk-line short" />
        </div>
      </div>
    </div>
  );
}
