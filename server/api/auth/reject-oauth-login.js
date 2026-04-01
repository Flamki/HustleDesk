import { createClient } from '@supabase/supabase-js';
import { secureJson } from '../_shared/security.js';
import { extractBearerToken } from '../_shared/auth.js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

const json = secureJson;
const MAX_ACCOUNT_AGE_MS = 5 * 60 * 1000;

const getUserCreatedAt = (user) => {
  const ts = new Date(String(user?.created_at || '')).getTime();
  return Number.isFinite(ts) ? ts : 0;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }

  const token = extractBearerToken(req);
  if (!token) return json(res, 401, { error: 'Unauthorized' });

  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimitGlobal({
    key: `reject-oauth-login:${clientIp}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return json(res, 429, {
      error: 'Too many requests',
      retry_after_seconds: rateLimit.retryAfterSeconds,
    });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();
  if (userError || !user) return json(res, 401, { error: 'Unauthorized' });

  const createdAt = getUserCreatedAt(user);
  if (!createdAt) return json(res, 400, { error: 'Unable to verify account age' });
  if (Date.now() - createdAt > MAX_ACCOUNT_AGE_MS) {
    return json(res, 409, { error: 'Account is not eligible for login rejection cleanup' });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Guardrail: don't delete accounts that already have activity.
  try {
    const { count, error: jobsError } = await adminClient
      .from('jobs')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', user.id)
      .limit(1);
    if (!jobsError && Number(count || 0) > 0) {
      return json(res, 409, { error: 'Account has activity and cannot be auto-removed' });
    }
  } catch {
    // Ignore jobs table drift and continue with deletion attempt.
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return json(res, 500, { error: deleteError.message || 'Failed to delete OAuth login account' });
  }

  return json(res, 200, {
    success: true,
    deleted_user_id: user.id,
    message: 'OAuth login-only account was rejected and removed',
  });
}
