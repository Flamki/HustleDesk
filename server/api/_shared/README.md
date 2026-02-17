# Backend API Utilities Documentation

## Overview

This directory contains production-ready utilities for backend API development. These utilities provide:

- **Centralized error handling** with consistent response formats
- **Structured logging** for debugging and monitoring
- **Authentication middleware** with JWT validation
- **Input validation** to prevent injection attacks
- **Rate limiting** to prevent abuse
- **Database utilities** for safe query execution
- **Security headers** and CORS configuration

## Available Utilities

### 1. Response Utilities (`response.js`)

Standardized response format for all API endpoints.

```javascript
import { sendSuccess, sendError, sendBadRequest, sendUnauthorized } from '../_shared/index.js';

// Success response
sendSuccess(res, { data: 'value' }, { requestId: 'req_123' });

// Error responses
sendBadRequest(res, 'Invalid input');
sendUnauthorized(res, 'Token expired');
sendServerError(res, 'Database connection failed');
```

**Features:**
- Automatic security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Request ID tracking
- Consistent error format
- Stack trace removal in production

### 2. Logging Utility (`logger.js`)

Structured logging with different levels.

```javascript
import { logger } from '../_shared/index.js';

logger.info('User logged in', { userId: '123' });
logger.error('Database query failed', { error: err.message, query: 'SELECT...' });
logger.debug('Processing request', { requestId: 'req_123' });

// Log requests and responses
logger.logRequest(req, { endpoint: '/api/users' });
logger.logResponse(req, 200, { duration: '45ms' });
```

**Log Levels:**
- `ERROR` - System errors and failures
- `WARN` - Warnings and potential issues
- `INFO` - General information (default)
- `DEBUG` - Detailed debugging information

Set level with `LOG_LEVEL` environment variable.

### 3. Authentication Middleware (`auth.js`)

JWT token validation and user authentication.

```javascript
import { authenticate, withAuth } from '../_shared/index.js';

// Manual authentication
const auth = await authenticate(req, res);
if (!auth) return; // Response already sent
const { user, supabase } = auth;

// Or use middleware wrapper
export default withAuth(async (req, res, { user, supabase }) => {
  // Your authenticated handler code
});
```

**Features:**
- Automatic token extraction from Authorization header
- User session validation
- Supabase client with user context
- Permission checking utilities

### 4. Validation Utilities (`validation.js`)

Comprehensive input validation and sanitization.

```javascript
import { 
  sanitizeString,
  validateEmail,
  validateNumber,
  validateRequired,
  validateEnum,
  validateISODate
} from '../_shared/index.js';

// Sanitize inputs
const cleanName = sanitizeString(userInput, 100);

// Validate email
const emailResult = validateEmail(email);
if (!emailResult.valid) {
  return sendBadRequest(res, emailResult.error);
}

// Validate number
const ageResult = validateNumber(age, { min: 0, max: 150 });

// Validate required fields
const reqResult = validateRequired(body, ['name', 'email']);
if (!reqResult.valid) {
  return sendBadRequest(res, reqResult.error);
}

// Validate enum
const statusResult = validateEnum(status, ['active', 'inactive']);
```

**Available Validators:**
- `sanitizeString` - Remove dangerous characters
- `validateEmail` - RFC 5322 email validation
- `validateUrl` - URL format validation
- `validateNumber` - Number with min/max bounds
- `validateStringLength` - String length validation
- `validateRequired` - Required field check
- `validateEnum` - Enum value validation
- `validateArray` - Array validation with item validator
- `validateISODate` - ISO date string validation
- `validateUUID` - UUID format validation

### 5. Rate Limiting (`rate-limiting.js`)

Protect endpoints from abuse and excessive requests.

```javascript
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '../_shared/index.js';

// Apply rate limiting
const allowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE, 'endpoint-name');
if (!allowed) return; // Response already sent

// Available configs:
// - STRICT: 5 requests per minute (expensive operations)
// - MODERATE: 30 requests per minute (normal operations)
// - LENIENT: 100 requests per minute (read operations)
// - PUBLIC: 20 requests per minute (public endpoints)
// - EMAIL_SEND: 3 requests per 10 minutes
// - SIGNUP: 6 requests per 10 minutes
// - AUTH: 10 requests per 5 minutes
```

**Features:**
- In-memory rate limiting with optional Redis (Upstash)
- Automatic rate limit headers
- IP-based and user-based tracking
- Graceful fallback if Redis unavailable

### 6. Database Utilities (`database.js`)

Safe database operations with error handling.

```javascript
import { 
  executeQuery,
  executePaginatedQuery,
  safeInsert,
  safeUpdate,
  safeDelete
} from '../_shared/index.js';

// Execute query with error handling
const result = await executeQuery(
  supabase.from('users').select('*').eq('id', userId),
  { operation: 'fetch_user', userId }
);

if (!result.success) {
  logger.error('Query failed', { error: result.error });
  return sendServerError(res, 'Failed to fetch user');
}

// Paginated query
const paginatedResult = await executePaginatedQuery(
  supabase.from('jobs').select('*').eq('user_id', userId),
  params,
  { operation: 'list_jobs', userId }
);

// Returns: { data, pagination: { limit, offset, total, hasMore } }
```

**Features:**
- Automatic error logging
- Query performance tracking
- Pagination helpers
- Safe CRUD operations

### 7. Environment Validation (`env.js`)

Validate required environment variables on startup.

```javascript
import { initializeEnvironment, isFeatureEnabled } from '../_shared/index.js';

// Validate on startup
const config = initializeEnvironment(); // Throws if invalid

// Check feature availability
if (isFeatureEnabled('stripe')) {
  // Stripe is configured
}

// Available features: 'stripe', 'email', 'rate_limiting', 'ai'
```

