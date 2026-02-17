import { createClient } from '@supabase/supabase-js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';
import { sanitizeString, logSecurityEvent } from '../_shared/security.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

const getQueryParams = (req) => {
  if (req.query) return req.query;
  try {
    const u = new URL(req.url, 'http://localhost');
    return Object.fromEntries(u.searchParams.entries());
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  // Rate limiting - 10 unsubscribe attempts per minute per IP
  const ip = getClientIp(req);
  const ipLimit = await checkRateLimitGlobal({
    key: `unsubscribe:${ip}`,
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
    return json(res, 429, { error: 'Too many requests' });
  }

  const params = getQueryParams(req);
  const body = parseBody(req);
  const token = sanitizeString(body.token || params.token || '', 200);
  
  if (!token || token.length < 10) {
    logSecurityEvent({
      type: 'INVALID_UNSUBSCRIBE_TOKEN',
      ip,
      tokenLength: token.length,
    });
    return json(res, 400, { error: 'Valid token is required' });
  }
  
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Server not configured' });

  // Public endpoint: uses service role to update unsubscribe state.
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: contact, error: contactErr } = await supabase
    .from('marketing_contacts')
    .select('id,status,unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (contactErr) return json(res, 500, { error: contactErr.message });
  if (!contact) {
    logSecurityEvent({
      type: 'UNSUBSCRIBE_TOKEN_NOT_FOUND',
      ip,
      token: token.slice(0, 10) + '...',
    });
    return json(res, 404, { error: 'Not found' });
  }

  // Already unsubscribed, return success (idempotent)
  if (contact.status === 'unsubscribed') {
    return json(res, 200, { success: true, message: 'Already unsubscribed' });
  }

  const { data, error } = await supabase
    .from('marketing_contacts')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', contact.id)
    .select('id,status,unsubscribed_at')
    .single();

  if (error) return json(res, 500, { error: error.message });
  
  logSecurityEvent({
    type: 'UNSUBSCRIBE_SUCCESS',
    contactId: contact.id,
    ip,
  });
  
  return json(res, 200, { success: true, contact: data });
}
