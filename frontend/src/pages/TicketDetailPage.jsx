import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconClose } from '../components/icons/NavIcons';
import {
  addComment,
  getTicket,
  updateTicket,
  updateTicketStatus,
} from '../api/ticketApi';
import { ApiError } from '../api/client';
import CommentForm from '../components/CommentForm';
import ErrorAlert from '../components/ErrorAlert';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import StatusSelector from '../components/StatusSelector';
import TicketForm from '../components/TicketForm';
import EmptyState from '../components/ui/EmptyState';
import Reveal from '../components/ui/Reveal';
import { TicketDetailSkeleton } from '../components/ui/Skeleton';
import { usePageMeta } from '../context/PageMetaContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/formatDate';
import { mapFieldErrors } from '../utils/mapFieldErrors';

export default function TicketDetailPage({ embedded = false }) {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { setMeta } = usePageMeta();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [commentError, setCommentError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusJustChanged, setStatusJustChanged] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicket(ticketId);
      setTicket(data);
      setMeta({ title: data.title });
    } catch (err) {
      setTicket(null);
      setMeta({});
      if (err instanceof ApiError && err.status === 404) {
        setError(new ApiError('Ticket not found', { status: 404, code: 'TICKET_NOT_FOUND' }));
      } else {
        setError(err instanceof ApiError ? err : new ApiError('Failed to load ticket'));
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId, setMeta]);

  useEffect(() => {
    load();
    return () => setMeta({});
  }, [load, setMeta]);

  useEffect(() => {
    if (!statusJustChanged) return undefined;
    const timer = window.setTimeout(() => setStatusJustChanged(false), 320);
    return () => window.clearTimeout(timer);
  }, [statusJustChanged, ticket?.status]);

  async function handleUpdate(payload) {
    setUpdateLoading(true);
    setUpdateError(null);
    setFieldErrors({});
    try {
      const updated = await updateTicket(ticketId, payload);
      setTicket((prev) => ({ ...prev, ...updated, comments: prev?.comments ?? [] }));
      setMeta({ title: updated.title });
      push('Ticket updated successfully.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        setUpdateError(err);
        setFieldErrors(mapFieldErrors(err.details));
        push(err.message, 'error');
      } else {
        setUpdateError(new ApiError('Update failed'));
        push('Update failed', 'error');
      }
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    setStatusLoading(true);
    setStatusError(null);
    setStatusJustChanged(false);
    try {
      const updated = await updateTicketStatus(ticketId, nextStatus);
      setTicket((prev) => ({ ...prev, ...updated, comments: prev?.comments ?? [] }));
      setStatusJustChanged(true);
      push(`Status changed to ${nextStatus.replace(/_/g, ' ')}.`, 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        setStatusError(err);
        const msg = err.code === 'ILLEGAL_STATUS_TRANSITION'
          ? 'That status change is not allowed.'
          : err.message;
        push(msg, 'error');
      } else {
        setStatusError(new ApiError('Status change failed'));
        push('Status change failed', 'error');
      }
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleComment(text) {
    setCommentLoading(true);
    setCommentError(null);
    try {
      await addComment(ticketId, text);
      await load();
      push('Comment added.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        const textErr = err.details?.find((d) => d.field === 'text');
        const message = textErr?.message || err.message;
        setCommentError(message);
        push(message, 'error');
      } else {
        setCommentError('Failed to add comment');
        push('Failed to add comment', 'error');
      }
      throw err;
    } finally {
      setCommentLoading(false);
    }
  }

  const toolbar = (
    <div className="detail-pane-toolbar">
      <Link to="/" className="btn btn-secondary btn-sm detail-back">
        ← Back to list
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className={`page page-detail${embedded ? ' page-detail-embedded' : ''}`}>
        {toolbar}
        <TicketDetailSkeleton embedded={embedded} />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div className={`page page-detail${embedded ? ' page-detail-embedded' : ''}`}>
        {toolbar}
        <EmptyState
          icon="!"
          title="Ticket not found"
          description="This ticket may have been removed or the link is incorrect."
          action={<Link className="btn btn-primary" to="/">Back to tickets</Link>}
        />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`page page-detail${embedded ? ' page-detail-embedded' : ''}`}>
        {toolbar}
        <ErrorAlert error={error} onDismiss={() => navigate('/')} shake />
      </div>
    );
  }

  const comments = ticket.comments ?? [];

  return (
    <div className={`page page-detail${embedded ? ' page-detail-embedded' : ''}`}>
      <div className="detail-pane-toolbar">
        <Link to="/" className="btn btn-secondary btn-sm detail-back">
          ← Back to list
        </Link>
        <div className="detail-pane-toolbar-right">
          <span className="detail-pane-id">#{ticket.id}</span>
          <Link to="/" className="btn-icon detail-close" aria-label="Close ticket panel" title="Close panel">
            <IconClose />
          </Link>
        </div>
      </div>
      <div className={`detail-layout${embedded ? ' detail-layout-embedded' : ''}`}>
        <div className="detail-main">
          <Reveal delay={0}>
            <div className="panel detail-header-panel">
              <div className="detail-header-top">
                <span className="detail-id">#{ticket.id}</span>
                <div className="detail-badges">
                  <StatusBadge status={ticket.status} animate={statusJustChanged} />
                  <PriorityBadge priority={ticket.priority} compact />
                </div>
              </div>
              <h2 className="detail-title">{ticket.title}</h2>
              <dl className="detail-meta-inline">
                <div>
                  <dt>Assignee</dt>
                  <dd>{ticket.assignee || 'Unassigned'}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatDateTime(ticket.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <section className="panel">
              <h3 className="panel-heading">Description</h3>
              <p className="detail-description">{ticket.description}</p>
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section className="panel">
              <h3 className="panel-heading">Comments ({comments.length})</h3>
              {comments.length === 0 ? (
                <EmptyState
                  compact
                  icon="…"
                  title="No comments yet"
                  description="Add an update for this ticket."
                />
              ) : (
                <ul className="comment-thread">
                  {comments.map((c, index) => (
                    <li
                      key={c.id}
                      className="comment-bubble"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <p>{c.text}</p>
                      <time className="comment-time">{formatDateTime(c.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
              <CommentForm
                onSubmit={handleComment}
                loading={commentLoading}
                fieldError={commentError}
              />
            </section>
          </Reveal>
        </div>

        <aside className="detail-aside">
          <Reveal delay={80}>
            <section className={`panel${statusError ? ' panel-shake' : ''}`}>
              <h3 className="panel-heading">Status</h3>
              <ErrorAlert error={statusError} onDismiss={() => setStatusError(null)} />
              <StatusSelector
                currentStatus={ticket.status}
                onChange={handleStatusChange}
                disabled={statusLoading}
                loading={statusLoading}
              />
            </section>
          </Reveal>

          <Reveal delay={140}>
            <section className="panel">
              <h3 className="panel-heading">Actions</h3>
              <ErrorAlert error={updateError} onDismiss={() => setUpdateError(null)} />
              <TicketForm
                initialValues={ticket}
                submitLabel="Update ticket"
                loading={updateLoading}
                onSubmit={handleUpdate}
                serverFieldErrors={fieldErrors}
                compact
              />
            </section>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
