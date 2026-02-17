/**
 * Server-side error handling utilities for API endpoints
 */

import { serverLogger } from './logger.js';

/**
 * Standard JSON response helper
 */
export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

/**
 * Error response helper with logging
 */
export const errorResponse = (res, status, message, error = null, context = {}) => {
  const errorId = `err-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  // Log error with context
  serverLogger.error(message, {
    errorId,
    status,
    ...context,
  }, error);

  // Return sanitized error response (don't leak stack traces in production)
  const response = {
    error: message,
    errorId,
  };

  // Include details only in development
  if (process.env.NODE_ENV !== 'production' && error) {
    response.details = error.message;
    if (error.stack) {
      response.stack = error.stack.split('\n');
    }
  }

  json(res, status, response);
};

/**
 * Wrap async handler with error catching
 */
export const asyncHandler = (handler) => {
  return async (req, res) => {
    const requestLogger = serverLogger.withRequest(req);
    
    try {
      requestLogger.info('Request started');
      const startTime = Date.now();
      
      await handler(req, res, requestLogger);
      
      const duration = Date.now() - startTime;
      requestLogger.info('Request completed', { duration, status: res.statusCode });
    } catch (error) {
      requestLogger.error('Request failed', {}, error);
      
      // Send error response if not already sent
      if (!res.headersSent) {
        errorResponse(
          res,
          error.statusCode || 500,
          error.message || 'Internal server error',
          error,
          { url: req.url, method: req.method }
        );
      }
    }
  };
};

/**
 * Validate required environment variables
 */
export const validateEnv = (required = []) => {
  const missing = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    serverLogger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Get header value (handles string or array)
 */
export const getHeader = (req, name) => {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

/**
 * Parse request body
 */
export const parseBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    
    req.on('error', reject);
  });
};

/**
 * Integration point for error tracking service
 * Example: Use this to send errors to Sentry, Datadog, etc.
 */
export const trackError = (error, metadata = {}) => {
  // Log locally
  serverLogger.error('Error tracked', metadata, error);
  
  // Integration point for external error tracking
  // Example: if (process.env.SENTRY_DSN) { Sentry.captureException(error, { extra: metadata }); }
};
