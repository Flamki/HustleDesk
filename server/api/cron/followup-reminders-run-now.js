import { createClient } from '@supabase/supabase-js';
import { extractBearerToken } from '../_shared/auth.js';
import {
  createFollowupReminderServiceClient,
  runFollowupReminderSweep,
  validateFollowupReminderConfig,
} from './followup-reminders.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const csvSet = (...values) => {
  const out = new Set();
  values.forEach((value) => {
    String(value || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
      .forEach((entry) => out.add(entry));
  });
  return out;
};

const getAdminAllowlist = () => ({
  emails: csvSet(process.env.FOLLOWUP_REMINDER_TRIGGER_ADMIN_EMAILS, process.env.ADMIN_EMAILS),
  userIds: csvSet(process.env.FOLLOWUP_REMINDER_TRIGGER_ADMIN_IDS, process.env.ADMIN_USER_IDS),
});

const getHeader = (req, name) => {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

const hasSecretOverride = (req) => {
  const expected = process.env.CRON_SECRET || process.env.HEALTHCHECK_TOKEN || '';
  if (!expected) return false;
  const authHeader = getHeader(req, 'authorization');
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === expected;
};

const authorizeAdminUser = async (req) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, status: 500, error: 'Supabase environment not configured' };
  }

  const token = extractBearerToken(req);
  if (!token) return { ok: false, status: 401, error: 'Unauthorized' };

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();
  if (userError || !user) return { ok: false, status: 401, error: 'Unauthorized' };

  const allowlist = getAdminAllowlist();
  if (allowlist.emails.size === 0 && allowlist.userIds.size === 0) {
    return {
      ok: false,
      status: 403,
      error: 'Manual reminder trigger is not configured. Set FOLLOWUP_REMINDER_TRIGGER_ADMIN_EMAILS or _ADMIN_IDS.',
    };
  }

  const email = String(user.email || '').trim().toLowerCase();
  const userId = String(user.id || '').trim().toLowerCase();
  if (allowlist.emails.has(email) || allowlist.userIds.has(userId)) {
    return { ok: true, mode: 'admin_user', user_id: user.id, email: user.email || '' };
  }

  return { ok: false, status: 403, error: 'Forbidden' };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  let auth = null;
  if (hasSecretOverride(req)) {
    auth = { ok: true, mode: 'secret' };
  } else {
    auth = await authorizeAdminUser(req);
  }

  if (!auth?.ok) {
    return json(res, auth?.status || 401, { error: auth?.error || 'Unauthorized' });
  }

  const configError = validateFollowupReminderConfig();
  if (configError) return json(res, 500, { error: configError });

  const supabase = createFollowupReminderServiceClient();
  const nowIso = new Date().toISOString();

  try {
    const result = await runFollowupReminderSweep({ supabase, nowIso });
    return json(res, 200, {
      success: true,
      triggered_by: auth.mode,
      ...result,
      timestamp: nowIso,
    });
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : 'Failed to run reminder sweep' });
  }
}
