import { Link } from 'react-router-dom';
import { IconEye } from './icons/NavIcons';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { formatDateShort } from '../utils/formatDate';

const STATUS_DOT = {
  OPEN: 'dot-open',
  IN_PROGRESS: 'dot-progress',
  RESOLVED: 'dot-resolved',
  CLOSED: 'dot-closed',
  CANCELLED: 'dot-cancelled',
};

export default function TicketRow({ ticket, style, active, compact }) {
  const dotClass = STATUS_DOT[ticket.status] || 'dot-default';

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className={`ticket-row${active ? ' ticket-row-active' : ''}`}
      style={style}
      aria-current={active ? 'true' : undefined}
      aria-label={`Open ticket ${ticket.title}`}
    >
      <span className={`ticket-status-dot ${dotClass}`} aria-hidden="true" />
      <span className="ticket-row-id">#{ticket.id}</span>
      <div className="ticket-row-main">
        <span className="ticket-row-title">{ticket.title}</span>
        <span className="ticket-row-preview">{ticket.description}</span>
      </div>
      <span className="ticket-row-cell ticket-row-assignee">
        {ticket.assignee || 'Unassigned'}
      </span>
      <span className="ticket-row-cell ticket-row-priority">
        <PriorityBadge priority={ticket.priority} compact />
      </span>
      <span className="ticket-row-cell ticket-row-status">
        <StatusBadge status={ticket.status} compact={compact} />
      </span>
      <span className="ticket-row-cell ticket-row-date muted">
        {formatDateShort(ticket.createdAt)}
      </span>
      <span className="ticket-row-cell ticket-row-date muted">
        {formatDateShort(ticket.updatedAt)}
      </span>
      <span className="ticket-row-action" aria-hidden="true">
        <IconEye />
      </span>
    </Link>
  );
}
