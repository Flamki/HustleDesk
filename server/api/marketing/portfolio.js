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

const normalizeTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 20);
  return String(value)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
};

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const siteId = String(params.site_id || '').trim();
  if (!siteId) return json(res, 400, { error: 'site_id is required' });

  const { data, error: listError } = await supabase
    .from('marketing_portfolio_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('site_id', siteId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { items: data || [] });
};

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const siteId = String(body.site_id || '').trim();
  const title = String(body.title || '').trim().slice(0, 120);
  const description = String(body.description || '').trim().slice(0, 600);
  if (!siteId) return json(res, 400, { error: 'site_id is required' });
  if (!title) return json(res, 400, { error: 'title is required' });

  const urlValue = body.url ? String(body.url).trim().slice(0, 500) : null;
  const tags = normalizeTags(body.tags);
  const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;

  const { data, error: insertError } = await supabase
    .from('marketing_portfolio_items')
    .insert({
      user_id: user.id,
      site_id: siteId,
      title,
      description,
      url: urlValue,
      tags,
      sort_order: sortOrder,
    })
    .select('*')
    .single();

  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 201, { item: data });
};

const handleUpdate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const body = parseBody(req);
  const patch = {};
  if (body.title != null) patch.title = String(body.title).trim().slice(0, 120);
  if (body.description != null) patch.description = String(body.description).trim().slice(0, 600);
  if (body.url != null) patch.url = String(body.url).trim().slice(0, 500) || null;
  if (body.tags != null) patch.tags = normalizeTags(body.tags);
  if (body.sort_order != null) patch.sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;

  const { data, error: updateError } = await supabase
    .from('marketing_portfolio_items')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) return json(res, 500, { error: updateError.message });
  return json(res, 200, { item: data });
};

const handleDelete = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const { error: deleteError } = await supabase.from('marketing_portfolio_items').delete().eq('id', id).eq('user_id', user.id);
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


