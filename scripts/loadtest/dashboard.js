import { check, sleep } from 'k6';
import { authJsonHeaders, get, getLoadOptions, logFailureOnce, parseJson, requireAuthToken } from './common.js';

export const options = getLoadOptions();

requireAuthToken();

export function setup() {
  const probe = get('/api/dashboard/stats?range=7d', {
    headers: authJsonHeaders(),
    tags: { endpoint: 'dashboard_stats_setup' },
  });
  const probeBody = parseJson(probe);
  if (probe.status !== 200) {
    throw new Error(`dashboard setup failed: status=${probe.status} body=${JSON.stringify(probeBody || probe.body || '')}`);
  }
}

const RANGES = ['7d', '30d', '90d'];

export default function () {
  const range = __ENV.DASHBOARD_RANGE || RANGES[Math.floor(Math.random() * RANGES.length)];
  const response = get(`/api/dashboard/stats?range=${encodeURIComponent(range)}`, {
    headers: authJsonHeaders(),
    tags: { endpoint: 'dashboard_stats' },
  });

  const body = parseJson(response);
  if (response.status !== 200) {
    logFailureOnce('dashboard_stats', response, body);
  }
  check(response, {
    'dashboard: status is 200': (r) => r.status === 200,
    'dashboard: has applications_this_week': () => typeof body?.applications_this_week === 'number',
    'dashboard: has awaiting_reply': () => typeof body?.awaiting_reply === 'number',
    'dashboard: has active_conversations': () => typeof body?.active_conversations === 'number',
    'dashboard: followups_due array': () => Array.isArray(body?.followups_due),
  });

  sleep(Math.random() * 0.8 + 0.2);
}
