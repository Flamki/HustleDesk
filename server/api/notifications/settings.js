import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
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

const normalize = (input = {}) => ({
  followup_reminders: Boolean(input.followup_reminders),
  client_replies: Boolean(input.client_replies),
  weekly_summary: Boolean(input.weekly_summary),
});

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') return json(res, 405, { error: 'Method not allowed' });

  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  if (req.method === 'GET') {
    const { data, error: fetchError } = await supabase
      .from('notification_settings')
      .select('followup_reminders,client_replies,weekly_summary')
      .eq('user_id', user.id)
      .maybeSingle();
    if (fetchError) return json(res, 500, { error: fetchError.message });

    // Return defaults if row doesn't exist yet.
    return json(res, 200, {
      settings: {
        followup_reminders: data?.followup_reminders ?? true,
        client_replies: data?.client_replies ?? true,
        weekly_summary: data?.weekly_summary ?? true,
      },
    });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  const settings = normalize(body.settings || body);

  const { error: upsertError } = await supabase
    .from('notification_settings')
    .upsert(
      {
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) return json(res, 500, { error: upsertError.message });
  return json(res, 200, { success: true, settings });
}

