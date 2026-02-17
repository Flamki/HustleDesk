/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger.js';

/**
 * Required environment variables for core functionality
 */
const REQUIRED_ENV_VARS = {
  // Supabase (required for all backend operations)
  SUPABASE_URL: { required: true, type: 'url' },
  SUPABASE_ANON_KEY: { required: true, type: 'string' },
  SUPABASE_SERVICE_ROLE_KEY: { required: true, type: 'string', secret: true },
  
  // Vite-exposed Supabase (required for frontend)
  VITE_SUPABASE_URL: { required: true, type: 'url' },
  VITE_SUPABASE_ANON_KEY: { required: true, type: 'string' },
};

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  // Application
  NODE_ENV: { default: 'development', type: 'enum', values: ['development', 'production', 'test'] },
  LOG_LEVEL: { default: 'INFO', type: 'enum', values: ['ERROR', 'WARN', 'INFO', 'DEBUG'] },
  APP_BASE_URL: { default: 'http://localhost:5173', type: 'url' },
  
  // Auth
  VITE_AUTH_REDIRECT_ORIGIN: { default: 'http://localhost:5173', type: 'url' },
  HEALTHCHECK_TOKEN: { type: 'string', secret: true },
  
  // Stripe (optional, for payments)
  STRIPE_SECRET_KEY: { type: 'string', secret: true },
  STRIPE_WEBHOOK_SECRET: { type: 'string', secret: true },
  STRIPE_PRICE_ID_PRO_MONTHLY: { type: 'string' },
  VITE_STRIPE_PRICE_ID_PRO_MONTHLY: { type: 'string' },
  
  // Email marketing (optional)
  RESEND_API_KEY: { type: 'string', secret: true },
  MARKETING_FROM_EMAIL: { type: 'email' },
  MARKETING_FROM_NAME: { type: 'string' },
  PUBLIC_APP_URL: { type: 'url' },
  
  // Rate limiting (optional)
  UPSTASH_REDIS_REST_URL: { type: 'url' },
  UPSTASH_REDIS_REST_TOKEN: { type: 'string', secret: true },
  
  // AI (optional)
  GEMINI_API_KEY: { type: 'string', secret: true },
  
  // Security
  ALLOWED_ORIGINS: { default: 'http://localhost:5173', type: 'string' },
};

/**
 * Validate URL format
 */
const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate email format
 */
const isValidEmail = (str) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
};

/**
 * Validate environment variable based on type
 */
const validateEnvVar = (name, value, config) => {
  if (!value) {
    if (config.required) {
      return { valid: false, error: `${name} is required but not set` };
    }
    return { valid: true, value: config.default || null };
  }

  // Type validation
  switch (config.type) {
    case 'url':
      if (!isValidUrl(value)) {
        return { valid: false, error: `${name} must be a valid URL` };
      }
      break;
    
    case 'email':
      if (!isValidEmail(value)) {
        return { valid: false, error: `${name} must be a valid email` };
      }
      break;
    
    case 'enum':
      if (config.values && !config.values.includes(value)) {
        return { 
          valid: false, 
          error: `${name} must be one of: ${config.values.join(', ')}`,
        };
      }
      break;
    
    case 'number':
      if (isNaN(Number(value))) {
        return { valid: false, error: `${name} must be a number` };
      }
      break;
    
    default:
      // 'string' type - no additional validation needed
      break;
  }

  return { valid: true, value };
};

/**
 * Validate all environment variables
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  const config = {};

  // Validate required variables
  for (const [name, varConfig] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[name];
    const result = validateEnvVar(name, value, varConfig);
    
    if (!result.valid) {
      errors.push(result.error);
    } else {
      config[name] = result.value;
    }
  }

  // Validate optional variables
  for (const [name, varConfig] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[name];
    const result = validateEnvVar(name, value, varConfig);
    
    if (!result.valid) {
      warnings.push(result.error);
    } else if (result.value) {
      config[name] = result.value;
    }
  }

  return { valid: errors.length === 0, errors, warnings, config };
};

/**
 * Check if specific feature is enabled based on env vars
 */
export const isFeatureEnabled = (feature) => {
  switch (feature) {
    case 'stripe':
      return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    
    case 'email':
      return !!(process.env.RESEND_API_KEY && process.env.MARKETING_FROM_EMAIL);
    
    case 'rate_limiting':
      return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    
    case 'ai':
      return !!process.env.GEMINI_API_KEY;
    
    default:
      return false;
  }
};

/**
 * Get safe environment info (without secrets) for debugging
 */
export const getEnvironmentInfo = () => {
  const validation = validateEnvironment();
  
  const safeConfig = {};
  for (const [key, value] of Object.entries(validation.config)) {
    const varConfig = REQUIRED_ENV_VARS[key] || OPTIONAL_ENV_VARS[key];
    
    if (varConfig?.secret) {
      safeConfig[key] = value ? '[REDACTED]' : null;
    } else {
      safeConfig[key] = value || null;
    }
  }

  return {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    features: {
      stripe: isFeatureEnabled('stripe'),
      email: isFeatureEnabled('email'),
      rateLimiting: isFeatureEnabled('rate_limiting'),
      ai: isFeatureEnabled('ai'),
    },
    config: safeConfig,
  };
};

/**
 * Initialize and validate environment on startup
 */
export const initializeEnvironment = () => {
  const result = validateEnvironment();
  
  if (!result.valid) {
    logger.error('Environment validation failed', { errors: result.errors });
    throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
  }
  
  if (result.warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings: result.warnings });
  }
  
  logger.info('Environment validated successfully', {
    features: {
      stripe: isFeatureEnabled('stripe'),
      email: isFeatureEnabled('email'),
      rateLimiting: isFeatureEnabled('rate_limiting'),
      ai: isFeatureEnabled('ai'),
    },
  });
  
  return result.config;
};
