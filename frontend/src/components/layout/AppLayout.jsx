import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PageMetaProvider } from '../../context/PageMetaContext';
import { TicketCountProvider } from '../../context/TicketCountContext';
import AppHeader from './AppHeader';
import PageTransition from './PageTransition';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      {mobileNav && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="workspace">
        <TicketCountProvider>
          <PageMetaProvider>
            <AppHeader onMenuClick={() => setMobileNav(true)} />
            <div className="workspace-body workspace-body-flush">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </PageMetaProvider>
        </TicketCountProvider>
      </div>
    </div>
  );
}
