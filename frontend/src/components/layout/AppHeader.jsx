import { Link, useLocation, useMatch, useParams } from 'react-router-dom';
import { usePageMeta } from '../../context/PageMetaContext';
import { IconMenu } from '../icons/NavIcons';

function useBreadcrumb() {
  const { pathname } = useLocation();
  const { ticketId } = useParams();

  if (pathname === '/') {
    return { crumbs: [{ label: 'Tickets' }], title: 'Tickets' };
  }
  if (pathname === '/tickets/new') {
    return {
      crumbs: [{ label: 'Tickets', to: '/' }, { label: 'Create' }],
      title: 'Create ticket',
    };
  }
  if (ticketId) {
    return {
      crumbs: [{ label: 'Tickets', to: '/' }, { label: `#${ticketId}` }],
      title: `Ticket #${ticketId}`,
    };
  }
  return { crumbs: [{ label: 'Tickets' }], title: 'Tickets' };
}

export default function AppHeader({ onMenuClick }) {
  const { crumbs, title } = useBreadcrumb();
  const { meta } = usePageMeta();
  const displayTitle = meta.title || title;
  const onCreatePage = Boolean(useMatch('/tickets/new'));
  const ticketDetailMatch = useMatch('/tickets/:ticketId');

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button type="button" className="btn-icon mobile-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <IconMenu />
        </button>
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => (
              <span key={crumb.label} className="breadcrumb-item">
                {i > 0 && <span className="breadcrumb-sep" aria-hidden="true">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="topbar-title">{displayTitle}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        {ticketDetailMatch && (
          <Link className="btn btn-secondary btn-sm" to="/">
            Back to list
          </Link>
        )}
        {!onCreatePage && (
          <Link className="btn btn-primary btn-create" to="/tickets/new">
            Create ticket
          </Link>
        )}
      </div>
    </header>
  );
}
