/**
 * Server-side environment validation utility
 * Validates all required environment variables for production deployment
 */

const validateUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const validatePresence = (value) => Boolean(value && String(value).trim());

const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Comprehensive environment validation for server
 */
export const validateServerEnvironment = () => {
  const errors = [];
  const warnings = [];
  const checks = {};

  // Core Supabase configuration
  checks.supabaseUrl = validatePresence(process.env.SUPABASE_URL);
  checks.supabaseAnonKey = validatePresence(process.env.SUPABASE_ANON_KEY);
  checks.supabaseServiceRoleKey = validatePresence(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  );

  if (!checks.supabaseUrl) {
    errors.push('SUPABASE_URL is required');
  } else if (!validateUrl(process.env.SUPABASE_URL)) {
    errors.push('SUPABASE_URL must be a valid URL');
  }

  if (!checks.supabaseAnonKey) {
    errors.push('SUPABASE_ANON_KEY is required');
  }

  if (!checks.supabaseServiceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) is required');
  }

  // Health check token (recommended)
  checks.healthCheckToken = validatePresence(process.env.HEALTHCHECK_TOKEN);
  if (!checks.healthCheckToken) {
    warnings.push('HEALTHCHECK_TOKEN is not set - health endpoint will be publicly accessible');
  }

  // Billing configuration (optional but required for billing features)
  checks.stripe = {
    secretKey: validatePresence(process.env.STRIPE_SECRET_KEY),
    webhookSecret: validatePresence(process.env.STRIPE_WEBHOOK_SECRET),
    priceId: validatePresence(process.env.STRIPE_PRICE_ID_PRO_MONTHLY),
  };

  if (!checks.stripe.secretKey || !checks.stripe.webhookSecret) {
    warnings.push('Stripe configuration incomplete - billing features will be disabled');
  }

  // Email configuration (optional but required for email features)
  checks.email = {
    resendApiKey: validatePresence(process.env.RESEND_API_KEY),
    fromEmail: validatePresence(process.env.MARKETING_FROM_EMAIL),
    fromName: validatePresence(process.env.MARKETING_FROM_NAME),
  };

  if (!checks.email.resendApiKey) {
    warnings.push('RESEND_API_KEY not set - email marketing features will be disabled');
  }

  if (checks.email.fromEmail && !validateEmail(process.env.MARKETING_FROM_EMAIL)) {
    warnings.push('MARKETING_FROM_EMAIL should be a valid email address');
  }

  // Rate limiting configuration (optional but recommended)
  checks.rateLimiting = {
    upstashUrl: validatePresence(process.env.UPSTASH_REDIS_REST_URL),
    upstashToken: validatePresence(process.env.UPSTASH_REDIS_REST_TOKEN),
  };

  const hasPartialRedis = checks.rateLimiting.upstashUrl !== checks.rateLimiting.upstashToken;
  if (hasPartialRedis) {
    warnings.push('Redis configuration incomplete - both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for global rate limiting');
  }

  if (!checks.rateLimiting.upstashUrl && !checks.rateLimiting.upstashToken) {
    warnings.push('Redis not configured - using in-memory rate limiting (not suitable for multi-instance deployments)');
  }

  // AI features (optional)
  checks.geminiApiKey = validatePresence(process.env.GEMINI_API_KEY);
  if (!checks.geminiApiKey) {
    warnings.push('GEMINI_API_KEY not set - AI features will be disabled');
  }

  // Base URLs
  checks.appBaseUrl = validatePresence(process.env.APP_BASE_URL);
  checks.publicAppUrl = validatePresence(process.env.PUBLIC_APP_URL);

  if (!checks.appBaseUrl) {
    warnings.push('APP_BASE_URL not set - may cause issues with redirects and webhooks');
  }

  if (checks.appBaseUrl && !validateUrl(process.env.APP_BASE_URL)) {
    errors.push('APP_BASE_URL must be a valid URL');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Validate required environment variables for a specific feature
 */
export const validateFeatureEnv = (feature, required = []) => {
  const missing = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`${feature} requires environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Get environment info (safe for logging)
 */
export const getEnvInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasSupabase: Boolean(process.env.SUPABASE_URL),
    hasStripe: Boolean(process.env.STRIPE_SECRET_KEY),
    hasResend: Boolean(process.env.RESEND_API_KEY),
    hasRedis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
  };
};
