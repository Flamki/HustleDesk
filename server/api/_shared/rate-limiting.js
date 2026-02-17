/**
 * Enhanced rate limiting with better error handling and multiple strategies
 */

import { checkRateLimitGlobal, getClientIp } from './rate-limit.js';
import { sendRateLimitError } from './response.js';
import { logger } from './logger.js';

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Very restrictive for expensive operations
  STRICT: {
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Moderate for normal authenticated operations
  MODERATE: {
    limit: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Lenient for read operations
  LENIENT: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Public endpoints (by IP)
  PUBLIC: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Custom configurations
  EMAIL_SEND: {
    limit: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
  },
  
  SIGNUP: {
    limit: 6,
    windowMs: 10 * 60 * 1000, // 10 minutes
  },
  
  AUTH: {
    limit: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Apply rate limiting to a request
 * Returns true if request is allowed, false if rate limited (response already sent)
 */
export const applyRateLimit = async (req, res, config, keyPrefix = 'api') => {
  const ip = getClientIp(req);
  const userId = req.userId || 'anon'; // Set by auth middleware if available
  
  const key = `${keyPrefix}:${userId}:${ip}`;
  
  try {
    const result = await checkRateLimitGlobal({
      key,
      limit: config.limit,
      windowMs: config.windowMs,
    });
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(config.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
    
    if (result.store) {
      res.setHeader('X-RateLimit-Store', result.store);
    }
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        ip,
        userId,
        key,
        limit: config.limit,
        windowMs: config.windowMs,
      });
      
      sendRateLimitError(res, result.retryAfterSeconds, {
        limit: config.limit,
        windowMs: config.windowMs,
      });
      
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Rate limiting error', {
      error: error.message,
      key,
    });
    
    // Fail open - allow request if rate limiting fails
    return true;
  }
};

/**
 * Rate limit middleware factory
 * Usage: export default withRateLimit(handler, RATE_LIMIT_CONFIGS.MODERATE)
 */
export const withRateLimit = (handler, config, keyPrefix) => {
  return async (req, res) => {
    const allowed = await applyRateLimit(req, res, config, keyPrefix);
    if (!allowed) {
      return; // Response already sent
    }
    
    await handler(req, res);
  };
};

/**
 * Apply multiple rate limits (e.g., per-IP and per-user)
 */
export const applyMultipleRateLimits = async (req, res, configs) => {
  for (const { config, keyPrefix } of configs) {
    const allowed = await applyRateLimit(req, res, config, keyPrefix);
    if (!allowed) {
      return false;
    }
  }
  return true;
};

/**
 * Get remaining rate limit info without incrementing
 */
export const getRateLimitInfo = async (key, config) => {
  try {
    const result = await checkRateLimitGlobal({
      key,
      limit: config.limit,
      windowMs: config.windowMs,
    });
    
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      retryAfter: result.retryAfterSeconds,
    };
  } catch (error) {
    logger.error('Rate limit info error', { error: error.message });
    return null;
  }
};
