/**
 * Database utilities and query helpers
 * Provides common database operations with error handling and optimization
 */

import { logger } from './logger.js';
import { validatePagination } from './validation.js';

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

/**
 * Execute a Supabase query with error handling and logging
 */
export const executeQuery = async (queryBuilder, context = {}) => {
  try {
    const startTime = Date.now();
    const result = await queryBuilder;
    const duration = Date.now() - startTime;
    
    if (result.error) {
      logger.error('Database query error', {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
        ...context,
      });
      
      return {
        success: false,
        data: null,
        error: result.error.message,
        code: result.error.code,
      };
    }
    
    logger.debug('Database query success', {
      duration: `${duration}ms`,
      rowCount: Array.isArray(result.data) ? result.data.length : 1,
      ...context,
    });
    
    return {
      success: true,
      data: result.data,
      error: null,
      count: result.count,
    };
  } catch (error) {
    logger.error('Database query exception', {
      error: error.message,
      stack: error.stack,
      ...context,
    });
    
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Build paginated query
 */
export const buildPaginatedQuery = (baseQuery, params) => {
  const { limit, offset } = validatePagination(params, {
    limit: DEFAULT_PAGE_LIMIT,
    maxLimit: MAX_PAGE_LIMIT,
  });
  
  return {
    query: baseQuery.range(offset, offset + limit - 1),
    pagination: { limit, offset },
  };
};

/**
 * Execute paginated query
 * Note: baseQuery should not have .select() already called on it
 */
export const executePaginatedQuery = async (baseQuery, params, context = {}) => {
  const { limit, offset } = validatePagination(params, {
    limit: DEFAULT_PAGE_LIMIT,
    maxLimit: MAX_PAGE_LIMIT,
  });
  
  // Apply range and count to the query
  const query = baseQuery.range(offset, offset + limit - 1);
  
  const result = await executeQuery(query, {
    ...context,
    pagination: { limit, offset },
  });
  
  if (!result.success) {
    return result;
  }
  
  return {
    success: true,
    data: result.data || [],
    pagination: {
      limit,
      offset,
      total: result.count || 0,
      hasMore: (result.count || 0) > offset + limit,
    },
    error: null,
  };
};

/**
 * Safe insert with conflict handling
 */
export const safeInsert = async (supabase, table, data, options = {}) => {
  try {
    let query = supabase.from(table).insert(data);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.single) {
      query = query.single();
    }
    
    return await executeQuery(query, {
      operation: 'insert',
      table,
    });
  } catch (error) {
    logger.error('Insert operation failed', {
      table,
      error: error.message,
    });
    
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Safe update with conflict handling
 */
export const safeUpdate = async (supabase, table, id, data, userId = null) => {
  try {
    let query = supabase
      .from(table)
      .update(data)
      .eq('id', id);
    
    // Add user_id check if provided (for RLS)
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    query = query.select().single();
    
    return await executeQuery(query, {
      operation: 'update',
      table,
      id,
    });
  } catch (error) {
    logger.error('Update operation failed', {
      table,
      id,
      error: error.message,
    });
    
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Safe delete with conflict handling
 */
export const safeDelete = async (supabase, table, id, userId = null) => {
  try {
    let query = supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    // Add user_id check if provided (for RLS)
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    return await executeQuery(query, {
      operation: 'delete',
      table,
      id,
    });
  } catch (error) {
    logger.error('Delete operation failed', {
      table,
      id,
      error: error.message,
    });
    
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Check if record exists
 */
export const recordExists = async (supabase, table, conditions) => {
  try {
    let query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    
    for (const [key, value] of Object.entries(conditions)) {
      query = query.eq(key, value);
    }
    
    const result = await executeQuery(query, {
      operation: 'exists_check',
      table,
    });
    
    return result.success && (result.count || 0) > 0;
  } catch (error) {
    logger.error('Exists check failed', {
      table,
      error: error.message,
    });
    return false;
  }
};

/**
 * Build search query with text search
 */
export const buildSearchQuery = (baseQuery, searchField, searchTerm, maxLength = 120) => {
  if (!searchTerm) return baseQuery;
  
  // Sanitize search term
  const sanitized = String(searchTerm)
    .trim()
    .slice(0, maxLength)
    .replace(/[(),]/g, ' ')
    .trim();
  
  if (!sanitized) return baseQuery;
  
  // Use ilike for case-insensitive search
  return baseQuery.ilike(searchField, `%${sanitized}%`);
};

/**
 * Build filter query from filter object
 */
export const buildFilterQuery = (baseQuery, filters) => {
  let query = baseQuery;
  
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }
  
  return query;
};

/**
 * Batch operation helper
 */
export const batchOperation = async (items, operation, batchSize = 50) => {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map((item) => operation(item))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push(result.reason);
        }
      }
    } catch (error) {
      logger.error('Batch operation failed', {
        error: error.message,
        batchIndex: i,
      });
      errors.push(error);
    }
  }
  
  return {
    success: errors.length === 0,
    results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
  };
};
