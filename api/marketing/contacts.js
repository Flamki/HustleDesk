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

const normalizeTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 50);
  return String(value)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 50);
};

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const search = params.search ? String(params.search).trim().slice(0, 120) : '';
  const tag = params.tag ? String(params.tag).trim().slice(0, 64) : '';
  const status = params.status ? String(params.status).trim().toLowerCase() : '';
  const limit = Math.max(1, Math.min(200, Number(params.limit || 50)));
  const offset = Math.max(0, Number(params.offset || 0));

  let query = supabase
    .from('marketing_contacts')
    .select('*', { count: 'estimated' })
    .eq('user_id', user.id);

  if (status) query = query.eq('status', status);
  if (tag) query = query.contains('tags', [tag]);
  if (search) {
    const safe = search.replace(/[(),]/g, ' ').trim();
    if (safe) query = query.or(`email.ilike.%${safe}%,first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,company.ilike.%${safe}%`);
  }

  const { data, error: listError, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { contacts: data || [], total: count || 0, limit, offset });
};

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return json(res, 400, { error: 'Valid email is required' });

  const firstName = body.firstName ? String(body.firstName).trim().slice(0, 100) : null;
  const lastName = body.lastName ? String(body.lastName).trim().slice(0, 100) : null;
  const company = body.company ? String(body.company).trim().slice(0, 200) : null;
  const tags = normalizeTags(body.tags);
  const status = body.status ? String(body.status).trim().toLowerCase() : 'subscribed';
  if (!['subscribed', 'unsubscribed', 'pending'].includes(status)) return json(res, 400, { error: 'Invalid status' });

  const { data, error: upsertError } = await supabase
    .from('marketing_contacts')
    .upsert(
      {
        user_id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        company,
        tags,
        status,
        unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,email' }
    )
    .select('*')
    .single();

  if (upsertError) return json(res, 500, { error: upsertError.message });
  return json(res, 201, { contact: data });
};

const handleUpdate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const body = parseBody(req);
  const patch = {};
  if (body.firstName != null) patch.first_name = String(body.firstName).trim().slice(0, 100) || null;
  if (body.lastName != null) patch.last_name = String(body.lastName).trim().slice(0, 100) || null;
  if (body.company != null) patch.company = String(body.company).trim().slice(0, 200) || null;
  if (body.tags != null) patch.tags = normalizeTags(body.tags);
  if (body.status != null) {
    const status = String(body.status).trim().toLowerCase();
    if (!['subscribed', 'unsubscribed', 'pending'].includes(status)) return json(res, 400, { error: 'Invalid status' });
    patch.status = status;
    patch.unsubscribed_at = status === 'unsubscribed' ? new Date().toISOString() : null;
  }

  const { data, error: updateError } = await supabase
    .from('marketing_contacts')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) return json(res, 500, { error: updateError.message });
  return json(res, 200, { contact: data });
};

const handleDelete = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const { error: deleteError } = await supabase.from('marketing_contacts').delete().eq('id', id).eq('user_id', user.id);
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

