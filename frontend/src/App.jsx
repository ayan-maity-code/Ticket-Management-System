import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import TicketsWorkspace from './components/layout/TicketsWorkspace';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TicketsWorkspace />}>
          <Route index />
          <Route path="tickets/:ticketId" element={<TicketDetailPage embedded />} />
        </Route>
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
