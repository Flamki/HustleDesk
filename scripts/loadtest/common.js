import http from 'k6/http';

export const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');

const hasAuthToken = () => Boolean(__ENV.AUTH_BEARER && String(__ENV.AUTH_BEARER).trim());

export const requireAuthToken = () => {
  if (!hasAuthToken()) {
    throw new Error('Missing AUTH_BEARER. Set AUTH_BEARER to a valid Supabase access token.');
  }
};

export const authJsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${String(__ENV.AUTH_BEARER).trim()}`,
});

export const jsonHeaders = () => ({
  'Content-Type': 'application/json',
});

export const parseJson = (response) => {
  try {
    return response.json();
  } catch {
    return null;
  }
};

const endpointFailureCounts = {};
export const logFailureOnce = (endpoint, response, body) => {
  const key = String(endpoint || 'unknown');
  endpointFailureCounts[key] = (endpointFailureCounts[key] || 0) + 1;
  if (endpointFailureCounts[key] > 3) return;

  const bodyText =
    body != null
      ? JSON.stringify(body)
      : String(response?.body || '').slice(0, 500);

  // Keep noisy logs bounded while still surfacing root cause quickly.
  // eslint-disable-next-line no-console
  console.error(`[${key}] unexpected status=${response?.status} body=${bodyText}`);
};

export const buildTrendThresholds = () => ({
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(90)<1200', 'p(95)<2000', 'max<5000'],
});

export const getLoadOptions = () => {
  const vus = Number(__ENV.VUS || 10);
  const duration = __ENV.DURATION || '45s';
  return {
    vus,
    duration,
    thresholds: buildTrendThresholds(),
  };
};

export const get = (path, params = {}) => http.get(`${BASE_URL}${path}`, params);
export const post = (path, body, params = {}) => http.post(`${BASE_URL}${path}`, body, params);

export const buildQueryString = (params = {}) => {
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.join('&');
};
