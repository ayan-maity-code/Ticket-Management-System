import { Outlet, useMatch } from 'react-router-dom';
import TicketListPage from '../../pages/TicketListPage';

export default function TicketsWorkspace() {
  const detailMatch = useMatch('/tickets/:ticketId');
  const ticketId = detailMatch?.params?.ticketId;
  const split = Boolean(ticketId);

  return (
      <div className={`tickets-workspace${split ? ' is-split' : ''}`}>
        <section className="workspace-list-pane" aria-label="Ticket list">
          <TicketListPage activeTicketId={ticketId} compact={split} />
        </section>
        {split ? (
          <section className="workspace-detail-pane" aria-label="Ticket details">
            <Outlet />
          </section>
        ) : (
          <aside className="workspace-detail-placeholder" aria-hidden="true">
            <div className="placeholder-inner">
              <p className="placeholder-title">Select a ticket</p>
              <p className="placeholder-desc">Choose a row from the list to view details, status, and comments.</p>
            </div>
          </aside>
        )}
      </div>
  );
}
