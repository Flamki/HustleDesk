import { createClient } from '@supabase/supabase-js';
import { secureJson, validateInput } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const json = secureJson;
const isSchemaCompatibilityError = (message = '') =>
  /relation .* does not exist|column .* does not exist|Could not find .* in the schema cache/i.test(message);

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
  const userPayload = {
    id: user.id,
    email: user.email ?? '',
    plan: 'free',
    ai_credits_used: 0,
    ai_credits_limit: 5,
    skills: [],
  };

  let usersRowReady = true;
  const { error: usersUpsertError } = await adminClient
    .from('users')
    .upsert(userPayload, { onConflict: 'id' });

  if (usersUpsertError) {
    if (isSchemaCompatibilityError(usersUpsertError.message || '')) {
      usersRowReady = false;
    } else {
      return json(res, 500, { error: usersUpsertError.message });
    }
  }

  // Best-effort upsert for freelancer profile. Keep this non-fatal for older schemas.
  let freelancerProfileReady = false;
  try {
    const { error: profileUpsertError } = await adminClient
      .from('freelancer_profiles')
      .upsert(
        {
          user_id: user.id,
          skills: [],
          experience_level: 'Entry',
          years_experience: 0,
          bio: '',
          hourly_rate: 0,
          past_projects: [],
          communication_style: 'Professional',
          completed_onboarding: false,
          preferences: {},
          notification_settings: {},
        },
        { onConflict: 'user_id' }
      );
    if (
      !profileUpsertError ||
      /relation .*freelancer_profiles.* does not exist|column .*freelancer_profiles.* does not exist|Could not find .* in the schema cache/i.test(
        profileUpsertError.message || ''
      )
    ) {
      freelancerProfileReady = true;
    }
  } catch {
    // Ignore profile bootstrap exceptions to avoid blocking auth.
  }

  return json(res, 200, {
    success: true,
    account_ready: true,
    users_row_ready: usersRowReady,
    freelancer_profile_ready: freelancerProfileReady,
    message: 'Account is ready',
  });
}
