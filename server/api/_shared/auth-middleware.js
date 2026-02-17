/**
 * Authentication middleware for API endpoints
 */
import { createClient } from '@supabase/supabase-js';
import { logSecurityEvent } from './security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Extract Bearer token from Authorization header
 * @param {object} req - Request object
 * @returns {string|null} Token or null
 */
export const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7).trim();
  
  // Basic token format validation
  if (!token || token.length < 20 || token.length > 2000) {
    return null;
  }
  
  return token;
};

/**
 * Verify user authentication via Supabase
 * @param {string} token - JWT token
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
export const verifyAuth = async (token) => {
  if (!token || !url || !anonKey) {
    return { user: null, error: { message: 'Invalid configuration' } };
  }
  
  try {
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    
    const { data: { user }, error } = await authClient.auth.getUser();
    
    if (error) {
      logSecurityEvent({
        type: 'AUTH_VERIFICATION_FAILED',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (err) {
    logSecurityEvent({
      type: 'AUTH_VERIFICATION_ERROR',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
    return { user: null, error: err };
  }
};

/**
 * Require authentication middleware
 * Returns 401 if authentication fails
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
export const requireAuth = async (req, res) => {
  const token = extractBearerToken(req);
  
  if (!token) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized - Missing or invalid token' }));
    return { user: null, error: { message: 'No token provided' } };
  }
  
  const { user, error } = await verifyAuth(token);
  
  if (error || !user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized - Invalid credentials' }));
    return { user: null, error };
  }
  
  return { user, error: null };
};

/**
 * Optional authentication - doesn't fail if no auth provided
 * @param {object} req - Request object
 * @returns {Promise<{user: object|null}>}
 */
export const optionalAuth = async (req) => {
  const token = extractBearerToken(req);
  
  if (!token) {
    return { user: null };
  }
  
  const { user } = await verifyAuth(token);
  return { user };
};

/**
 * Check if user has admin privileges
 * @param {object} user - User object from Supabase
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user) return false;
  
  // Check user metadata for admin role
  return user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
};

/**
 * Require admin middleware
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {Promise<{user: object|null, isAdmin: boolean}>}
 */
export const requireAdmin = async (req, res) => {
  const { user, error } = await requireAuth(req, res);
  
  if (error || !user) {
    return { user: null, isAdmin: false };
  }
  
  if (!isAdmin(user)) {
    logSecurityEvent({
      type: 'UNAUTHORIZED_ADMIN_ACCESS',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
    
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Forbidden - Admin access required' }));
    return { user, isAdmin: false };
  }
  
  return { user, isAdmin: true };
};
