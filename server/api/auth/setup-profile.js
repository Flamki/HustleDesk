import { createClient } from '@supabase/supabase-js';
import { secureJson, validateInput } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = secureJson;

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!url || !anonKey || !serviceRoleKey) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !validateInput(token, 2000)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();
  if (userError || !user) return json(res, 401, { error: 'Unauthorized' });

  const adminClient = createClient(url, serviceRoleKey);
  const payload = {
    id: user.id,
    email: user.email ?? '',
    plan: 'free',
    ai_credits_used: 0,
    ai_credits_limit: 5,
    skills: [],
  };

  const { error: upsertError } = await adminClient
    .from('users')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    return json(res, 500, { error: upsertError.message });
  }

  return json(res, 200, { success: true, message: 'Profile is ready' });
}
