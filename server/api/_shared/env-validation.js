/**
 * Environment variable validation and security checks
 */

/**
 * Validate required environment variables
 * @param {string[]} requiredVars - Array of required variable names
 * @returns {{valid: boolean, missing: string[]}}
 */
export const validateRequiredEnvVars = (requiredVars) => {
  const missing = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Validate Supabase configuration
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateSupabaseConfig = () => {
  const errors = [];
  
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url) {
    errors.push('Missing SUPABASE_URL or VITE_SUPABASE_URL');
  } else if (!url.startsWith('https://') || !url.includes('supabase')) {
    errors.push('Invalid SUPABASE_URL format');
  }
  
  if (!anonKey) {
    errors.push('Missing SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
  } else if (anonKey.length < 100) {
    errors.push('SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  // Service role key should only be checked server-side
  if (typeof window === 'undefined') {
    if (!serviceRoleKey) {
      errors.push('Missing SUPABASE_SERVICE_ROLE_KEY (required for server operations)');
    } else if (serviceRoleKey.length < 100) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
    }
    
    // Check that anon key and service role key are different
    if (anonKey && serviceRoleKey && anonKey === serviceRoleKey) {
      errors.push('SECURITY: Anon key and service role key should be different!');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Stripe configuration
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateStripeConfig = () => {
  const errors = [];
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!secretKey) {
    errors.push('Missing STRIPE_SECRET_KEY');
  } else if (!secretKey.startsWith('sk_')) {
    errors.push('Invalid STRIPE_SECRET_KEY format (should start with sk_)');
  } else if (secretKey.startsWith('sk_test_')) {
    console.warn('[SECURITY WARNING] Using Stripe test key in production');
  }
  
  if (!webhookSecret) {
    errors.push('Missing STRIPE_WEBHOOK_SECRET (required for webhook validation)');
  } else if (!webhookSecret.startsWith('whsec_')) {
    errors.push('Invalid STRIPE_WEBHOOK_SECRET format (should start with whsec_)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check for common security misconfigurations
 * @returns {{issues: string[], warnings: string[]}}
 */
export const checkSecurityConfig = () => {
  const issues = [];
  const warnings = [];
  
  // Check for default/weak values
  const healthToken = process.env.HEALTHCHECK_TOKEN;
  if (!healthToken) {
    warnings.push('HEALTHCHECK_TOKEN not set - health endpoint is unprotected');
  } else if (healthToken.length < 32) {
    warnings.push('HEALTHCHECK_TOKEN is too short (recommend 32+ characters)');
  } else if (/^(test|demo|password|secret|admin|123)/.test(healthToken.toLowerCase())) {
    issues.push('SECURITY: HEALTHCHECK_TOKEN appears to be a weak/default value');
  }
  
  // Check for production configuration
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    const appBaseUrl = process.env.APP_BASE_URL || process.env.VITE_AUTH_REDIRECT_ORIGIN;
    if (!appBaseUrl) {
      warnings.push('APP_BASE_URL not set in production');
    } else if (appBaseUrl.includes('localhost') || appBaseUrl.includes('127.0.0.1')) {
      issues.push('SECURITY: Production environment using localhost URL');
    }
  }
  
  // Check Upstash configuration
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && !upstashToken) {
    warnings.push('UPSTASH_REDIS_REST_URL set but UPSTASH_REDIS_REST_TOKEN missing');
  } else if (!upstashUrl && upstashToken) {
    warnings.push('UPSTASH_REDIS_REST_TOKEN set but UPSTASH_REDIS_REST_URL missing');
  } else if (!upstashUrl && !upstashToken) {
    warnings.push('Upstash not configured - using in-memory rate limiting (not recommended for production)');
  }
  
  return { issues, warnings };
};

/**
 * Run all environment validations
 * @returns {{valid: boolean, supabase: object, stripe: object, security: object}}
 */
export const validateEnvironment = () => {
  const supabase = validateSupabaseConfig();
  const stripe = validateStripeConfig();
  const security = checkSecurityConfig();
  
  const allErrors = [
    ...supabase.errors,
    ...stripe.errors,
    ...security.issues,
  ];
  
  return {
    valid: allErrors.length === 0,
    supabase,
    stripe,
    security,
  };
};

/**
 * Log environment validation results
 * @param {object} validation - Result from validateEnvironment()
 */
export const logValidationResults = (validation) => {
  if (!validation.valid) {
    console.error('[ENV VALIDATION] Configuration errors found:');
    if (validation.supabase.errors.length > 0) {
      console.error('  Supabase:', validation.supabase.errors);
    }
    if (validation.stripe.errors.length > 0) {
      console.error('  Stripe:', validation.stripe.errors);
    }
    if (validation.security.issues.length > 0) {
      console.error('  Security:', validation.security.issues);
    }
  }
  
  if (validation.security.warnings.length > 0) {
    console.warn('[ENV VALIDATION] Configuration warnings:');
    validation.security.warnings.forEach(w => console.warn('  -', w));
  }
  
  if (validation.valid && validation.security.warnings.length === 0) {
    console.log('[ENV VALIDATION] All environment variables validated successfully');
  }
};
