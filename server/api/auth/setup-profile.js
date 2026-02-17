import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../_shared/auth-middleware.js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';
import { logSecurityEvent } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!url || !serviceRoleKey) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }

  // Rate limiting - 5 requests per 15 minutes per IP for profile setup
  const ip = getClientIp(req);
  const ipLimit = await checkRateLimitGlobal({
    key: `setup-profile:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
    return json(res, 429, { 
      error: 'Too many profile setup attempts', 
      retry_after_seconds: ipLimit.retryAfterSeconds 
    });
  }

  const { user, error: authError } = await requireAuth(req, res);
  if (authError || !user) return; // requireAuth already sent response

  const adminClient = createClient(url, serviceRoleKey);
  const payload = {
    id: user.id,
    email: user.email ?? '',
    plan: 'free',
    ai_credits_used: 0,
    ai_credits_limit: 5,
    skills: [],
  };

  const { error: upsertError } = await adminClient
    .from('users')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    logSecurityEvent({
      type: 'PROFILE_SETUP_ERROR',
      userId: user.id,
      error: upsertError.message,
    });
    return json(res, 500, { error: upsertError.message });
  }

  logSecurityEvent({
    type: 'PROFILE_SETUP_SUCCESS',
    userId: user.id,
  });

  return json(res, 200, { success: true, message: 'Profile is ready' });
}
