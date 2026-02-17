type EnvValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
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

export const validateEnvironment = (): EnvValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const redirectOrigin = (import.meta.env.VITE_AUTH_REDIRECT_ORIGIN || '').trim();
  const hasStripePrice = Boolean((import.meta.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || '').trim());

  if (!supabaseUrl) {
    errors.push('Missing VITE_SUPABASE_URL.');
  } else if (!isLikelySupabaseUrl(supabaseUrl)) {
    errors.push('VITE_SUPABASE_URL must be a valid Supabase URL (https://<project-ref>.supabase.co).');
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

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
};
