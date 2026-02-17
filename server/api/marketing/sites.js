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

const normalizeSlug = (raw) =>
  String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const VALID_TEMPLATES = new Set(['studio', 'minimal', 'bold']);
const VALID_BG = new Set(['aurora', 'grid', 'plain']);
const isValidTemplate = (template) =>
  VALID_TEMPLATES.has(template) || /^linkbio_[a-z0-9_]+$/.test(template) || /^portfolio_[a-z0-9_]+$/.test(template);
const VALID_SITE_KINDS = new Set(['link_in_bio', 'portfolio']);

const handleList = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const { data, error: listError } = await supabase
    .from('marketing_sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (listError) return json(res, 500, { error: listError.message });
  return json(res, 200, { sites: data || [] });
};

const handleCreate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const body = parseBody(req);
  const name = String(body.name || '').trim().slice(0, 80) || 'My Marketing Site';
  const slug = normalizeSlug(body.slug || name);
  if (!slug) return json(res, 400, { error: 'Valid slug is required' });

  const template = String(body.template || 'studio').trim().toLowerCase();
  if (!isValidTemplate(template)) return json(res, 400, { error: 'Invalid template' });

  const payload = {
    user_id: user.id,
    slug,
    name,
    template,
    headline: String(body.headline || 'Build trust. Win better clients.').trim().slice(0, 140),
    subheadline: String(body.subheadline || 'A simple page with my work and an email signup for updates.').trim().slice(0, 220),
    cta_text: String(body.cta_text || 'Get updates').trim().slice(0, 40),
    logo_url: body.logo_url ? String(body.logo_url).trim().slice(0, 500) : null,
    show_email_signup: body.show_email_signup !== false,
    show_portfolio: body.show_portfolio !== false,
    primary_color: String(body.primary_color || '#6366F1').trim().slice(0, 20),
    accent_color: String(body.accent_color || '#22C55E').trim().slice(0, 20),
    background_style: VALID_BG.has(String(body.background_style || 'aurora').trim().toLowerCase())
      ? String(body.background_style || 'aurora').trim().toLowerCase()
      : 'aurora',
    site_kind: VALID_SITE_KINDS.has(String(body.site_kind || '').trim().toLowerCase())
      ? String(body.site_kind).trim().toLowerCase()
      : template.startsWith('linkbio_')
        ? 'link_in_bio'
        : 'portfolio',
    config: body.config && typeof body.config === 'object' ? body.config : {},
    published_at: body.published ? new Date().toISOString() : null,
  };

  const { data: existingKind, error: kindCheckError } = await supabase
    .from('marketing_sites')
    .select('id,name,slug,site_kind')
    .eq('user_id', user.id)
    .eq('site_kind', payload.site_kind)
    .maybeSingle();
  if (kindCheckError) return json(res, 500, { error: kindCheckError.message });
  if (existingKind) return json(res, 409, { error: `You already have a ${payload.site_kind} site`, site: existingKind });

  const { data, error: insertError } = await supabase.from('marketing_sites').insert(payload).select('*').single();
  if (insertError) return json(res, 500, { error: insertError.message });
  return json(res, 201, { site: data });
};

const handleUpdate = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const body = parseBody(req);
  const patch = {};

  if (body.name != null) patch.name = String(body.name).trim().slice(0, 80);
  if (body.slug != null) {
    const slug = normalizeSlug(body.slug);
    if (!slug) return json(res, 400, { error: 'Invalid slug' });
    patch.slug = slug;
  }
  if (body.template != null) {
    const template = String(body.template).trim().toLowerCase();
    if (!isValidTemplate(template)) return json(res, 400, { error: 'Invalid template' });
    patch.template = template;
  }
  if (body.headline != null) patch.headline = String(body.headline).trim().slice(0, 140);
  if (body.subheadline != null) patch.subheadline = String(body.subheadline).trim().slice(0, 220);
  if (body.cta_text != null) patch.cta_text = String(body.cta_text).trim().slice(0, 40);
  if (body.logo_url != null) patch.logo_url = String(body.logo_url).trim().slice(0, 500) || null;
  if (body.show_email_signup != null) patch.show_email_signup = Boolean(body.show_email_signup);
  if (body.show_portfolio != null) patch.show_portfolio = Boolean(body.show_portfolio);
  if (body.primary_color != null) patch.primary_color = String(body.primary_color).trim().slice(0, 20);
  if (body.accent_color != null) patch.accent_color = String(body.accent_color).trim().slice(0, 20);
  if (body.background_style != null) {
    const bg = String(body.background_style).trim().toLowerCase();
    if (!VALID_BG.has(bg)) return json(res, 400, { error: 'Invalid background_style' });
    patch.background_style = bg;
  }
  if (body.site_kind != null) {
    const kind = String(body.site_kind).trim().toLowerCase();
    if (!VALID_SITE_KINDS.has(kind)) return json(res, 400, { error: 'Invalid site_kind' });
    patch.site_kind = kind;
  }
  if (body.config != null) {
    if (!body.config || typeof body.config !== 'object') return json(res, 400, { error: 'Invalid config' });
    patch.config = body.config;
  }
  if (body.published != null) {
    patch.published_at = body.published ? new Date().toISOString() : null;
  }

  const { data, error: updateError } = await supabase
    .from('marketing_sites')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) return json(res, 500, { error: updateError.message });
  return json(res, 200, { site: data });
};

const handleDelete = async (req, res) => {
  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  const params = getQueryParams(req);
  const id = String(params.id || '').trim();
  if (!id) return json(res, 400, { error: 'id is required' });

  const { error: deleteError } = await supabase.from('marketing_sites').delete().eq('id', id).eq('user_id', user.id);
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
