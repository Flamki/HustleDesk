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

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const siteId = String(params.site_id || '').trim();
  if (!siteId) return json(res, 400, { error: 'site_id is required' });

  const limit = Math.max(1, Math.min(200, Number(params.limit || 50)));
  const offset = Math.max(0, Number(params.offset || 0));

  const { data, error: listError, count } = await supabase
    .from('marketing_site_signups')
    .select('id,site_id,email,name,consent,created_at', { count: 'estimated' })
    .eq('user_id', user.id)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { signups: data || [], total: count || 0, limit, offset });
}


