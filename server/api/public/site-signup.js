import { createClient } from '@supabase/supabase-js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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

const isValidEmail = (email) => {
  const e = String(email || '').trim().toLowerCase();
  if (!e || e.length > 254) return false;
  if (!e.includes('@')) return false;
  // Basic sanity check (not RFC).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Server not configured' });

  const body = parseBody(req);
  const slug = String(body.slug || '').trim().toLowerCase();
  const email = String(body.email || '').trim().toLowerCase();
  const name = body.name ? String(body.name).trim().slice(0, 120) : null;
  const consent = body.consent !== false;

  // Honeypot for bots (UI should keep this hidden and empty).
  if (String(body.website || '').trim()) return json(res, 200, { ok: true });

  if (!slug) return json(res, 400, { error: 'slug is required' });
  if (!isValidEmail(email)) return json(res, 400, { error: 'Valid email is required' });

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimitGlobal({
    key: `site-signup:ip:${slug}:${ip}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  res.setHeader('X-RateLimit-Store', ipLimit.store || 'memory');
  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
    return json(res, 429, { error: 'Too many signup attempts', retry_after_seconds: ipLimit.retryAfterSeconds });
  }

  const emailLimit = await checkRateLimitGlobal({
    key: `site-signup:email:${slug}:${email}`,
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });
  if (!emailLimit.allowed) {
    res.setHeader('Retry-After', String(emailLimit.retryAfterSeconds));
    return json(res, 429, { error: 'Too many signup attempts', retry_after_seconds: emailLimit.retryAfterSeconds });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: site, error: siteError } = await admin
    .from('marketing_sites')
    .select('id,user_id,slug,cta_text,show_email_signup,published_at')
    .eq('slug', slug)
    .maybeSingle();

  if (siteError) return json(res, 500, { error: siteError.message });
  if (!site || !site.published_at) return json(res, 404, { error: 'Site not found' });
  if (!site.show_email_signup) return json(res, 400, { error: 'Email signup is disabled for this site' });

  const ipHeader = req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : null;
  const ua = req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 300) : null;

  // Upsert contact into marketing_contacts with an auto-tag for this site.
  const siteTag = `site:${slug}`;
  const { data: existingContact } = await admin
    .from('marketing_contacts')
    .select('id,status,tags')
    .eq('user_id', site.user_id)
    .eq('email', email)
    .maybeSingle();

  // Respect unsubscribes: do not resubscribe silently.
  if (existingContact?.status === 'unsubscribed') {
    // Still log the attempt, but do not change subscription state.
    await admin.from('marketing_site_signups').insert({
      user_id: site.user_id,
      site_id: site.id,
      email,
      name,
      consent,
      ip: ipHeader || ip,
      user_agent: ua,
    });
    return json(res, 200, { ok: true });
  }

  const nextTags = Array.isArray(existingContact?.tags) ? existingContact.tags : [];
  const tags = Array.from(new Set([...(nextTags || []), siteTag])).slice(0, 50);

  await admin
    .from('marketing_contacts')
    .upsert(
      {
        user_id: site.user_id,
        email,
        first_name: name ? name.split(' ')[0].slice(0, 100) : null,
        last_name: name ? name.split(' ').slice(1).join(' ').slice(0, 100) : null,
        tags,
        status: consent ? 'subscribed' : 'pending',
        unsubscribed_at: null,
      },
      { onConflict: 'user_id,email' }
    );

  await admin.from('marketing_site_signups').insert({
    user_id: site.user_id,
    site_id: site.id,
    email,
    name,
    consent,
    ip: ipHeader || ip,
    user_agent: ua,
  });

  try {
    await admin.from('marketing_site_events').insert({
      user_id: site.user_id,
      site_id: site.id,
      event_type: 'signup',
      metadata: {
        source: 'public_site_signup',
        slug,
      },
    });
  } catch {
    // Ignore analytics log failures to avoid blocking primary signup flow.
  }

  return json(res, 200, { ok: true });
}

