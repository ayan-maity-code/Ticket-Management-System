import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/ticketApi';
import { ApiError } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import TicketForm from '../components/TicketForm';
import Reveal from '../components/ui/Reveal';
import { usePageMeta } from '../context/PageMetaContext';
import { useToast } from '../context/ToastContext';
import { mapFieldErrors } from '../utils/mapFieldErrors';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { setMeta } = usePageMeta();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setMeta({ title: 'Create ticket' });
    return () => setMeta({});
  }, [setMeta]);

  async function handleSubmit(payload) {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const created = await createTicket(payload);
      push('Ticket created successfully.', 'success');
      navigate(`/tickets/${created.id}`, { replace: true });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Failed to create ticket');
      setError(apiErr);
      push(apiErr.message, 'error');
      if (err instanceof ApiError) setFieldErrors(mapFieldErrors(err.details));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-form">
      <Reveal delay={0}>
        <p className="page-subtitle">Describe the issue and set priority for your support queue.</p>
      </Reveal>
      <Reveal delay={60}>
        <ErrorAlert error={error} onDismiss={() => setError(null)} shake={Boolean(error)} />
      </Reveal>
      <Reveal delay={100}>
        <div className="panel panel-form">
          <TicketForm
            submitLabel="Create ticket"
            loading={loading}
            onSubmit={handleSubmit}
            serverFieldErrors={fieldErrors}
          />
        </div>
      </Reveal>
    </div>
  );
}
