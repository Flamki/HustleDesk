import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const defaultWeights = {
  won_job_weight: 20,
  active_lead_weight: 8,
  revenue_weight: 20,
  recency_recent_weight: 25,
  recency_warm_weight: 10,
  dormancy_penalty: -10,
};

const toNum = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sanitizeWeights = (input = {}) => ({
  won_job_weight: toNum(input.won_job_weight, defaultWeights.won_job_weight),
  active_lead_weight: toNum(input.active_lead_weight, defaultWeights.active_lead_weight),
  revenue_weight: toNum(input.revenue_weight, defaultWeights.revenue_weight),
  recency_recent_weight: toNum(input.recency_recent_weight, defaultWeights.recency_recent_weight),
  recency_warm_weight: toNum(input.recency_warm_weight, defaultWeights.recency_warm_weight),
  dormancy_penalty: toNum(input.dormancy_penalty, defaultWeights.dormancy_penalty),
});

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') return json(res, 405, { error: 'Method not allowed' });
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

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('client_segmentation_settings')
      .select('weights')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { weights: sanitizeWeights(data?.weights || {}) });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const weights = sanitizeWeights(body.weights || {});

  const { error } = await supabase
    .from('client_segmentation_settings')
    .upsert({ user_id: user.id, weights, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return json(res, 500, { error: error.message });

  return json(res, 200, { success: true, weights });
}

