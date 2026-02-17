import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const getRangeStartIso = (range) => {
  const now = new Date();
  const r = range === '30d' || range === '90d' ? range : '7d';
  if (r === '30d') now.setUTCDate(now.getUTCDate() - 30);
  else if (r === '90d') now.setUTCDate(now.getUTCDate() - 90);
  else now.setUTCDate(now.getUTCDate() - 7);
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
};

const startOfMonthIso = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const buildActivity = (jobs) => {
  const activity = [];
  for (const job of jobs) {
    activity.push({
      type: 'saved',
      title: job.title,
      platform: job.platform,
      timestamp: job.created_at,
      text: `Saved ${job.title}`,
    });
    if (job.applied_at) {
      activity.push({
        type: 'applied',
        title: job.title,
        platform: job.platform,
        timestamp: job.applied_at,
        text: `Applied to ${job.title}`,
      });
    }
    if (job.closed_at && (job.status === 'won' || job.status === 'lost')) {
      activity.push({
        type: job.status,
        title: job.title,
        platform: job.platform,
        timestamp: job.closed_at,
        text: job.status === 'won' ? `Won ${job.title}` : `Closed ${job.title} as lost`,
      });
    }
  }
  return activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!url || !anonKey) return json(res, 500, { error: 'Supabase environment not configured' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return json(res, 401, { error: 'Unauthorized' });

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return json(res, 401, { error: 'Unauthorized' });

  let range = '7d';
  if (req.query?.range) range = String(req.query.range);
  else if (req.url?.includes('?')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      range = parsed.searchParams.get('range') || '7d';
    } catch {
      range = '7d';
    }
  }

  const weekStart = getRangeStartIso(range);
  const monthStart = startOfMonthIso();
  const today = todayDate();

  const [{ count: applicationsThisWeek }, { count: awaitingReply }, { count: activeConversations }, wonData, followupsDue, jobsForActivity] =
    await Promise.all([
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'saved')
        .gte('created_at', weekStart),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'applied'),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'replied'),
      supabase
        .from('jobs')
        .select('id,proposed_price', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'won')
        .gte('created_at', monthStart),
      supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('followup_date', today)
        .order('created_at', { ascending: false }),
      supabase.from('jobs').select('title,platform,status,created_at,applied_at,closed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);

  if (wonData.error || followupsDue.error || jobsForActivity.error) {
    return json(res, 500, { error: wonData.error?.message || followupsDue.error?.message || jobsForActivity.error?.message });
  }

  const totalRevenue = (wonData.data || []).reduce((sum, row) => sum + Number(row.proposed_price || 0), 0);
  const recentActivity = buildActivity(jobsForActivity.data || []);

  return json(res, 200, {
    applications_this_week: applicationsThisWeek || 0,
    awaiting_reply: awaitingReply || 0,
    active_conversations: activeConversations || 0,
    projects_won: wonData.count || 0,
    total_revenue: totalRevenue,
    followups_due: followupsDue.data || [],
    recent_activity: recentActivity,
  });
}
