import { createClient } from '@supabase/supabase-js';
import { secureJson } from '../_shared/security.js';
import { extractBearerToken } from '../_shared/auth.js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const json = secureJson;
const isSchemaCompatibilityError = (message = '') =>
  /relation .* does not exist|column .* does not exist|Could not find .* in the schema cache/i.test(message);

const parseBodyJson = (req) => {
  try {
    if (!req || req.body == null) return null;
    if (typeof req.body === 'object') return req.body;
    if (Buffer.isBuffer(req.body)) {
      const raw = req.body.toString('utf8');
      return raw ? JSON.parse(raw) : null;
    }
    if (typeof req.body === 'string') {
      return req.body.trim() ? JSON.parse(req.body) : null;
    }
    return null;
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!url || !anonKey || !serviceRoleKey) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }

  const token = extractBearerToken(req);
  if (!token) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const clientIp = getClientIp(req);
  const limit = await checkRateLimitGlobal({
    key: `setup-profile:${clientIp}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!limit.allowed) {
    return json(res, 429, {
      error: 'Too many requests',
      retry_after_seconds: limit.retryAfterSeconds,
    });
  }

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();
  if (userError || !user) return json(res, 401, { error: 'Unauthorized' });

  const adminClient = createClient(url, serviceRoleKey);
  const body = parseBodyJson(req);
  const mode = String(body?.mode || 'ensure').toLowerCase() === 'check' ? 'check' : 'ensure';

  let usersRowReady = false;

  if (mode === 'check') {
    const { data: userRow, error: usersReadError } = await adminClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (usersReadError) {
      if (!isSchemaCompatibilityError(usersReadError.message || '')) {
        return json(res, 500, { error: usersReadError.message });
      }
    } else {
      usersRowReady = Boolean(userRow?.id);
    }
  } else {
    const userPayload = {
      id: user.id,
      email: user.email ?? '',
      plan: 'free',
      ai_credits_used: 0,
      ai_credits_limit: 5,
      skills: [],
    };
    const { error: usersUpsertError } = await adminClient
      .from('users')
      .upsert(userPayload, { onConflict: 'id' });

    if (usersUpsertError) {
      if (isSchemaCompatibilityError(usersUpsertError.message || '')) {
        usersRowReady = false;
      } else {
        return json(res, 500, { error: usersUpsertError.message });
      }
    } else {
      usersRowReady = true;
    }
  }

  // Best-effort upsert for freelancer profile. Keep this non-fatal for older schemas.
  let freelancerProfileReady = false;
  try {
    if (mode === 'check') {
      const firstTry = await adminClient
        .from('freelancer_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .limit(1);
      if (!firstTry.error && Array.isArray(firstTry.data)) {
        freelancerProfileReady = firstTry.data.length > 0;
      } else if (
        firstTry.error &&
        /column .*user_id.* does not exist|Could not find .*user_id.* in the schema cache/i.test(
          firstTry.error.message || ''
        )
      ) {
        const secondTry = await adminClient
          .from('freelancer_profiles')
          .select('id')
          .eq('id', user.id)
          .limit(1);
        if (!secondTry.error && Array.isArray(secondTry.data)) {
          freelancerProfileReady = secondTry.data.length > 0;
        }
      }
    } else {
      const { error: profileUpsertError } = await adminClient
        .from('freelancer_profiles')
        .upsert(
          {
            user_id: user.id,
            skills: [],
            experience_level: 'Entry',
            years_experience: 0,
            bio: '',
            hourly_rate: 0,
            past_projects: [],
            communication_style: 'Professional',
            completed_onboarding: false,
            preferences: {},
            notification_settings: {},
          },
          { onConflict: 'user_id' }
        );
      if (
        !profileUpsertError ||
        /relation .*freelancer_profiles.* does not exist|column .*freelancer_profiles.* does not exist|Could not find .* in the schema cache/i.test(
          profileUpsertError.message || ''
        )
      ) {
        freelancerProfileReady = true;
      }
    }
  } catch {
    // Ignore profile bootstrap exceptions to avoid blocking auth.
  }

  return json(res, 200, {
    success: true,
    account_ready: usersRowReady,
    users_row_ready: usersRowReady,
    freelancer_profile_ready: freelancerProfileReady,
    message: usersRowReady ? 'Account is ready' : 'Account bootstrap partially completed',
  });
}
