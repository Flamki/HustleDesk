import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
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

const parseBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return {};
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

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const templateKey = (params.template_key || '').toString().trim();

  let q = supabase
    .from('template_overrides')
    .select('template_key,title,content,created_at,updated_at')
    .eq('user_id', user.id);

  if (templateKey) q = q.eq('template_key', templateKey);

  const { data, error: listError } = await q.order('updated_at', { ascending: false });
  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { overrides: data || [] });
};

const handleUpsert = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const templateKey = String(body.template_key || '').trim();
  const title = String(body.title || '').trim().slice(0, 200);
  const content = String(body.content || '').trim();

  if (!templateKey) return json(res, 400, { error: 'template_key is required' });
  if (!/^[a-z0-9_]+$/.test(templateKey)) return json(res, 400, { error: 'template_key is invalid' });
  if (!content) return json(res, 400, { error: 'content is required' });

  const { data, error: upsertError } = await supabase
    .from('template_overrides')
    .upsert(
      {
        user_id: user.id,
        template_key: templateKey,
        title,
        content,
      },
      { onConflict: 'user_id,template_key' }
    )
    .select('template_key,title,content,created_at,updated_at')
    .single();

  if (upsertError) return json(res, 500, { error: upsertError.message });
  return json(res, 200, { override: data });
};

const handleDelete = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const templateKey = String(params.template_key || '').trim();
  if (!templateKey) return json(res, 400, { error: 'template_key is required' });

  const { error: deleteError } = await supabase
    .from('template_overrides')
    .delete()
    .eq('user_id', user.id)
    .eq('template_key', templateKey);

  if (deleteError) return json(res, 500, { error: deleteError.message });
  return json(res, 200, { success: true });
};

export default async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'PUT' || req.method === 'POST') return handleUpsert(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  return json(res, 405, { error: 'Method not allowed' });
}

