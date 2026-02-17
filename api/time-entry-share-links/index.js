import crypto from 'node:crypto';
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

const toIsoOrNull = (value) => {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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

  const params = getQueryParams(req);
  const timeEntryId = params.timeEntryId ? String(params.timeEntryId).trim() : '';

  let q = supabase
    .from('time_entry_share_links')
    .select('*')
    .eq('user_id', user.id);

  if (timeEntryId) {
    q = q.eq('time_entry_id', timeEntryId);
  }

  const { data, error: listError } = await q.order('created_at', { ascending: false }).limit(200);

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { links: data || [] });
};

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const timeEntryId = String(body.timeEntryId || '').trim();
  const includeDetails = body.includeDetails !== false;
  const expiresAt = toIsoOrNull(body.expiresAt);
  const forceNew = body.forceNew === true;

  if (!timeEntryId) return json(res, 400, { error: 'timeEntryId is required' });

  // Ensure the entry belongs to the authenticated user.
  const { data: entry, error: entryError } = await supabase
    .from('time_entries')
    .select('id')
    .eq('id', timeEntryId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (entryError) return json(res, 500, { error: entryError.message });
  if (!entry) return json(res, 404, { error: 'Time entry not found' });

  // Idempotency: reuse an existing active link for the same settings unless the user forces a new one.
  if (!forceNew) {
    let q = supabase
      .from('time_entry_share_links')
      .select('*')
      .eq('user_id', user.id)
      .eq('time_entry_id', timeEntryId)
      .eq('include_details', includeDetails)
      .is('revoked_at', null);

    if (expiresAt) q = q.eq('expires_at', expiresAt);
    else q = q.is('expires_at', null);

    const { data: existing, error: existingError } = await q
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) return json(res, 500, { error: existingError.message });
    if (existing) return json(res, 200, { link: existing, reused: true });
  }

  const token = crypto.randomBytes(24).toString('base64url');

  const { data, error: insertError } = await supabase
    .from('time_entry_share_links')
    .insert({
      user_id: user.id,
      time_entry_id: timeEntryId,
      token,
      include_details: includeDetails,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 201, { link: data, reused: false });
};

const handleRevoke = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const { data, error: updateError } = await supabase
    .from('time_entry_share_links')
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
