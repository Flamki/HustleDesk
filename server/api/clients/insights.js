import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const defaultWeights = {
  won_job_weight: 20,
  active_lead_weight: 8,
  revenue_weight: 20,
  recency_recent_weight: 25,
  recency_warm_weight: 10,
  dormancy_penalty: -10,
};

const withDefaults = (weights = {}) => ({
  won_job_weight: safeNum(weights.won_job_weight) || defaultWeights.won_job_weight,
  active_lead_weight: safeNum(weights.active_lead_weight) || defaultWeights.active_lead_weight,
  revenue_weight: safeNum(weights.revenue_weight) || defaultWeights.revenue_weight,
  recency_recent_weight: safeNum(weights.recency_recent_weight) || defaultWeights.recency_recent_weight,
  recency_warm_weight: safeNum(weights.recency_warm_weight) || defaultWeights.recency_warm_weight,
  dormancy_penalty: Number.isFinite(Number(weights.dormancy_penalty))
    ? Number(weights.dormancy_penalty)
    : defaultWeights.dormancy_penalty,
});

const normalizeClient = (name) => {
  const value = String(name || '').trim();
  return value || 'Unspecified Client';
};

const lastActiveLabel = (iso) => {
  if (!iso) return 'No activity';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
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

  const [jobsRes, timeRes, settingsRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id,title,company,platform,status,created_at,closed_at,proposed_price')
      .eq('user_id', user.id),
    supabase
      .from('time_entries')
      .select('id,client,project,start_time,duration_seconds,earnings,hourly_rate')
      .eq('user_id', user.id),
    supabase
      .from('client_segmentation_settings')
      .select('weights')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (jobsRes.error || timeRes.error || settingsRes.error) {
    return json(res, 500, { error: jobsRes.error?.message || timeRes.error?.message || settingsRes.error?.message });
  }

  const jobs = jobsRes.data || [];
  const timeEntries = timeRes.data || [];
  const weights = withDefaults(settingsRes.data?.weights || {});

  const clientMap = new Map();

  for (const job of jobs) {
    const key = normalizeClient(job.company || job.platform);
    const current =
      clientMap.get(key) || {
        name: key,
        projects: new Set(),
        jobs: 0,
        wonJobs: 0,
        activeLeads: 0,
        lostJobs: 0,
        revenue: 0,
        trackedSeconds: 0,
        trackedEarnings: 0,
        lastActiveAt: null,
      };

    current.jobs += 1;
    current.projects.add(job.title);
    if (job.status === 'won') {
      current.wonJobs += 1;
      current.revenue += safeNum(job.proposed_price);
    } else if (job.status === 'lost') {
      current.lostJobs += 1;
    } else if (job.status === 'applied' || job.status === 'replied') {
      current.activeLeads += 1;
    }

    const activityTs = new Date(job.closed_at || job.created_at).toISOString();
    if (!current.lastActiveAt || new Date(activityTs).getTime() > new Date(current.lastActiveAt).getTime()) {
      current.lastActiveAt = activityTs;
    }

    clientMap.set(key, current);
  }

  for (const t of timeEntries) {
    const key = normalizeClient(t.client);
    const current =
      clientMap.get(key) || {
        name: key,
        projects: new Set(),
        jobs: 0,
        wonJobs: 0,
        activeLeads: 0,
        lostJobs: 0,
        revenue: 0,
        trackedSeconds: 0,
        trackedEarnings: 0,
        lastActiveAt: null,
      };

    current.projects.add(t.project || 'General');
    current.trackedSeconds += safeNum(t.duration_seconds);
    current.trackedEarnings += safeNum(t.earnings);
    current.revenue += safeNum(t.earnings);

    const activityTs = new Date(t.start_time).toISOString();
    if (!current.lastActiveAt || new Date(activityTs).getTime() > new Date(current.lastActiveAt).getTime()) {
      current.lastActiveAt = activityTs;
    }

    clientMap.set(key, current);
  }

  const clients = [...clientMap.values()].map((c) => {
    const trackedHours = c.trackedSeconds / 3600;
    const effectiveRate = trackedHours > 0 ? c.trackedEarnings / trackedHours : 0;
    const daysSinceActive = c.lastActiveAt ? Math.floor((Date.now() - new Date(c.lastActiveAt).getTime()) / 86400000) : 999;
    let status = 'Lead';
    if (c.activeLeads > 0 || daysSinceActive <= 14) status = 'Active';
    if (daysSinceActive > 45 && c.revenue > 0) status = 'Dormant';

    const recencyScore = daysSinceActive <= 14 ? weights.recency_recent_weight : daysSinceActive <= 45 ? weights.recency_warm_weight : 0;
    const rawScore =
      c.wonJobs * weights.won_job_weight +
      c.activeLeads * weights.active_lead_weight +
      (c.revenue > 0 ? weights.revenue_weight : 0) +
      recencyScore +
      (daysSinceActive > 45 ? weights.dormancy_penalty : 0);

    return {
      name: c.name,
      status,
      total_revenue: Number(c.revenue.toFixed(2)),
      projects_count: c.projects.size,
      jobs_count: c.jobs,
      won_jobs: c.wonJobs,
      active_leads: c.activeLeads,
      tracked_hours: Number(trackedHours.toFixed(2)),
      effective_hourly_rate: Number(effectiveRate.toFixed(2)),
      last_active_at: c.lastActiveAt,
      last_active_label: lastActiveLabel(c.lastActiveAt),
      health_score: Math.min(100, Math.max(0, Math.round(rawScore))),
    };
  });

  clients.sort((a, b) => b.total_revenue - a.total_revenue);

  const totalClients = clients.length;
  const retainedClients = clients.filter((c) => c.won_jobs >= 2 || c.projects_count >= 2).length;
  const retentionRate = totalClients > 0 ? (retainedClients / totalClients) * 100 : 0;

  const opportunities = [];
  for (const c of clients) {
    if (c.status === 'Dormant' && c.total_revenue > 0) {
      opportunities.push({
        client: c.name,
        potential: `${Math.max(500, Math.round(c.effective_hourly_rate * 8))}`,
        reason: `Dormant for ${c.last_active_label} with prior paid work.`,
        action: 'Send a reactivation proposal',
      });
    } else if (c.active_leads > 0 && c.won_jobs === 0) {
      opportunities.push({
        client: c.name,
        potential: `${Math.max(300, Math.round((c.active_leads * 250)))}`,
        reason: `${c.active_leads} open lead(s) but no closed deal yet.`,
        action: 'Send case study + follow-up',
      });
    }
  }

  const distribution = [
    {
      label: 'Active',
      value: clients.filter((c) => c.status === 'Active').length,
    },
    {
      label: 'Lead',
      value: clients.filter((c) => c.status === 'Lead').length,
    },
    {
      label: 'Dormant',
      value: clients.filter((c) => c.status === 'Dormant').length,
    },
  ];

  return json(res, 200, {
    segmentation_weights: weights,
    summary: {
      total_clients: totalClients,
      retained_clients: retainedClients,
      retention_rate: Number(retentionRate.toFixed(2)),
      total_client_revenue: Number(clients.reduce((sum, c) => sum + c.total_revenue, 0).toFixed(2)),
    },
    clients,
    opportunities: opportunities.slice(0, 5),
    distribution,
  });
}

