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

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const limit = Math.max(1, Math.min(100, Number(params.limit || 50)));
  const offset = Math.max(0, Number(params.offset || 0));

  const { data, error: listError, count } = await supabase
    .from('marketing_campaigns')
    .select('*', { count: 'estimated' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { campaigns: data || [], total: count || 0, limit, offset });
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const subject = String(body.subject || '').trim();
  const name = String(body.name || '').trim().slice(0, 140);
  const fromName = String(body.fromName || '').trim().slice(0, 140);
  const fromEmail = normalizeEmail(body.fromEmail || '');
  const replyTo = body.replyTo ? normalizeEmail(body.replyTo) : null;
  const bodyText = String(body.bodyText || '').trim();
  const bodyHtml = String(body.bodyHtml || '').trim();
  const audienceTag = body.audienceTag ? String(body.audienceTag).trim().slice(0, 64) : null;

  if (!subject) return json(res, 400, { error: 'Subject is required' });
  if (!fromEmail || !fromEmail.includes('@')) return json(res, 400, { error: 'Valid fromEmail is required' });
  if (!bodyText && !bodyHtml) return json(res, 400, { error: 'bodyText or bodyHtml is required' });

  const { data, error: insertError } = await supabase
    .from('marketing_campaigns')
    .insert({
      user_id: user.id,
      name,
      subject,
      from_name: fromName,
      from_email: fromEmail,
      reply_to: replyTo,
      body_text: bodyText,
      body_html: bodyHtml,
      audience_tag: audienceTag,
      status: 'draft',
    })
    .select('*')
    .single();

  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 201, { campaign: data });
};

const handleUpdate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const body = parseBody(req);
  const patch = {};
  if (body.name != null) patch.name = String(body.name).trim().slice(0, 140);
  if (body.subject != null) patch.subject = String(body.subject).trim().slice(0, 200);
  if (body.fromName != null) patch.from_name = String(body.fromName).trim().slice(0, 140);
  if (body.fromEmail != null) patch.from_email = normalizeEmail(body.fromEmail);
  if (body.replyTo != null) patch.reply_to = body.replyTo ? normalizeEmail(body.replyTo) : null;
  if (body.bodyText != null) patch.body_text = String(body.bodyText || '').trim();
  if (body.bodyHtml != null) patch.body_html = String(body.bodyHtml || '').trim();
  if (body.audienceTag !== undefined) patch.audience_tag = body.audienceTag ? String(body.audienceTag).trim().slice(0, 64) : null;

  const { data, error: updateError } = await supabase
    .from('marketing_campaigns')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) return json(res, 500, { error: updateError.message });
  return json(res, 200, { campaign: data });
};

export default async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'PATCH') return handleUpdate(req, res);
  return json(res, 405, { error: 'Method not allowed' });
}


