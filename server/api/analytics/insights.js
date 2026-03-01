import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const getRangeStart = (range) => {
  const now = new Date();
  const normalized = String(range || '30d').toLowerCase();
  if (normalized === '7d') now.setUTCDate(now.getUTCDate() - 7);
  else if (normalized === '90d') now.setUTCDate(now.getUTCDate() - 90);
  else if (normalized === 'ytd') now.setUTCMonth(0, 1);
  else now.setUTCDate(now.getUTCDate() - 30);
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
};

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const monthKey = (iso) => {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
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

  let range = '30d';
  if (req.query?.range) range = String(req.query.range);
  else if (req.url?.includes('?')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      range = parsed.searchParams.get('range') || '30d';
    } catch {
      range = '30d';
    }
  }

  const startIso = getRangeStart(range);
  const nowIso = new Date().toISOString();

  const [jobsRes, timeRes, allJobsRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id,title,company,platform,status,created_at,applied_at,closed_at,proposed_price,currency,followup_date,followup_at')
      .eq('user_id', user.id)
      .gte('created_at', startIso)
      .lte('created_at', nowIso),
    supabase
      .from('time_entries')
      .select('id,client,project,start_time,duration_seconds,earnings,hourly_rate,currency')
      .eq('user_id', user.id)
      .gte('start_time', startIso)
      .lte('start_time', nowIso),
    supabase
      .from('jobs')
      .select('id,status,platform,created_at,proposed_price')
      .eq('user_id', user.id),
  ]);

  if (jobsRes.error || timeRes.error || allJobsRes.error) {
    return json(res, 500, { error: jobsRes.error?.message || timeRes.error?.message || allJobsRes.error?.message });
  }

  const jobs = jobsRes.data || [];
  const timeEntries = timeRes.data || [];
  const allJobs = allJobsRes.data || [];

  const statusCounts = {
    saved: 0,
    applied: 0,
    replied: 0,
    won: 0,
    lost: 0,
  };
  for (const j of jobs) {
    if (statusCounts[j.status] !== undefined) statusCounts[j.status] += 1;
  }

  const actionable = statusCounts.applied + statusCounts.replied + statusCounts.won + statusCounts.lost;
  const winRate = actionable > 0 ? (statusCounts.won / actionable) * 100 : 0;
  const replyRate = statusCounts.applied + statusCounts.replied + statusCounts.won + statusCounts.lost > 0
    ? ((statusCounts.replied + statusCounts.won + statusCounts.lost) / (statusCounts.applied + statusCounts.replied + statusCounts.won + statusCounts.lost)) * 100
    : 0;

  const wonRevenue = jobs
    .filter((j) => j.status === 'won')
    .reduce((sum, j) => sum + safeNum(j.proposed_price), 0);

  const trackedSeconds = timeEntries.reduce((sum, t) => sum + safeNum(t.duration_seconds), 0);
  const trackedHours = trackedSeconds / 3600;
  const trackedEarnings = timeEntries.reduce((sum, t) => sum + safeNum(t.earnings), 0);
  const effectiveRate = trackedHours > 0 ? trackedEarnings / trackedHours : 0;

  const totalRevenue = wonRevenue + trackedEarnings;

  const platformMap = new Map();
  for (const j of jobs) {
    const p = j.platform || 'other';
    const current = platformMap.get(p) || { applications: 0, wins: 0, revenue: 0 };
    if (j.status !== 'saved') current.applications += 1;
    if (j.status === 'won') {
      current.wins += 1;
      current.revenue += safeNum(j.proposed_price);
    }
    platformMap.set(p, current);
  }

  const platformPerformance = [...platformMap.entries()].map(([platform, data]) => ({
    platform,
    applications: data.applications,
    wins: data.wins,
    win_rate: data.applications > 0 ? (data.wins / data.applications) * 100 : 0,
    revenue: data.revenue,
  }));

  const topPlatform = platformPerformance.sort((a, b) => b.win_rate - a.win_rate)[0];

  const bucketMap = new Map();
  const bucketFormat = range === '7d' ? 'day' : 'week';
  const toBucket = (iso) => {
    const d = new Date(iso);
    if (bucketFormat === 'day') return d.toISOString().slice(0, 10);
    const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = copy.getUTCDay() || 7;
    copy.setUTCDate(copy.getUTCDate() - day + 1);
    return copy.toISOString().slice(0, 10);
  };

  for (const j of jobs) {
    const key = toBucket(j.created_at);
    const current = bucketMap.get(key) || { label: key, revenue: 0, applications: 0, wins: 0 };
    if (j.status !== 'saved') current.applications += 1;
    if (j.status === 'won') {
      current.wins += 1;
      current.revenue += safeNum(j.proposed_price);
    }
    bucketMap.set(key, current);
  }
  for (const t of timeEntries) {
    const key = toBucket(t.start_time);
    const current = bucketMap.get(key) || { label: key, revenue: 0, applications: 0, wins: 0 };
    current.revenue += safeNum(t.earnings);
    bucketMap.set(key, current);
  }

  const trend = [...bucketMap.values()].sort((a, b) => a.label.localeCompare(b.label));

  // Forecast next 30 days using linear trend + baseline daily average.
  const dailyMap = new Map();
  const forecastDays = 30;
  for (let i = 0; i < forecastDays; i += 1) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - (forecastDays - 1 - i));
    day.setUTCHours(0, 0, 0, 0);
    dailyMap.set(day.toISOString().slice(0, 10), 0);
  }
  for (const j of allJobs) {
    if (j.status !== 'won') continue;
    const k = new Date(j.created_at).toISOString().slice(0, 10);
    if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k) + safeNum(j.proposed_price));
  }
  for (const t of timeEntries) {
    const k = new Date(t.start_time).toISOString().slice(0, 10);
    if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k) + safeNum(t.earnings));
  }
  const series = [...dailyMap.values()];
  const n = series.length;
  const avgDaily = n > 0 ? series.reduce((s, x) => s + x, 0) / n : 0;
  let num = 0;
  let den = 0;
  const xMean = (n - 1) / 2;
  const yMean = avgDaily;
  for (let i = 0; i < n; i += 1) {
    num += (i - xMean) * (series[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const slope = den > 0 ? num / den : 0;
  let predicted = 0;
  for (let i = n; i < n + forecastDays; i += 1) {
    const y = Math.max(0, yMean + slope * (i - xMean));
    predicted += y;
  }
  const variance = n > 0 ? series.reduce((s, x) => s + (x - yMean) ** 2, 0) / n : 0;
  const volatility = Math.sqrt(variance);
  const confidence = clamp(100 - (volatility / Math.max(1, yMean + 1)) * 20, 35, 92);

  // Cohort retention matrix (monthly returning clients)
  const clientMonthMap = new Map();
  for (const j of allJobs) {
    const client = String(j.company || j.platform || 'Unspecified Client').trim();
    if (!clientMonthMap.has(client)) clientMonthMap.set(client, new Set());
    clientMonthMap.get(client).add(monthKey(j.created_at));
  }
  for (const t of timeEntries) {
    const client = String(t.client || 'Unspecified Client').trim();
    if (!clientMonthMap.has(client)) clientMonthMap.set(client, new Set());
    clientMonthMap.get(client).add(monthKey(t.start_time));
  }

  const monthList = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    monthList.push(monthKey(d.toISOString()));
  }

  const cohortBuckets = new Map();
  for (const [client, monthsSet] of clientMonthMap.entries()) {
    const months = [...monthsSet].sort();
    const cohort = months.find((m) => monthList.includes(m));
    if (!cohort) continue;
    if (!cohortBuckets.has(cohort)) cohortBuckets.set(cohort, []);
    cohortBuckets.get(cohort).push({ client, months: monthsSet });
  }

  const cohort_retention = monthList.map((cohortMonth) => {
    const members = cohortBuckets.get(cohortMonth) || [];
    const cohortSize = members.length;
    const retention = monthList.map((activeMonth) => {
      if (activeMonth < cohortMonth || cohortSize === 0) return { month: activeMonth, retained: 0, rate: 0 };
      let retained = 0;
      for (const m of members) {
        if (m.months.has(activeMonth)) retained += 1;
      }
      return {
        month: activeMonth,
        retained,
        rate: Number(((retained / cohortSize) * 100).toFixed(2)),
      };
    });
    return {
      cohort_month: cohortMonth,
      cohort_size: cohortSize,
      retention,
    };
  });

  const closedJobs = allJobs.filter((j) => j.status === 'won' || j.status === 'lost');
  const winProbability = clamp(
    (replyRate * 0.45 + winRate * 0.45 + (effectiveRate > 0 ? 10 : 0)) / 1.0,
    0,
    100
  );

  const overdueFollowups = jobs.filter((j) => {
    if (j.status !== 'applied') return false;
    if (j.followup_at) return new Date(j.followup_at).getTime() < Date.now();
    if (j.followup_date) return new Date(`${j.followup_date}T23:59:59.999Z`).getTime() < Date.now();
    return false;
  }).length;

  const insights = [];
  if (topPlatform) {
    insights.push({
      type: 'channel',
      title: `${topPlatform.platform.toUpperCase()} is your strongest channel`,
      detail: `${topPlatform.win_rate.toFixed(1)}% win rate with ${topPlatform.applications} opportunities in selected range.`,
      confidence: clamp(topPlatform.applications * 12, 35, 95),
    });
  }
  if (overdueFollowups > 0) {
    insights.push({
      type: 'followup',
      title: `${overdueFollowups} follow-up${overdueFollowups > 1 ? 's' : ''} overdue`,
      detail: 'Follow-up latency strongly impacts close rate. Prioritize these leads this week.',
      confidence: 88,
    });
  }
  if (effectiveRate > 0 && effectiveRate < 30) {
    insights.push({
      type: 'pricing',
      title: 'Effective hourly rate is below target',
      detail: `Current effective rate is ${effectiveRate.toFixed(2)}. Review low-value work allocation and increase quoting floor.`,
      confidence: 76,
    });
  }

  const funnel = [
    { stage: 'Saved', value: statusCounts.saved },
    { stage: 'Applied', value: statusCounts.applied },
    { stage: 'Replied', value: statusCounts.replied },
    { stage: 'Won', value: statusCounts.won },
    { stage: 'Lost', value: statusCounts.lost },
  ];

  return json(res, 200, {
    range,
    metrics: {
      total_revenue: Number(totalRevenue.toFixed(2)),
      won_revenue: Number(wonRevenue.toFixed(2)),
      tracked_earnings: Number(trackedEarnings.toFixed(2)),
      tracked_hours: Number(trackedHours.toFixed(2)),
      effective_hourly_rate: Number(effectiveRate.toFixed(2)),
      win_rate: Number(winRate.toFixed(2)),
      reply_rate: Number(replyRate.toFixed(2)),
      active_leads: statusCounts.applied + statusCounts.replied,
      closed_deals: closedJobs.length,
      win_probability_score: Number(winProbability.toFixed(2)),
    },
    funnel,
    platform_performance: platformPerformance,
    trend,
    insights,
    forecast: {
      next_30_days_revenue: Number(predicted.toFixed(2)),
      avg_daily_revenue: Number(avgDaily.toFixed(2)),
      trend_slope_per_day: Number(slope.toFixed(4)),
      confidence: Number(confidence.toFixed(2)),
    },
    cohort_retention,
  });
}

