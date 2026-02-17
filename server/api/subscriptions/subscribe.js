import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!url || !serviceRoleKey) return json(res, 500, { error: 'Supabase environment not configured' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  const email = String(body.email || '').trim().toLowerCase();
  const source = String(body.source || 'updates_page').trim().slice(0, 100);

  if (!email) return json(res, 400, { error: 'Email is required' });
  if (!EMAIL_REGEX.test(email)) return json(res, 400, { error: 'Invalid email format' });

  const supabase = createClient(url, serviceRoleKey);

  const { error } = await supabase
    .from('email_subscriptions')
    .upsert(
      {
        email,
        source,
        status: 'active',
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (error) return json(res, 500, { error: error.message });

  return json(res, 200, { success: true, message: 'Subscribed successfully' });
}
