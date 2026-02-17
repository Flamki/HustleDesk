/**
 * Centralized exports for all shared utilities
 * Use this to import utilities in API handlers
 */

// Response utilities
export {
  sendResponse,
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendMethodNotAllowed,
  sendRateLimitError,
  sendServerError,
  sendServiceUnavailable,
  handleError,
  generateRequestId,
  json, // Legacy compatibility
} from './response.js';

// Logging
export { logger } from './logger.js';

// Authentication
export {
  authenticate,
  withAuth,
  hasPermission,
  getServiceClient,
} from './auth.js';

// Validation
export {
  sanitizeString,
  validateEmail,
  validateUrl,
  validateNumber,
  validateStringLength,
  validateRequired,
  validateEnum,
  validateArray,
  validateISODate,
  validateUUID,
  parseJsonBody,
  parseQueryParams,
  validatePagination,
  validateIdentifier,
  sanitizeSearchQuery,
} from './validation.js';

// Environment
export {
  validateEnvironment,
  isFeatureEnabled,
  getEnvironmentInfo,
  initializeEnvironment,
} from './env.js';

// Rate limiting
export {
  RATE_LIMIT_CONFIGS,
  applyRateLimit,
  withRateLimit,
  applyMultipleRateLimits,
  getRateLimitInfo,
} from './rate-limiting.js';

// Rate limit primitives (backward compatibility)
export {
  checkRateLimit,
  checkRateLimitGlobal,
  getClientIp,
} from './rate-limit.js';

// Middleware
export {
  parseRequestBody,
  getQueryParameters,
  validateMethod,
  withRequestMiddleware,
  composeMiddleware,
  withCORS,
  withTimeout,
  withContentTypeValidation,
} from './middleware.js';

// Database
export {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  executeQuery,
  buildPaginatedQuery,
  executePaginatedQuery,
  safeInsert,
  safeUpdate,
  safeDelete,
  recordExists,
  buildSearchQuery,
  buildFilterQuery,
  batchOperation,
} from './database.js';
