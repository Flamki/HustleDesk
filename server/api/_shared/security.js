/**
 * Security utilities for API endpoints
 */

/**
 * Sanitize string input to prevent injection attacks
 * @param {string} input - Raw input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input, maxLength = 1000) => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except common whitespace
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
};

/**
 * Sanitize email input
 * @param {string} email - Email address
 * @returns {string|null} Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  const sanitized = String(email).trim().toLowerCase();
  
  // Basic email validation
  if (sanitized.length > 254 || sanitized.length < 3) return null;
  if (!sanitized.includes('@')) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return null;
  
  return sanitized;
};

/**
 * Sanitize URL input
 * @param {string} url - URL string
 * @returns {string|null} Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};

/**
 * Validate and sanitize numeric input
 * @param {any} input - Input value
 * @param {object} options - Validation options
 * @returns {number|null} Validated number or null
 */
export const sanitizeNumber = (input, { min, max, allowFloat = false } = {}) => {
  const num = allowFloat ? parseFloat(input) : parseInt(input, 10);
  
  if (isNaN(num) || !isFinite(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  
  return num;
};

/**
 * Validate slug format (alphanumeric + hyphens)
 * @param {string} slug - Slug string
 * @returns {string|null} Validated slug or null
 */
export const sanitizeSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return null;
  
  const sanitized = slug.trim().toLowerCase();
  
  // Only allow alphanumeric characters and hyphens, 1-100 chars
  if (!/^[a-z0-9-]{1,100}$/.test(sanitized)) return null;
  // Don't allow leading/trailing hyphens or consecutive hyphens
  if (/^-|-$|--/.test(sanitized)) return null;
  
  return sanitized;
};

/**
 * Detect honeypot spam submissions
 * @param {object} body - Request body
 * @param {string} honeypotField - Name of honeypot field (should be empty)
 * @returns {boolean} True if spam detected
 */
export const detectHoneypot = (body, honeypotField = 'website') => {
  return Boolean(body && String(body[honeypotField] || '').trim());
};

/**
 * Validate JSON body structure
 * @param {string} body - Raw body string
 * @returns {object|null} Parsed JSON or null
 */
export const parseJsonBody = (body) => {
  if (!body) return {};
  if (typeof body === 'object') return body;
  
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

/**
 * Check for suspicious patterns in user input
 * @param {string} input - User input
 * @returns {boolean} True if suspicious patterns detected
 */
export const detectSuspiciousPatterns = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  // SQL injection patterns
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)|(-{2})|(\bOR\b.*=.*)|(\bAND\b.*=.*)/i;
  
  // XSS patterns
  const xssPatterns = /<script|javascript:|onerror=|onload=|<iframe|eval\(|expression\(/i;
  
  // Command injection patterns
  const cmdPatterns = /[;&|`$(){}[\]\\]/;
  
  return sqlPatterns.test(input) || xssPatterns.test(input) || cmdPatterns.test(input);
};

/**
 * Log security events (can be extended to send to monitoring service)
 * @param {object} event - Security event details
 */
export const logSecurityEvent = (event) => {
  const timestamp = new Date().toISOString();
  console.warn('[SECURITY]', timestamp, JSON.stringify(event));
};

/**
 * Generate security headers for API responses
 * @returns {object} Headers object
 */
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
};

/**
 * Set CORS headers based on origin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {string[]} allowedOrigins - List of allowed origins
 */
export const setCorsHeaders = (req, res, allowedOrigins = []) => {
  const origin = req.headers.origin || req.headers.referer;
  
  if (!origin) return;
  
  // Default to same-origin if no allowed origins specified
  if (allowedOrigins.length === 0) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    allowedOrigins = [requestUrl.origin];
  }
  
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.endsWith('*')) {
      const prefix = allowed.slice(0, -1);
      return origin.startsWith(prefix);
    }
    return origin === allowed;
  });
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
};
