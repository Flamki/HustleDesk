import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
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

const authedClient = async (req) => {
  if (!url || !anonKey) return { supabase: null, user: null, error: 'Supabase environment not configured' };

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { supabase: null, user: null, error: 'Unauthorized' };

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { supabase: null, user: null, error: 'Unauthorized' };
  return { supabase, user, error: null };
};

const fmtDay = (d) => new Date(d).toISOString().slice(0, 10);

const buildDayBuckets = (days) => {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push(fmtDay(d));
  }
  return out;
};

const safe = (v, fallback = '(unknown)') => {
  const s = String(v || '').trim();
  return s || fallback;
};

const topN = (mapObj, limit = 6) =>
  Object.entries(mapObj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const siteId = String(params.site_id || '').trim();
  const days = Math.max(7, Math.min(90, Number(params.days || 28)));
  if (!siteId) return json(res, 400, { error: 'site_id is required' });

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const { data: site, error: siteError } = await supabase
    .from('marketing_sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (siteError) return json(res, 500, { error: siteError.message });
  if (!site) return json(res, 404, { error: 'Site not found' });

  const [{ data: events, error: eventsError }, { data: signups, error: signupsError }] = await Promise.all([
    supabase
      .from('marketing_site_events')
      .select('event_type,created_at,session_id,anon_id,metadata')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true }),
    supabase
      .from('marketing_site_signups')
      .select('id,created_at')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true }),
  ]);

  if (eventsError) return json(res, 500, { error: eventsError.message });
  if (signupsError) return json(res, 500, { error: signupsError.message });

  const rows = Array.isArray(events) ? events : [];
  const signupRows = Array.isArray(signups) ? signups : [];
  const daysList = buildDayBuckets(days);
  const byDay = new Map(
    daysList.map((d) => [
      d,
      {
        page_views: 0,
        sessions: 0,
        signups: 0,
        unique_visitors_set: new Set(),
        session_duration_total: 0,
        bounce_sessions: 0,
      },
    ])
  );

  const pageCounts = {};
  const referrerCounts = {};
  const sourceCounts = {};
  const mediumCounts = {};
  const campaignCounts = {};
  const countryCounts = {};
  const deviceCounts = {};
  const linkCounts = {};
  const sessions = new Map();
  const uniqueVisitors = new Set();
  let pageViews = 0;

  for (const row of rows) {
    const day = fmtDay(row.created_at);
    if (!byDay.has(day)) continue;
    const bucket = byDay.get(day);
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};

    if (row.event_type === 'page_view') {
      pageViews += 1;
      bucket.page_views += 1;
      if (row.anon_id) {
        uniqueVisitors.add(row.anon_id);
        bucket.unique_visitors_set.add(row.anon_id);
      }
      pageCounts[safe(metadata.path, '/')] = (pageCounts[safe(metadata.path, '/') ] || 0) + 1;
      referrerCounts[safe(metadata.referrer_host, '(direct)')] = (referrerCounts[safe(metadata.referrer_host, '(direct)')] || 0) + 1;
      sourceCounts[safe(metadata.utm_source, safe(metadata.referrer_host, '(direct)'))] =
        (sourceCounts[safe(metadata.utm_source, safe(metadata.referrer_host, '(direct)'))] || 0) + 1;
      mediumCounts[safe(metadata.utm_medium, '(none)')] = (mediumCounts[safe(metadata.utm_medium, '(none)')] || 0) + 1;
      campaignCounts[safe(metadata.utm_campaign, '(none)')] = (campaignCounts[safe(metadata.utm_campaign, '(none)')] || 0) + 1;
      countryCounts[safe(metadata.country, '(unknown)')] = (countryCounts[safe(metadata.country, '(unknown)')] || 0) + 1;
      deviceCounts[safe(metadata.device, '(unknown)')] = (deviceCounts[safe(metadata.device, '(unknown)')] || 0) + 1;
    }

    if (row.event_type === 'link_click') {
      const label = safe(metadata.label, safe(metadata.url, 'Unknown link'));
      linkCounts[label] = (linkCounts[label] || 0) + 1;
    }

    if (row.event_type === 'session_start') {
      bucket.sessions += 1;
      if (row.session_id) {
        sessions.set(row.session_id, {
          start: row.created_at,
          end: row.created_at,
          pageViews: 0,
          day,
        });
      }
    }

    if (row.session_id) {
      const current = sessions.get(row.session_id);
      if (current) {
        if (new Date(row.created_at) > new Date(current.end)) current.end = row.created_at;
        if (row.event_type === 'page_view') current.pageViews += 1;
      } else {
        sessions.set(row.session_id, {
          start: row.created_at,
          end: row.created_at,
          pageViews: row.event_type === 'page_view' ? 1 : 0,
          day,
        });
      }
    }
  }

  for (const s of signupRows) {
    const day = fmtDay(s.created_at);
    const bucket = byDay.get(day);
    if (bucket) bucket.signups += 1;
  }

  let totalDurationSec = 0;
  let bounceSessions = 0;
  for (const sess of sessions.values()) {
    const start = new Date(sess.start).getTime();
    const end = new Date(sess.end).getTime();
    const duration = Math.max(0, Math.min(60 * 60, Math.round((end - start) / 1000)));
    totalDurationSec += duration;
    if (sess.pageViews <= 1) bounceSessions += 1;
    const dayBucket = byDay.get(sess.day);
    if (dayBucket) {
      dayBucket.session_duration_total += duration;
      if (sess.pageViews <= 1) dayBucket.bounce_sessions += 1;
    }
  }

  const totalSessions = sessions.size || rows.filter((r) => r.event_type === 'session_start').length;
  const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
  const avgSessionDurationSec = totalSessions > 0 ? totalDurationSec / totalSessions : 0;
  const conversionRate = uniqueVisitors.size > 0 ? (signupRows.length / uniqueVisitors.size) * 100 : 0;

  const series = daysList.map((day) => {
    const b = byDay.get(day);
    const daySessions = b.sessions || 0;
    const dayBounceRate = daySessions > 0 ? (b.bounce_sessions / daySessions) * 100 : 0;
    const dayAvgDurationSec = daySessions > 0 ? b.session_duration_total / daySessions : 0;
    return {
      day,
      unique_visitors: b.unique_visitors_set.size,
      page_views: b.page_views,
      sessions: daySessions,
      signups: b.signups,
      bounce_rate: Number(dayBounceRate.toFixed(2)),
      session_duration_sec: Math.round(dayAvgDurationSec),
    };
  });

  return json(res, 200, {
    range_days: days,
    metrics: {
      unique_visitors: uniqueVisitors.size,
      page_views: pageViews,
      sessions: totalSessions,
      signups: signupRows.length,
      bounce_rate: Number(bounceRate.toFixed(2)),
      avg_session_duration_sec: Math.round(avgSessionDurationSec),
      conversion_rate: Number(conversionRate.toFixed(2)),
    },
    series,
    breakdowns: {
      pages: topN(pageCounts, 8),
      referrers: topN(referrerCounts, 8),
      sources: topN(sourceCounts, 8),
      mediums: topN(mediumCounts, 8),
      campaigns: topN(campaignCounts, 8),
      countries: topN(countryCounts, 8),
      devices: topN(deviceCounts, 8),
      links: topN(linkCounts, 8),
    },
  });
}


