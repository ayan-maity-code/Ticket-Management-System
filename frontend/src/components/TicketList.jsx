import TicketRow from './TicketRow';

export default function TicketList({ tickets, listKey, exiting, activeTicketId, compact }) {
  return (
    <div className={`ticket-table${exiting ? ' ticket-table-exit' : ''}${compact ? ' ticket-table-compact' : ''}`} key={listKey}>
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
      <div className="ticket-table-body ticket-table-animate">
        {tickets.map((ticket, index) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            active={String(activeTicketId) === String(ticket.id)}
            compact={compact}
            style={{ animationDelay: `${index * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
