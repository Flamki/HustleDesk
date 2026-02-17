import { createClient } from '@supabase/supabase-js';
import {
  sendSuccess,
  sendServerError,
  sendUnauthorized,
  sendMethodNotAllowed,
  logger,
  getEnvironmentInfo,
} from '../_shared/index.js';

const getHeader = (req, name) => {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

/**
 * Health check endpoint with comprehensive environment and connectivity validation
 * Protected by optional HEALTHCHECK_TOKEN for security
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  // Optional token-based authentication for health checks
  const expectedToken = process.env.HEALTHCHECK_TOKEN || '';
  if (expectedToken) {
    const providedToken =
      getHeader(req, 'x-health-token') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
    if (providedToken !== expectedToken) {
      logger.warn('Health check unauthorized attempt', {
        hasToken: !!providedToken,
      });
      return sendUnauthorized(res, 'Invalid health check token');
    }
  }

  // Validate environment
  const envInfo = getEnvironmentInfo();
  if (!envInfo.valid) {
    logger.error('Health check failed - environment invalid', {
      errors: envInfo.errors,
    });
    return sendServerError(res, 'Environment configuration invalid', {
      errors: envInfo.errors,
      features: envInfo.features,
    });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const checks = {
    environment: true,
    users_table_access: false,
    auth_admin_access: false,
  };

  // Check database access
  try {
    const { error } = await serviceClient
      .from('users')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    
    checks.users_table_access = !error;
    
    if (error) {
      logger.error('Health check - users table access failed', {
        error: error.message,
        code: error.code,
      });
      return sendServerError(res, 'Database connectivity failed', {
        checks,
        detail: error.message,
      });
    }
  } catch (err) {
    logger.error('Health check - users table exception', {
      error: err instanceof Error ? err.message : 'unknown error',
    });
    return sendServerError(res, 'Database connectivity exception', {
      checks,
      detail: err instanceof Error ? err.message : 'unknown error',
    });
  }

  // Check auth admin access
  try {
    const { error } = await serviceClient.auth.admin.listUsers({ 
      page: 1, 
      perPage: 1,
    });
    
    checks.auth_admin_access = !error;
    
    if (error) {
      logger.error('Health check - auth admin access failed', {
        error: error.message,
      });
      return sendServerError(res, 'Auth admin connectivity failed', {
        checks,
        detail: error.message,
      });
    }
  } catch (err) {
    logger.error('Health check - auth admin exception', {
      error: err instanceof Error ? err.message : 'unknown error',
    });
    return sendServerError(res, 'Auth admin connectivity exception', {
      checks,
      detail: err instanceof Error ? err.message : 'unknown error',
    });
  }

  logger.info('Health check passed', { checks });

  return sendSuccess(res, {
    ok: true,
    status: 'healthy',
    checks,
    features: envInfo.features,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
