import { createClient } from '@supabase/supabase-js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const parseBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return {};
};

const ALLOWED_EVENTS = new Set(['page_view', 'session_start', 'link_click', 'signup']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Server not configured' });

  const body = parseBody(req);
  const slug = String(body.slug || '').trim().toLowerCase();
  const eventType = String(body.event_type || '').trim().toLowerCase();
  if (!slug) return json(res, 400, { error: 'slug is required' });
  if (!ALLOWED_EVENTS.has(eventType)) return json(res, 400, { error: 'invalid event_type' });

  // Public analytics ingest guard:
  // - per-ip limit to block bursts
  // - per-session/anon limit to reduce spam events
  const ip = getClientIp(req);
  const sessionId = body.session_id ? String(body.session_id).slice(0, 120) : '';
  const anonId = body.anon_id ? String(body.anon_id).slice(0, 120) : '';
  const actor = sessionId || anonId || ip || 'unknown';

  const ipLimit = await checkRateLimitGlobal({
    key: `site-event:ip:${slug}:${ip}`,
    limit: 180,
    windowMs: 60 * 1000,
  });
  res.setHeader('X-RateLimit-Store', ipLimit.store || 'memory');
  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
    return json(res, 429, { error: 'Too many events', retry_after_seconds: ipLimit.retryAfterSeconds });
  }

  const actorLimit = await checkRateLimitGlobal({
    key: `site-event:actor:${slug}:${actor}:${eventType}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!actorLimit.allowed) {
    res.setHeader('Retry-After', String(actorLimit.retryAfterSeconds));
    return json(res, 429, { error: 'Too many events', retry_after_seconds: actorLimit.retryAfterSeconds });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: site, error: siteError } = await admin
    .from('marketing_sites')
    .select('id,user_id,published_at')
    .eq('slug', slug)
    .maybeSingle();

  if (siteError) return json(res, 500, { error: siteError.message });
  if (!site || !site.published_at) return json(res, 404, { error: 'Site not found' });

  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
  let cleanMetadata = {};
  try {
    cleanMetadata = JSON.parse(JSON.stringify(metadata));
  } catch {
    cleanMetadata = {};
  }
  const ipCountry =
    req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || req.headers['x-country-code'] || null;

  const { error: insertError } = await admin.from('marketing_site_events').insert({
    user_id: site.user_id,
    site_id: site.id,
    event_type: eventType,
    session_id: sessionId || null,
    anon_id: anonId || null,
    metadata: {
      ...cleanMetadata,
      country: cleanMetadata.country || (ipCountry ? String(ipCountry).slice(0, 8) : null),
    },
  });

  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 200, { ok: true });
}
