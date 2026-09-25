import { NavLink, useMatch } from 'react-router-dom';
import { useTicketCount } from '../../context/TicketCountContext';
import { IconPlus, IconTickets } from '../icons/NavIcons';

export default function Sidebar({ mobileOpen, onClose }) {
  const { total } = useTicketCount();
  const homeMatch = useMatch({ path: '/', end: true });
  const ticketListMatch = useMatch('/tickets/:ticketId');
  const onTickets = Boolean(homeMatch || ticketListMatch);

  return (
    <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`} aria-label="Application">
      <div className="sidebar-brand">
        <span className="sidebar-logo" aria-hidden="true" />
        <span className="sidebar-brand-text">Support Desk</span>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">Menu</p>
        <nav className="sidebar-nav">
          <NavLink
            to="/tickets/new"
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
            onClick={onClose}
          >
            <IconPlus className="sidebar-link-icon" />
            <span>Create ticket</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">Views</p>
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={() => `sidebar-link${onTickets ? ' sidebar-link-active' : ''}`}
            onClick={onClose}
          >
            <IconTickets className="sidebar-link-icon" />
            <span className="sidebar-link-text">All tickets</span>
            {total != null && <span className="sidebar-count">{total}</span>}
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
