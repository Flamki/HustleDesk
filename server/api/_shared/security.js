/**
 * Security middleware helpers for API endpoints
 * Applies security headers similar to Helmet.js
 */

/**
 * Apply security headers to response
 * @param {object} res - Response object
 */
export const applySecurityHeaders = (res) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Strict Transport Security (HTTPS only, 1 year)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
};

/**
 * Validate input to prevent injection attacks
 * @param {string} input - Input string to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - True if valid
 */
export const validateInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return false;
  if (input.length === 0 || input.length > maxLength) return false;
  
  // Check for SQL injection patterns
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi;
  if (sqlPatterns.test(input)) return false;
  
  // Check for script injection
  const scriptPatterns = /<script|javascript:|onerror=|onload=/gi;
  if (scriptPatterns.test(input)) return false;
  
  return true;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string' || email.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize error messages to prevent information leakage
 * @param {Error|string} error - Error to sanitize
 * @returns {string} - Safe error message
 */
export const sanitizeError = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  
  // Don't expose internal paths or stack traces
  if (message.includes('ENOENT') || message.includes('EACCES')) {
    return 'Resource not found';
  }
  
  if (message.includes('database') || message.includes('SQL')) {
    return 'Database error occurred';
  }
  
  if (message.includes('SUPABASE') || message.includes('API key')) {
    return 'Configuration error';
  }
  
  // Remove stack traces and file paths
  return message.split('\n')[0].replace(/\/[^\s]+/g, '').trim();
};

/**
 * Create JSON response with security headers
 * @param {object} res - Response object
 * @param {number} status - HTTP status code
 * @param {object} body - Response body
 */
export const secureJson = (res, status, body) => {
  applySecurityHeaders(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};
