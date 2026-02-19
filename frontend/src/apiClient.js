const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

function normalizePath(path) {
  if (!path.startsWith('/')) return `/${path}`;
  return path;
}

function buildUrl(path, query) {
  const normalizedPath = normalizePath(path);
  const normalizedPrefix = normalizePath(API_PREFIX || '');
  const shouldPrefix =
    normalizedPrefix &&
    normalizedPrefix !== '/' &&
    normalizedPath !== normalizedPrefix &&
    !normalizedPath.startsWith(`${normalizedPrefix}/`);

  const prefixedPath = shouldPrefix
    ? `${normalizedPrefix}${normalizedPath}`.replace(/\/\/+/, '/')
    : normalizedPath;
  const url = new URL(`${API_BASE_URL}${prefixedPath}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', token, body, query, rawBody = false } = options;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let requestBody;
  if (body !== undefined) {
    if (rawBody) {
      requestBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: requestBody
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}
