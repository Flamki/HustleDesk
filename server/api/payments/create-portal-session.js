import {
  getAuthedUser,
  getRequestOrigin,
  json,
} from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const origin = getRequestOrigin(req);
    return json(res, 200, { url: `${origin}/app/settings?tab=billing#invoice-history` });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to open billing view',
    });
  }
}
