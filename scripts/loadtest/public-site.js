import { check, sleep } from 'k6';
import { get, getLoadOptions, jsonHeaders, logFailureOnce, parseJson, post } from './common.js';

export const options = getLoadOptions();

const slug = String(__ENV.SITE_SLUG || '').trim().toLowerCase();
if (!slug) {
  throw new Error('Missing SITE_SLUG. Set SITE_SLUG to a published marketing site slug.');
}

const shouldTestSignup = String(__ENV.LOADTEST_SIGNUP || '0') === '1';

const makeEmail = () => {
  const prefix = String(__ENV.LOADTEST_SIGNUP_EMAIL_PREFIX || 'loadtest').replace(/[^a-zA-Z0-9._-]/g, '');
  const domain = String(__ENV.LOADTEST_SIGNUP_EMAIL_DOMAIN || 'example.com').replace(/[^a-zA-Z0-9.-]/g, '');
  return `${prefix}+vu${__VU}it${__ITER}@${domain}`;
};

export function setup() {
  const probe = get(`/api/public/site?slug=${encodeURIComponent(slug)}`, {
    headers: jsonHeaders(),
    tags: { endpoint: 'public_site_setup' },
  });
  const probeBody = parseJson(probe);
  if (probe.status !== 200) {
    throw new Error(`public-site setup failed: status=${probe.status} body=${JSON.stringify(probeBody || probe.body || '')}`);
  }
}

export default function () {
  const siteResponse = get(`/api/public/site?slug=${encodeURIComponent(slug)}`, {
    headers: jsonHeaders(),
    tags: { endpoint: 'public_site' },
  });
  const siteBody = parseJson(siteResponse);
  if (siteResponse.status !== 200) {
    logFailureOnce('public_site', siteResponse, siteBody);
  }

  check(siteResponse, {
    'public site: status is 200': (r) => r.status === 200,
    'public site: has site object': () => Boolean(siteBody?.site),
    'public site: matching slug': () => String(siteBody?.site?.slug || '') === slug,
  });

  if (shouldTestSignup) {
    const signupResponse = post(
      '/api/public/site-signup',
      JSON.stringify({
        slug,
        email: makeEmail(),
        name: `Load Test ${__VU}-${__ITER}`,
        consent: true,
        website: '',
      }),
      {
        headers: jsonHeaders(),
        tags: { endpoint: 'public_site_signup' },
      }
    );

    const signupBody = parseJson(signupResponse);
    if (signupResponse.status !== 200) {
      logFailureOnce('public_site_signup', signupResponse, signupBody);
    }
    check(signupResponse, {
      'signup: status is 200': (r) => r.status === 200,
      'signup: ok true': () => signupBody?.ok === true,
    });
  }

  sleep(Math.random() * 0.8 + 0.2);
}
