import { check, sleep } from 'k6';
import { authJsonHeaders, get, getLoadOptions, logFailureOnce, parseJson, requireAuthToken } from './common.js';

export const options = getLoadOptions();

requireAuthToken();

export function setup() {
  const probe = get('/api/time-entries?limit=1&offset=0', {
    headers: authJsonHeaders(),
    tags: { endpoint: 'time_entries_list_setup' },
  });
  const probeBody = parseJson(probe);
  if (probe.status !== 200) {
    throw new Error(`time-entries setup failed: status=${probe.status} body=${JSON.stringify(probeBody || probe.body || '')}`);
  }
}

export default function () {
  const limit = Math.max(1, Number(__ENV.TIME_LIMIT || 50));
  const response = get(`/api/time-entries?limit=${limit}&offset=0`, {
    headers: authJsonHeaders(),
    tags: { endpoint: 'time_entries_list' },
  });

  const body = parseJson(response);
  if (response.status !== 200) {
    logFailureOnce('time_entries_list', response, body);
  }
  check(response, {
    'time: status is 200': (r) => r.status === 200,
    'time: entries array': () => Array.isArray(body?.entries),
    'time: total is number': () => typeof body?.total === 'number',
  });

  sleep(Math.random() * 0.8 + 0.2);
}
