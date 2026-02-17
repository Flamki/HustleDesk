import { check, sleep } from 'k6';
import {
  authJsonHeaders,
  buildQueryString,
  get,
  getLoadOptions,
  logFailureOnce,
  parseJson,
  requireAuthToken,
} from './common.js';

export const options = getLoadOptions();

requireAuthToken();

export function setup() {
  const probe = get('/api/jobs?limit=1&offset=0', {
    headers: authJsonHeaders(),
    tags: { endpoint: 'jobs_list_setup' },
  });
  const probeBody = parseJson(probe);
  if (probe.status !== 200) {
    throw new Error(`jobs setup failed: status=${probe.status} body=${JSON.stringify(probeBody || probe.body || '')}`);
  }
}

const STATUSES = ['', 'saved', 'applied', 'replied', 'won', 'lost'];
const PLATFORMS = ['', 'upwork', 'fiverr', 'linkedin', 'other'];

export default function () {
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];

  const query = buildQueryString({
    limit: String(Number(__ENV.JOBS_LIMIT || 20)),
    offset: '0',
    status,
    platform,
  });

  const response = get(`/api/jobs?${query}`, {
    headers: authJsonHeaders(),
    tags: { endpoint: 'jobs_list' },
  });

  const body = parseJson(response);
  if (response.status !== 200) {
    logFailureOnce('jobs_list', response, body);
  }

  check(response, {
    'jobs: status is 200': (r) => r.status === 200,
    'jobs: response is json array': () => Array.isArray(body?.jobs),
    'jobs: total is a number': () => typeof body?.total === 'number',
  });

  sleep(Math.random() * 0.8 + 0.2);
}
