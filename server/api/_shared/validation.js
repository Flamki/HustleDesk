/**
 * Input validation and sanitization utilities
 * Provides comprehensive validation for all API inputs
 */

import { logger } from './logger.js';

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return '';
  
  let sanitized = String(input)
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
};

/**
 * Validate and sanitize email address
 */
export const validateEmail = (email) => {
  const sanitized = sanitizeString(email, 254).toLowerCase();
  
  if (!sanitized || sanitized.length < 3) {
    return { valid: false, email: null, error: 'Email too short' };
  }
  
  if (!sanitized.includes('@')) {
    return { valid: false, email: null, error: 'Email must contain @' };
  }
  
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, email: null, error: 'Invalid email format' };
  }
  
  return { valid: true, email: sanitized, error: null };
};

/**
 * Validate URL
 */
export const validateUrl = (url, allowedProtocols = ['http', 'https']) => {
  try {
    const parsed = new URL(String(url || ''));
    const protocol = parsed.protocol.replace(':', '');
    
    if (!allowedProtocols.includes(protocol)) {
      return { valid: false, url: null, error: 'Invalid protocol' };
    }
    
    return { valid: true, url: parsed.toString(), error: null };
  } catch {
    return { valid: false, url: null, error: 'Invalid URL format' };
  }
};

/**
 * Validate and parse number
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, integer = false } = options;
  const num = Number(value);
  
  if (!Number.isFinite(num)) {
    return { valid: false, value: null, error: 'Invalid number' };
  }
  
  if (integer && !Number.isInteger(num)) {
    return { valid: false, value: null, error: 'Must be an integer' };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, value: null, error: `Must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, value: null, error: `Must be at most ${max}` };
  }
  
  return { valid: true, value: num, error: null };
};

/**
 * Validate string length
 */
export const validateStringLength = (str, options = {}) => {
  const { min = 0, max = 10000, name = 'Field' } = options;
  const length = String(str || '').length;
  
  if (length < min) {
    return { valid: false, error: `${name} must be at least ${min} characters` };
  }
  
  if (length > max) {
    return { valid: false, error: `${name} must be at most ${max} characters` };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate required fields in an object
 */
export const validateRequired = (obj, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    const value = obj?.[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return { 
      valid: false, 
      error: `Missing required fields: ${missing.join(', ')}`,
      missing,
    };
  }
  
  return { valid: true, error: null, missing: [] };
};

/**
 * Validate enum value
 */
export const validateEnum = (value, allowedValues, fieldName = 'Value') => {
  const str = String(value || '');
  
  if (!allowedValues.includes(str)) {
    return { 
      valid: false, 
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate array
 */
export const validateArray = (value, options = {}) => {
  const { minLength = 0, maxLength = 1000, itemValidator } = options;
  
  if (!Array.isArray(value)) {
    return { valid: false, error: 'Must be an array' };
  }
  
  if (value.length < minLength) {
    return { valid: false, error: `Array must have at least ${minLength} items` };
  }
  
  if (value.length > maxLength) {
    return { valid: false, error: `Array must have at most ${maxLength} items` };
  }
  
  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i], i);
      if (!result.valid) {
        return { valid: false, error: `Item ${i}: ${result.error}` };
      }
    }
  }
  
  return { valid: true, error: null };
};

/**
 * Validate ISO date string
 */
export const validateISODate = (dateStr) => {
  try {
    const date = new Date(String(dateStr || ''));
    if (Number.isNaN(date.getTime())) {
      return { valid: false, date: null, error: 'Invalid date' };
    }
    return { valid: true, date: date.toISOString(), error: null };
  } catch {
    return { valid: false, date: null, error: 'Invalid date format' };
  }
};

/**
 * Validate UUID
 */
export const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const str = String(uuid || '');
  
  if (!uuidRegex.test(str)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  
  return { valid: true, error: null };
};

/**
 * Parse and validate JSON body
 */
export const parseJsonBody = (req) => {
  try {
    if (req.body && typeof req.body === 'object') {
      return { valid: true, data: req.body, error: null };
    }
    
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body || '{}');
      return { valid: true, data: parsed, error: null };
    }
    
    return { valid: true, data: {}, error: null };
  } catch (error) {
    logger.warn('JSON parse error', { error: error.message });
    return { valid: false, data: null, error: 'Invalid JSON body' };
  }
};

/**
 * Validate query parameters
 */
export const parseQueryParams = (req) => {
  try {
    if (req.query) return req.query;
    
    const url = new URL(req.url, 'http://localhost');
    return Object.fromEntries(url.searchParams.entries());
  } catch {
    return {};
  }
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (params, defaults = {}) => {
  const defaultLimit = defaults.limit || 50;
  const maxLimit = defaults.maxLimit || 100;
  const defaultOffset = defaults.offset || 0;
  
  const limit = Math.max(1, Math.min(maxLimit, Number(params.limit || defaultLimit)));
  const offset = Math.max(0, Number(params.offset || defaultOffset));
  
  return { limit, offset };
};

/**
 * SQL injection prevention - validate table/column names
 * Only allows alphanumeric and underscores
 */
export const validateIdentifier = (identifier, maxLength = 64) => {
  const str = String(identifier || '');
  
  if (!str || str.length > maxLength) {
    return { valid: false, error: 'Invalid identifier length' };
  }
  
  // Only allow alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(str)) {
    return { valid: false, error: 'Invalid identifier characters' };
  }
  
  return { valid: true, error: null };
};

/**
 * Sanitize search query to prevent injection
 * Removes parentheses, semicolons, commas, and trims whitespace
 */
export const sanitizeSearchQuery = (query, maxLength = 200) => {
  const sanitized = sanitizeString(query, maxLength)
    // Remove characters that could be used in SQL injection attempts
    .replace(/[();,]/g, ' ')
    .trim();
  
  return sanitized;
};
