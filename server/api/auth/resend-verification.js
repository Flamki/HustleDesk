import { createClient } from '@supabase/supabase-js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';
import { secureJson, validateEmail } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const json = secureJson;

/**
 * POST /api/auth/resend-verification
 * Resends email verification link for unconfirmed users.
 * Rate limited to prevent abuse.
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  // Check environment configuration
  if (!url || !anonKey) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }

  // Rate limiting: 3 requests per 15 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimitKey = `resend-verification:${clientIp}`;
  const rateLimit = await checkRateLimitGlobal({
    key: rateLimitKey,
    limit: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimit.allowed) {
    return json(res, 429, {
      error: `Too many resend requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
      retryAfter: rateLimit.retryAfterSeconds,
    });
  }

  // Parse request body
  let email;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    email = body?.email;
  } catch {
    return json(res, 400, { error: 'Invalid request body' });
  }

  // Validate email
  if (!email || !validateEmail(email)) {
    return json(res, 400, { error: 'Invalid email format' });
  }

  // Create Supabase client
  const supabase = createClient(url, anonKey);

  try {
    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.VITE_AUTH_REDIRECT_ORIGIN || 'http://localhost:5173'}/login`,
      },
    });

    if (error) {
      // Don't reveal whether the email exists or not (prevent enumeration)
      console.error('Resend verification error:', error.message);
      
      // Generic success message even if there's an error
      // This prevents account enumeration attacks
      return json(res, 200, {
        success: true,
        message: 'If this email is registered and unverified, a verification link has been sent.',
      });
    }

    return json(res, 200, {
      success: true,
      message: 'If this email is registered and unverified, a verification link has been sent.',
    });
  } catch (err) {
    console.error('Resend verification exception:', err);
    return json(res, 500, { error: 'Failed to resend verification email. Please try again later.' });
  }
}
