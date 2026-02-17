import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const VALID_PLATFORMS = new Set(['upwork', 'fiverr', 'linkedin', 'other']);
const VALID_STATUSES = new Set(['saved', 'applied', 'replied', 'won', 'lost']);

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

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const title = (body.title || '').trim();
  const platform = String(body.platform || '').toLowerCase();
  const description = (body.description || '').trim();

  if (!title || !platform || !description) return json(res, 400, { error: 'Missing required fields' });
  if (title.length > 500) return json(res, 400, { error: 'Title exceeds 500 characters' });
  if (!VALID_PLATFORMS.has(platform)) return json(res, 400, { error: 'Invalid platform' });
  if (description.length < 50) return json(res, 400, { error: 'Description must be at least 50 characters' });

  const budgetMin = body.budgetMin != null ? Number(body.budgetMin) : null;
  const budgetMax = body.budgetMax != null ? Number(body.budgetMax) : null;
  if (budgetMin != null && budgetMax != null && budgetMax < budgetMin) {
    return json(res, 400, { error: 'Invalid budget range' });
  }

  const payload = {
    user_id: user.id,
    title,
    platform,
    company: body.company || null,
    job_description: description,
    budget_min: budgetMin,
    budget_max: budgetMax,
    proposed_price: body.proposedPrice != null ? Number(body.proposedPrice) : null,
    currency: body.currency || 'INR',
    status: 'saved',
  };

  const { data: inserted, error: insertError } = await supabase.from('jobs').insert(payload).select('id').single();
  if (insertError) return json(res, 500, { error: insertError.message });

  return json(res, 201, { success: true, job_id: inserted.id, message: 'Job created' });
};

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const status = params.status ? String(params.status).toLowerCase() : null;
  const platform = params.platform ? String(params.platform).toLowerCase() : null;
  const search = params.search ? String(params.search).trim() : '';
  const limit = Math.max(1, Math.min(100, Number(params.limit || 50)));
  const offset = Math.max(0, Number(params.offset || 0));

  if (status && !VALID_STATUSES.has(status)) return json(res, 400, { error: 'Invalid status' });
  if (platform && !VALID_PLATFORMS.has(platform)) return json(res, 400, { error: 'Invalid platform' });

  // Avoid returning huge `job_description` blobs for list view.
  // Count is included in the same request (still computed server-side, but avoids a second round-trip).
  let query = supabase
    .from('jobs')
    .select(
      'id,user_id,title,company,platform,job_description,budget_min,budget_max,currency,proposed_price,status,followup_date,applied_at,closed_at,created_at,notes,proposal',
      { count: 'estimated' }
    )
    .eq('user_id', user.id);

  if (status) {
    query = query.eq('status', status);
  }
  if (platform) {
    query = query.eq('platform', platform);
  }
  if (search) {
    const safe = search.slice(0, 120).replace(/[(),]/g, ' ').trim();
    if (safe) {
      // Search across title + description, but do not return description in the list payload.
      query = query.or(`title.ilike.%${safe}%,job_description.ilike.%${safe}%`);
    }
  }

  const { data, error: listError, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { jobs: data || [], total: count || 0, limit, offset });
};

export default async function handler(req, res) {
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'GET') return handleList(req, res);
  return json(res, 405, { error: 'Method not allowed' });
}
