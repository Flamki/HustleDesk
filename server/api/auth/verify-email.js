import { createClient } from '@supabase/supabase-js';
import { secureJson } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const json = secureJson;

/**
 * GET /api/auth/verify-email?token=xxx&type=signup
 * Verifies email confirmation tokens.
 * This is typically called by Supabase's email confirmation link.
 */
export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  // Check environment configuration
  if (!url || !anonKey) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }

  // Parse query parameters
  const tokenHash = String(req.query?.token_hash || req.query?.token || '').trim();
  const type = String(req.query?.type || '').trim().toLowerCase();
  const allowedTypes = new Set(['signup', 'recovery', 'invite', 'email_change', 'magiclink', 'email']);

  if (!tokenHash || tokenHash.length > 1000 || !/^[A-Za-z0-9._-]+$/.test(tokenHash) || !allowedTypes.has(type)) {
    return json(res, 400, { error: 'Invalid token or type parameters' });
  }

  // Create Supabase client
  const supabase = createClient(url, anonKey);

  try {
    // Verify the token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === 'email' ? 'email' : type,
    });

    if (error) {
      console.error('Email verification error:', error.message);
      return json(res, 400, {
        error: 'Invalid or expired verification token',
      });
    }

    if (!data.user) {
      return json(res, 400, { error: 'Verification failed' });
    }

    return json(res, 200, {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null,
      },
    });
  } catch (err) {
    console.error('Email verification exception:', err);
    return json(res, 500, { error: 'Failed to verify email. Please try again.' });
  }
}
