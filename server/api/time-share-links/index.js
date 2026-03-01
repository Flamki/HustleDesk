import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const toIsoOrNull = (value) => {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const { data, error: listError } = await supabase
    .from('time_share_links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { links: data || [] });
};

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const label = String(body.label || '').trim().slice(0, 200);
  const fromTime = toIsoOrNull(body.fromTime);
  const toTime = toIsoOrNull(body.toTime);
  const expiresAt = toIsoOrNull(body.expiresAt);
  const includeDetails = body.includeDetails !== false;

  if (fromTime && toTime && new Date(toTime).getTime() < new Date(fromTime).getTime()) {
    return json(res, 400, { error: 'toTime must be after fromTime' });
  }

  // 192-bit token, url-safe.
  const token = crypto.randomBytes(24).toString('base64url');

  const { data, error: insertError } = await supabase
    .from('time_share_links')
    .insert({
      user_id: user.id,
      token,
      label: label || 'Time Report',
      from_time: fromTime,
      to_time: toTime,
      include_details: includeDetails,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 201, { link: data });
};

const handleRevoke = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const { data, error: updateError } = await supabase
    .from('time_share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) return json(res, 500, { error: updateError.message });
  return json(res, 200, { link: data });
};

export default async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'PATCH') return handleRevoke(req, res);
  return json(res, 405, { error: 'Method not allowed' });
}


