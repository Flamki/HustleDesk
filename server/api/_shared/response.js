/**
 * Centralized response utility for consistent API responses
 * Ensures all endpoints return a standardized response format
 */

import { logger } from './logger.js';

/**
 * Generate a unique request ID for tracking
 */
export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Set common security headers on all responses
 */
const setSecurityHeaders = (res) => {
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers (adjust based on needs)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Content Security Policy (basic, adjust as needed)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
};

/**
 * Send a standardized JSON response
 */
export const sendResponse = (res, statusCode, data, meta = {}) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  setSecurityHeaders(res);
  
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  
  res.end(JSON.stringify(response));
};

/**
 * Send a success response (200)
 */
export const sendSuccess = (res, data, meta = {}) => {
  sendResponse(res, 200, data, meta);
};

/**
 * Send a created response (201)
 */
export const sendCreated = (res, data, meta = {}) => {
  sendResponse(res, 201, data, meta);
};

/**
 * Send an error response with proper formatting
 */
export const sendError = (res, statusCode, errorMessage, details = {}) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  setSecurityHeaders(res);
  
  const errorResponse = {
    success: false,
    error: {
      message: errorMessage,
      code: details.code || `ERR_${statusCode}`,
      ...details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: details.requestId,
    },
  };
  
  // Remove stack traces in production and staging
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    // Never expose stack traces in production or staging
  } else if (details.stack) {
    errorResponse.error.stack = details.stack;
  }
  
  res.end(JSON.stringify(errorResponse));
};

/**
 * Send bad request error (400)
 */
export const sendBadRequest = (res, message = 'Bad request', details = {}) => {
  sendError(res, 400, message, { code: 'BAD_REQUEST', ...details });
};

/**
 * Send unauthorized error (401)
 */
export const sendUnauthorized = (res, message = 'Unauthorized', details = {}) => {
  sendError(res, 401, message, { code: 'UNAUTHORIZED', ...details });
};

/**
 * Send forbidden error (403)
 */
export const sendForbidden = (res, message = 'Forbidden', details = {}) => {
  sendError(res, 403, message, { code: 'FORBIDDEN', ...details });
};

/**
 * Send not found error (404)
 */
export const sendNotFound = (res, message = 'Resource not found', details = {}) => {
  sendError(res, 404, message, { code: 'NOT_FOUND', ...details });
};

/**
 * Send method not allowed error (405)
 */
export const sendMethodNotAllowed = (res, allowedMethods = [], details = {}) => {
  res.setHeader('Allow', allowedMethods.join(', '));
  sendError(res, 405, 'Method not allowed', { 
    code: 'METHOD_NOT_ALLOWED',
    allowedMethods,
    ...details 
  });
};

/**
 * Send rate limit error (429)
 */
export const sendRateLimitError = (res, retryAfter, details = {}) => {
  res.setHeader('Retry-After', String(retryAfter));
  sendError(res, 429, 'Too many requests', { 
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
    ...details 
  });
};

/**
 * Send internal server error (500)
 */
export const sendServerError = (res, message = 'Internal server error', details = {}) => {
  sendError(res, 500, message, { code: 'INTERNAL_SERVER_ERROR', ...details });
};

/**
 * Send service unavailable error (503)
 */
export const sendServiceUnavailable = (res, message = 'Service temporarily unavailable', details = {}) => {
  sendError(res, 503, message, { code: 'SERVICE_UNAVAILABLE', ...details });
};

/**
 * Catch-all error handler with logging
 */
export const handleError = (error, req, res, requestId) => {
  logger.logError(error, req, { requestId });
  
  // Determine appropriate status code
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (error.statusCode) {
    statusCode = error.statusCode;
  }
  
  if (error.message && process.env.NODE_ENV !== 'production') {
    message = error.message;
  }
  
  sendError(res, statusCode, message, { 
    requestId,
    ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
  });
};

/**
 * Legacy compatibility - maps to new response system
 */
export const json = (res, status, body) => {
  // If body has 'error' field, send as error
  if (body && body.error) {
    sendError(res, status, body.error, { legacy: true });
  } else {
    sendResponse(res, status, body, { legacy: true });
  }
};