### 8. Middleware (`middleware.js`)

Common request processing middleware.

```javascript
import { 
  withRequestMiddleware,
  withCORS,
  withTimeout,
  composeMiddleware
} from '../_shared/index.js';

// Add request tracking
export default withRequestMiddleware(handler);

// Add CORS
export default withCORS(handler);

// Add timeout protection
export default withTimeout(handler, 25000); // 25 seconds

// Combine multiple middleware
export default composeMiddleware(
  withCORS,
  withTimeout,
  withRequestMiddleware
)(handler);
```

## Best Practices

### 1. Always Use New Response Utilities

```javascript
// ✅ Good
import { sendSuccess, sendBadRequest } from '../_shared/index.js';

export default async function handler(req, res) {
  return sendSuccess(res, { data: 'value' });
}

// ❌ Bad (old style)
res.statusCode = 200;
res.end(JSON.stringify({ data: 'value' }));
```

### 2. Always Validate User Input

```javascript
// ✅ Good
import { sanitizeString, validateEmail } from '../_shared/index.js';

const name = sanitizeString(body.name, 100);
const emailResult = validateEmail(body.email);
if (!emailResult.valid) {
  return sendBadRequest(res, emailResult.error);
}

// ❌ Bad (no validation)
const name = body.name;
const email = body.email;
```

### 3. Always Use Authentication

```javascript
// ✅ Good
import { authenticate } from '../_shared/index.js';

const auth = await authenticate(req, res);
if (!auth) return;
const { user, supabase } = auth;

// ❌ Bad (manual token handling)
const token = req.headers.authorization.split(' ')[1];
```

### 4. Always Apply Rate Limiting

```javascript
// ✅ Good
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '../_shared/index.js';

const allowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE);
if (!allowed) return;

// ❌ Bad (no rate limiting)
// Direct processing without rate limiting
```

### 5. Always Use Structured Logging

```javascript
// ✅ Good
import { logger } from '../_shared/index.js';

logger.info('User created', { userId: user.id, email: user.email });
logger.error('Database error', { error: err.message, operation: 'create_user' });

// ❌ Bad (console.log)
console.log('User created:', user.id);
console.error('Error:', err);
```

### 6. Always Use Database Utilities

```javascript
// ✅ Good
import { executeQuery } from '../_shared/index.js';

const result = await executeQuery(query, { operation: 'fetch_data', userId });
if (!result.success) {
  return sendServerError(res, 'Query failed');
}

// ❌ Bad (no error handling)
const { data, error } = await query;
if (error) throw error;
```

## Example: Complete Endpoint

```javascript
import {
  authenticate,
  sendSuccess,
  sendBadRequest,
  sendMethodNotAllowed,
  sendServerError,
  sanitizeString,
  validateRequired,
  validateStringLength,
  logger,
  executeQuery,
  RATE_LIMIT_CONFIGS,
  applyRateLimit,
} from '../_shared/index.js';

export default async function handler(req, res) {
  try {
    // 1. Validate HTTP method
    if (req.method !== 'POST') {
      return sendMethodNotAllowed(res, ['POST']);
    }

    // 2. Apply rate limiting
    const allowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE, 'my-endpoint');
    if (!allowed) return;

    // 3. Authenticate user
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    // 4. Parse and validate input
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const validation = validateRequired(body, ['title', 'description']);
    if (!validation.valid) {
      return sendBadRequest(res, validation.error);
    }

    const title = sanitizeString(body.title, 200);
    const description = sanitizeString(body.description, 2000);

    const lengthCheck = validateStringLength(title, { min: 3, max: 200, name: 'Title' });
    if (!lengthCheck.valid) {
      return sendBadRequest(res, lengthCheck.error);
    }

    // 5. Execute database operation
    const result = await executeQuery(
      supabase.from('items').insert({
        user_id: user.id,
        title,
        description,
      }).select().single(),
      {
        operation: 'create_item',
        userId: user.id,
      }
    );

    if (!result.success) {
      logger.error('Item creation failed', {
        userId: user.id,
        error: result.error,
      });
      return sendServerError(res, 'Failed to create item');
    }

    // 6. Log success
    logger.info('Item created', {
      userId: user.id,
      itemId: result.data.id,
    });

    // 7. Return success response
    return sendSuccess(res, { item: result.data });
  } catch (error) {
    // 8. Handle unexpected errors
    logger.logError(error, req);
    return sendServerError(res, 'Internal server error');
  }
}
```

## Security Checklist

- ✅ All inputs sanitized and validated
- ✅ Rate limiting applied
- ✅ Authentication required
- ✅ Security headers set
- ✅ Error messages don't leak sensitive info
- ✅ Logging for debugging and monitoring
- ✅ Request IDs for tracking
- ✅ Database queries use parameterized queries (via Supabase)
- ✅ CORS properly configured
- ✅ Timeouts to prevent hanging requests

## Monitoring

All utilities include structured logging for easy monitoring:

```javascript
// View logs with context
logger.info('Operation completed', {
  userId: '123',
  operation: 'create_job',
  duration: '45ms',
  result: 'success',
});
```

Set `LOG_LEVEL=DEBUG` for detailed debugging information.

## Performance

- **Rate limiting**: Prevents abuse and DDoS
- **Query optimization**: Execute queries with performance tracking
- **Pagination**: Built-in pagination for large datasets
- **Timeouts**: Automatic timeout protection
- **Caching**: Response headers support caching

## Support

For issues or questions, check:
1. This documentation
2. Individual utility JSDoc comments
3. Example endpoints in `/api`
