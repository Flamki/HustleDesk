import { createClient } from '@supabase/supabase-js';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const getHeader = (req, name) => {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const expectedToken = process.env.HEALTHCHECK_TOKEN || '';
  if (expectedToken) {
    const providedToken =
      getHeader(req, 'x-health-token') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
    if (providedToken !== expectedToken) {
      return json(res, 401, { error: 'Unauthorized' });
    }
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

  const missing = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY');

  if (missing.length > 0) {
    return json(res, 500, {
      ok: false,
      missing,
      message: 'Missing required Supabase environment variables.',
    });
  }

  const serviceClient = createClient(url, serviceRoleKey);

  const checks = {
    users_table_access: false,
    auth_admin_access: false,
  };

  try {
    const { error } = await serviceClient
      .from('users')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    checks.users_table_access = !error;
    if (error) {
      return json(res, 500, {
        ok: false,
        checks,
        message: `users table check failed: ${error.message}`,
      });
    }
  } catch (err) {
    return json(res, 500, {
      ok: false,
      checks,
      message: `users table check failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
  }

  try {
    const { error } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.auth_admin_access = !error;
    if (error) {
      return json(res, 500, {
        ok: false,
        checks,
        message: `auth admin check failed: ${error.message}`,
      });
    }
  } catch (err) {
    return json(res, 500, {
      ok: false,
      checks,
      message: `auth admin check failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
  }

  return json(res, 200, {
    ok: true,
    checks,
    message: 'Supabase environment and admin access are configured correctly.',
    timestamp: new Date().toISOString(),
  });
}
