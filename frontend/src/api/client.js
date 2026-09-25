const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, path, details = [], raw } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.path = path;
    this.details = details;
    this.raw = raw;
  }
}

function buildUrl(path, query) {
  const base = API_BASE || '';
  const url = new URL(`${base}${path}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function parseErrorResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (body && typeof body.message === 'string') {
    return new ApiError(body.message, {
      status: body.status ?? response.status,
      code: body.code,
      path: body.path,
      details: Array.isArray(body.details) ? body.details : [],
      raw: body,
    });
  }

  const fallback =
    response.status === 404
      ? 'Resource not found'
      : response.status >= 500
        ? 'Server error. Please try again later.'
        : 'Request failed';

  return new ApiError(fallback, {
    status: response.status,
    details: [],
    raw: body,
  });
}

export async function apiRequest(path, { method = 'GET', body, query } = {}) {
  const url = buildUrl(path, query);
  const headers = { Accept: 'application/json' };
  const options = { method, headers };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError('Unable to reach the API. Check that the backend is running.', {
      status: 0,
      code: 'NETWORK_ERROR',
      details: [],
    });
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
