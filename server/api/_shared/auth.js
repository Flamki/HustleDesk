/**
 * Centralized authentication middleware
 * Handles JWT validation and user session management
 */

import { createClient } from '@supabase/supabase-js';
import { sendUnauthorized, sendServerError } from './response.js';
import { logger } from './logger.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Extract bearer token from authorization header
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

/**
 * Validate authentication and return authenticated user
 * Returns { user, supabase } on success, or null on failure
 */
export const authenticate = async (req, res) => {
  // Check environment configuration
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('Supabase environment not configured', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    sendServerError(res, 'Authentication service not configured');
    return null;
  }

  // Extract and validate token
  const token = extractToken(req);
  if (!token) {
    sendUnauthorized(res, 'Missing authentication token');
    return null;
  }

  // Create authenticated Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.warn('Authentication failed', { 
        error: userError?.message,
        hasUser: !!user,
      });
      sendUnauthorized(res, 'Invalid or expired authentication token');
      return null;
    }

    logger.debug('User authenticated', { userId: user.id });
    return { user, supabase };
  } catch (error) {
    logger.error('Authentication error', { 
      error: error.message,
      stack: error.stack,
    });
    sendServerError(res, 'Authentication verification failed');
    return null;
  }
};

/**
 * Middleware wrapper for authenticated routes
 * Usage: export default withAuth(async (req, res, { user, supabase }) => { ... })
 */
export const withAuth = (handler) => {
  return async (req, res) => {
    const auth = await authenticate(req, res);
    if (!auth) {
      return; // Response already sent by authenticate()
    }
    
    try {
      await handler(req, res, auth);
    } catch (error) {
      logger.logError(error, req);
      sendServerError(res, 'Request processing failed');
    }
  };
};

/**
 * Check if user has specific permission/role
 */
export const hasPermission = async (supabase, userId, permission) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan, role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    // Add permission logic as needed
    // Example: check if user plan includes permission
    return true;
  } catch (error) {
    logger.error('Permission check failed', { 
      userId,
      permission,
      error: error.message,
    });
    return false;
  }
};

/**
 * Service role authentication (for admin/internal operations)
 */
export const getServiceClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
