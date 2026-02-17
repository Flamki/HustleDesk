import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

export default async function handler(req, res) {
  const params = getQueryParams(req);
  const token = String(params.token || '').trim();
  if (!token) return json(res, 400, { error: 'token is required' });
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Server not configured' });

  // Public endpoint: uses service role to update unsubscribe state.
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: contact, error: contactErr } = await supabase
    .from('marketing_contacts')
    .select('id,status,unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (contactErr) return json(res, 500, { error: contactErr.message });
  if (!contact) return json(res, 404, { error: 'Not found' });

  const { data, error } = await supabase
    .from('marketing_contacts')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', contact.id)
    .select('id,status,unsubscribed_at')
    .single();

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { success: true, contact: data });
}

