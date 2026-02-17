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

const toIsoOrNull = (value) => {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const summarize = (entries) => {
  const trackedSeconds = entries.reduce((sum, e) => sum + Number(e.duration_seconds || 0), 0);
  const totalEarnings = entries.reduce((sum, e) => sum + Number(e.earnings || 0), 0);
  const avgRate = trackedSeconds > 0 ? totalEarnings / (trackedSeconds / 3600) : 0;
  const currency = String(entries[0]?.currency || 'USD');
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
    .from('time_share_links')
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

  const fallbackFrom = new Date(Date.now() - 30 * 86400000).toISOString();
  const fromTime = toIsoOrNull(link.from_time) || fallbackFrom;
  const toTime = toIsoOrNull(link.to_time) || new Date().toISOString();

  const { data: entries, error: entriesError } = await admin
    .from('time_entries')
    .select('*')
    .eq('user_id', link.user_id)
    .gte('start_time', fromTime)
    .lte('start_time', toTime)
    .order('start_time', { ascending: false })
    .limit(2000);

  if (entriesError) return json(res, 500, { error: entriesError.message });

  return json(res, 200, {
    link: {
      label: link.label || 'Time Report',
      from_time: fromTime,
      to_time: toTime,
      include_details: Boolean(link.include_details),
      created_at: link.created_at,
    },
    summary: summarize(entries || []),
    entries: entries || [],
  });
}

