import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toIso = (value) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

const normalizePayload = (body) => {
  const client = String(body.client || '').trim();
  const project = String(body.project || '').trim();
  const description = String(body.description || '').trim();
  const startTime = toIso(body.startTime);
  const endTime = toIso(body.endTime);
  const hourlyRate = toNum(body.hourlyRate, 0);
  const currency = String(body.currency || 'USD').trim().slice(0, 10) || 'USD';
  const durationSeconds = Math.max(0, Math.floor(toNum(body.durationSeconds, 0)));
  const earnings = Math.max(0, toNum(body.earnings, 0));
  const jobId = body.jobId ? String(body.jobId) : null;

  return {
    client,
    project,
    description,
    startTime,
    endTime,
    hourlyRate,
    currency,
    durationSeconds,
    earnings,
    jobId,
  };
};

const validatePayload = (payload) => {
  if (!payload.client) return 'Client is required';
  if (!payload.project) return 'Project is required';
  if (!payload.startTime || !payload.endTime) return 'Valid start and end time are required';
  if (new Date(payload.endTime).getTime() < new Date(payload.startTime).getTime()) return 'End time must be after start time';
  if (payload.durationSeconds <= 0) return 'Duration must be greater than zero';
  return null;
};

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const from = params.from ? toIso(params.from) : null;
  const to = params.to ? toIso(params.to) : null;
  const limit = Math.max(1, Math.min(200, toNum(params.limit, 100)));
  const offset = Math.max(0, toNum(params.offset, 0));

  // Count is included in the same request to avoid a second network round-trip.
  let query = supabase.from('time_entries').select('*', { count: 'estimated' }).eq('user_id', user.id);

  if (from) {
    query = query.gte('start_time', from);
  }
  if (to) {
    query = query.lte('start_time', to);
  }

  const { data, error: listError, count } = await query.order('start_time', { ascending: false }).range(offset, offset + limit - 1);
  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { entries: data || [], total: count || 0, limit, offset });
};

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const payload = normalizePayload(body);
  const validationError = validatePayload(payload);
  if (validationError) return json(res, 400, { error: validationError });

  const insertPayload = {
    user_id: user.id,
    job_id: payload.jobId,
    client: payload.client,
    project: payload.project,
    description: payload.description,
    start_time: payload.startTime,
    end_time: payload.endTime,
    duration_seconds: payload.durationSeconds,
    hourly_rate: payload.hourlyRate,
    currency: payload.currency,
    earnings: payload.earnings,
  };

  const { data, error: insertError } = await supabase
    .from('time_entries')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 201, { success: true, entry: data });
};

const handleUpdate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const payload = normalizePayload(body);
  const validationError = validatePayload(payload);
  if (validationError) return json(res, 400, { error: validationError });

  const updatePayload = {
    job_id: payload.jobId,
    client: payload.client,
    project: payload.project,
    description: payload.description,
    start_time: payload.startTime,
    end_time: payload.endTime,
    duration_seconds: payload.durationSeconds,
    hourly_rate: payload.hourlyRate,
    currency: payload.currency,
    earnings: payload.earnings,
  };

  const { data, error: updateError } = await supabase
    .from('time_entries')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) return json(res, 500, { error: updateError.message });
  return json(res, 200, { success: true, entry: data });
};

const handleDelete = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const { error: deleteError } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) return json(res, 500, { error: deleteError.message });
  return json(res, 200, { success: true });
};

export default async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'PATCH') return handleUpdate(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  return json(res, 405, { error: 'Method not allowed' });
}
