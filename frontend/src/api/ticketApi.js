import { apiRequest } from './client';

const TICKETS = '/api/tickets';

export function listTickets({ q, status } = {}) {
  const query = {};
  if (q) query.q = q;
  if (status) query.status = status;
  return apiRequest(TICKETS, { query });
}

export function getTicket(ticketId) {
  return apiRequest(`${TICKETS}/${ticketId}`);
}

export function createTicket(payload) {
  return apiRequest(TICKETS, { method: 'POST', body: payload });
}

export function updateTicket(ticketId, payload) {
  return apiRequest(`${TICKETS}/${ticketId}`, { method: 'PATCH', body: payload });
}

export function updateTicketStatus(ticketId, status) {
  return apiRequest(`${TICKETS}/${ticketId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function addComment(ticketId, text) {
  return apiRequest(`${TICKETS}/${ticketId}/comments`, {
    method: 'POST',
    body: { text },
  });
}
