/**
 * Request processing middleware
 * Handles common request processing tasks: parsing, validation, size limits
 */

import { sendBadRequest, sendServerError } from './response.js';
import { parseJsonBody, parseQueryParams } from './validation.js';
import { logger } from './logger.js';

/**
 * Maximum request body size (10MB by default)
 */
const MAX_BODY_SIZE = Number(process.env.MAX_REQUEST_BODY_SIZE) || 10 * 1024 * 1024;

/**
 * Check request body size
 */
const checkBodySize = (req) => {
  const contentLength = req.headers['content-length'];
  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    return {
      valid: false,
      error: `Request body too large. Maximum size: ${MAX_BODY_SIZE} bytes`,
    };
  }
  return { valid: true };
};

/**
 * Parse request body with size validation
 */
export const parseRequestBody = async (req, res) => {
  // Check body size
  const sizeCheck = checkBodySize(req);
  if (!sizeCheck.valid) {
    sendBadRequest(res, sizeCheck.error);
    return null;
  }

  // Parse JSON body
  const result = parseJsonBody(req);
  if (!result.valid) {
    sendBadRequest(res, result.error);
    return null;
  }

  return result.data;
};

/**
 * Extract and parse query parameters
 */
export const getQueryParameters = (req) => {
  return parseQueryParams(req);
};

/**
 * Validate HTTP method
 */
export const validateMethod = (req, res, allowedMethods) => {
  if (!allowedMethods.includes(req.method)) {
    const { sendMethodNotAllowed } = require('./response.js');
    sendMethodNotAllowed(res, allowedMethods);
    return false;
  }
  return true;
};

/**
 * Request middleware wrapper
 * Adds request ID, logging, error handling
 */
export const withRequestMiddleware = (handler) => {
  return async (req, res) => {
    const startTime = Date.now();
    
    // Generate request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    try {
      // Log incoming request
      logger.logRequest(req, { requestId });
      
      // Execute handler
      await handler(req, res);
      
      // Log response
      const duration = Date.now() - startTime;
      logger.logResponse(req, res.statusCode, { 
        requestId,
        duration: `${duration}ms`,
      });
    } catch (error) {
      // Log error
      logger.logError(error, req, { requestId });
      
      // Send error response if not already sent
      if (!res.headersSent) {
        sendServerError(res, 'Internal server error', {
          requestId,
          ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
        });
      }
    }
  };
};

/**
 * Combine multiple middleware functions
 */
export const composeMiddleware = (...middlewares) => {
  return (handler) => {
    return middlewares.reduceRight((next, middleware) => {
      return middleware(next);
    }, handler);
  };
};

/**
 * CORS middleware
 */
export const withCORS = (handler, options = {}) => {
  return async (req, res) => {
    const allowedOrigins = options.origins || 
      (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']);
    
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', options.methods || 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', options.headers || 'Content-Type,Authorization,X-Request-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    
    await handler(req, res);
  };
};

/**
 * Timeout middleware
 */
export const withTimeout = (handler, timeoutMs = 25000) => {
  return async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          method: req.method,
          url: req.url,
          timeout: timeoutMs,
        });
        
        sendServerError(res, 'Request timeout', {
          code: 'TIMEOUT',
          timeout: timeoutMs,
        });
      }
    }, timeoutMs);
    
    try {
      await handler(req, res);
    } finally {
      clearTimeout(timeoutId);
    }
  };
};

/**
 * Content-Type validation middleware
 */
export const withContentTypeValidation = (handler, expectedType = 'application/json') => {
  return async (req, res) => {
    // Skip for GET, DELETE, OPTIONS
    if (['GET', 'DELETE', 'OPTIONS'].includes(req.method)) {
      return handler(req, res);
    }
    
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes(expectedType)) {
      sendBadRequest(res, `Content-Type must be ${expectedType}`);
      return;
    }
    
    await handler(req, res);
  };
};
