type EnvValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  checks: Record<string, boolean>;
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isLikelySupabaseUrl = (value: string): boolean => {
  if (!isValidHttpUrl(value)) return false;
  return value.includes('.supabase.co');
};

const isLikelySupabaseProxyUrl = (value: string): boolean => {
  if (!isValidHttpUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.pathname.replace(/\/+$/, '').endsWith('/api/sb');
  } catch {
    return false;
  }
};

export const validateEnvironment = (): EnvValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: Record<string, boolean> = {};

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const redirectOrigin = (import.meta.env.VITE_AUTH_REDIRECT_ORIGIN || '').trim();
  const hasStripePrice = Boolean((import.meta.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || '').trim());

  // Critical checks
  checks.supabaseUrl = Boolean(supabaseUrl);
  checks.supabaseAnonKey = Boolean(supabaseAnonKey);
  checks.redirectOrigin = Boolean(redirectOrigin);
  checks.stripePrice = hasStripePrice;

  if (!supabaseUrl) {
    errors.push(
      import.meta.env.PROD
        ? 'Missing VITE_SUPABASE_URL. Set it in Vercel Project Settings -> Environment Variables, then redeploy.'
        : 'Missing VITE_SUPABASE_URL.'
    );
  } else if (!isValidHttpUrl(supabaseUrl)) {
    errors.push('VITE_SUPABASE_URL must be a valid URL.');
  } else if (!isLikelySupabaseUrl(supabaseUrl) && !isLikelySupabaseProxyUrl(supabaseUrl)) {
    warnings.push(
      'VITE_SUPABASE_URL does not look like a Supabase hostname or /api/sb proxy URL. Verify this value is intentional.'
    );
  }

  if (!supabaseAnonKey) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY.');
  } else if (!(supabaseAnonKey.startsWith('sb_publishable_') || supabaseAnonKey.startsWith('eyJ'))) {
    warnings.push('VITE_SUPABASE_ANON_KEY format looks unusual. Verify you are using the public/publishable key.');
  }

  if (!redirectOrigin) {
    warnings.push('VITE_AUTH_REDIRECT_ORIGIN is not set. OAuth redirects will use current browser origin.');
  } else if (!isValidHttpUrl(redirectOrigin)) {
    errors.push('VITE_AUTH_REDIRECT_ORIGIN must be a valid URL (http://localhost:5173 or your production domain).');
  }

  if (import.meta.env.PROD && redirectOrigin && typeof window !== 'undefined') {
    const clean = redirectOrigin.replace(/\/+$/, '');
    const current = window.location.origin.replace(/\/+$/, '');
    if (clean !== current) {
      warnings.push(
        `VITE_AUTH_REDIRECT_ORIGIN (${clean}) does not match current origin (${current}). OAuth may redirect incorrectly.`
      );
    }
  }

  if (!hasStripePrice) {
    warnings.push(
      'VITE_STRIPE_PRICE_ID_PRO_MONTHLY is not set (optional on client). Billing UI will rely on server env only.'
    );
  }

  // Production-specific checks
  if (import.meta.env.PROD) {
    if (redirectOrigin && redirectOrigin.includes('localhost')) {
      errors.push('VITE_AUTH_REDIRECT_ORIGIN should not use localhost in production');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks,
  };
};
