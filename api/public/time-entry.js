import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
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

const summarizeOne = (entry) => {
  const trackedSeconds = Number(entry?.duration_seconds || 0);
  const totalEarnings = Number(entry?.earnings || 0);
  const avgRate = trackedSeconds > 0 ? totalEarnings / (trackedSeconds / 3600) : 0;
  const currency = String(entry?.currency || 'USD');
  return {
    tracked_seconds: trackedSeconds,
    total_earnings: Math.round(totalEarnings * 100) / 100,
    effective_hourly_rate: Math.round(avgRate * 100) / 100,
    currency,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Server not configured' });

  const params = getQueryParams(req);
  const token = String(params.token || '').trim();
  if (!token) return json(res, 400, { error: 'token is required' });

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: link, error: linkError } = await admin
    .from('time_entry_share_links')
    .select('*')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle();

  if (linkError) return json(res, 500, { error: linkError.message });
  if (!link) return json(res, 404, { error: 'Share link not found or revoked' });

  if (link.expires_at) {
    const exp = new Date(link.expires_at).getTime();
    if (!Number.isNaN(exp) && Date.now() > exp) return json(res, 410, { error: 'Share link expired' });
  }

  const { data: entry, error: entryError } = await admin
    .from('time_entries')
    .select('*')
    .eq('id', link.time_entry_id)
    .eq('user_id', link.user_id)
    .maybeSingle();

  if (entryError) return json(res, 500, { error: entryError.message });
  if (!entry) return json(res, 404, { error: 'Time entry not found' });

  return json(res, 200, {
    link: {
      include_details: Boolean(link.include_details),
      created_at: link.created_at,
    },
    summary: summarizeOne(entry),
    entry,
  });
}

