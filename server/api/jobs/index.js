import {
  authenticate,
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendMethodNotAllowed,
  sendServerError,
  parseQueryParams,
  validateEnum,
  validateStringLength,
  validateNumber,
  sanitizeString,
  sanitizeSearchQuery,
  logger,
  executePaginatedQuery,
  executeQuery,
  RATE_LIMIT_CONFIGS,
  applyRateLimit,
} from '../_shared/index.js';

const VALID_PLATFORMS = ['upwork', 'fiverr', 'linkedin', 'other'];
const VALID_STATUSES = ['saved', 'applied', 'replied', 'won', 'lost'];

/**
 * Validate job creation payload
 */
const validateJobPayload = (body) => {
  const errors = [];

  // Validate title
  const title = sanitizeString(body.title, 500);
  const titleValidation = validateStringLength(title, { min: 1, max: 500, name: 'Title' });
  if (!titleValidation.valid) {
    errors.push(titleValidation.error);
  }

  // Validate platform
  const platform = String(body.platform || '').toLowerCase();
  const platformValidation = validateEnum(platform, VALID_PLATFORMS, 'Platform');
  if (!platformValidation.valid) {
    errors.push(platformValidation.error);
  }

  // Validate description
  const description = sanitizeString(body.description, 10000);
  const descValidation = validateStringLength(description, { min: 50, max: 10000, name: 'Description' });
  if (!descValidation.valid) {
    errors.push(descValidation.error);
  }

  // Validate budget range
  const budgetMin = body.budgetMin != null ? Number(body.budgetMin) : null;
  const budgetMax = body.budgetMax != null ? Number(body.budgetMax) : null;

  if (budgetMin !== null) {
    const minValidation = validateNumber(budgetMin, { min: 0, max: 1000000000 });
    if (!minValidation.valid) {
      errors.push('Budget min: ' + minValidation.error);
    }
  }

  if (budgetMax !== null) {
    const maxValidation = validateNumber(budgetMax, { min: 0, max: 1000000000 });
    if (!maxValidation.valid) {
      errors.push('Budget max: ' + maxValidation.error);
    }
  }

  if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin) {
    errors.push('Budget max must be greater than budget min');
  }

  // Validate proposed price
  const proposedPrice = body.proposedPrice != null ? Number(body.proposedPrice) : null;
  if (proposedPrice !== null) {
    const priceValidation = validateNumber(proposedPrice, { min: 0, max: 1000000000 });
    if (!priceValidation.valid) {
      errors.push('Proposed price: ' + priceValidation.error);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      title,
      platform,
      description,
      company: sanitizeString(body.company || '', 200),
      budgetMin,
      budgetMax,
      proposedPrice,
      currency: sanitizeString(body.currency || 'INR', 10) || 'INR',
    },
  };
};

/**
 * Handle job creation
 */
const handleCreate = async (req, res) => {
  // Apply rate limiting
  const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE, 'jobs:create');
  if (!rateLimitAllowed) return;

  // Authenticate
  const auth = await authenticate(req, res);
  if (!auth) return;

  const { user, supabase } = auth;

  // Parse and validate body
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const validation = validateJobPayload(body);

  if (!validation.valid) {
    logger.warn('Job creation validation failed', {
      userId: user.id,
      errors: validation.errors,
    });
    return sendBadRequest(res, validation.errors.join(', '));
  }

  const { data: validData } = validation;

  // Insert job
  const payload = {
    user_id: user.id,
    title: validData.title,
    platform: validData.platform,
    company: validData.company || null,
    job_description: validData.description,
    budget_min: validData.budgetMin,
    budget_max: validData.budgetMax,
    proposed_price: validData.proposedPrice,
    currency: validData.currency,
    status: 'saved',
  };

  const result = await executeQuery(
    supabase.from('jobs').insert(payload).select('id').single(),
    {
      operation: 'create_job',
      userId: user.id,
    }
  );

  if (!result.success) {
    logger.error('Job creation failed', {
      userId: user.id,
      error: result.error,
    });
    return sendServerError(res, 'Failed to create job');
  }

  logger.info('Job created successfully', {
    userId: user.id,
    jobId: result.data.id,
  });

  return sendCreated(res, {
    job_id: result.data.id,
    message: 'Job created successfully',
  });
};

/**
 * Handle job listing with filters and pagination
 */
const handleList = async (req, res) => {
  // Apply rate limiting (more lenient for reads)
  const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.LENIENT, 'jobs:list');
  if (!rateLimitAllowed) return;

  // Authenticate
  const auth = await authenticate(req, res);
  if (!auth) return;

  const { user, supabase } = auth;

  // Parse query parameters
  const params = parseQueryParams(req);
  const status = params.status ? String(params.status).toLowerCase() : null;
  const platform = params.platform ? String(params.platform).toLowerCase() : null;
  const search = params.search ? String(params.search).trim() : '';

  // Validate filters
  if (status) {
    const statusValidation = validateEnum(status, VALID_STATUSES, 'Status');
    if (!statusValidation.valid) {
      return sendBadRequest(res, statusValidation.error);
    }
  }

  if (platform) {
    const platformValidation = validateEnum(platform, VALID_PLATFORMS, 'Platform');
    if (!platformValidation.valid) {
      return sendBadRequest(res, platformValidation.error);
    }
  }

  // Build base query
  let query = supabase
    .from('jobs')
    .select(
      'id,user_id,title,company,platform,budget_min,budget_max,currency,proposed_price,status,followup_date,applied_at,closed_at,created_at,notes',
      { count: 'estimated' }
    )
    .eq('user_id', user.id);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  // Apply search filter (sanitized)
  if (search) {
    const safeSearch = sanitizeSearchQuery(search, 120);
    if (safeSearch) {
      query = query.or(`title.ilike.%${safeSearch}%,job_description.ilike.%${safeSearch}%`);
    }
  }

  // Order by creation date
  query = query.order('created_at', { ascending: false });

  // Execute paginated query
  const result = await executePaginatedQuery(query, params, {
    operation: 'list_jobs',
    userId: user.id,
    filters: { status, platform, search: !!search },
  });

  if (!result.success) {
    logger.error('Job listing failed', {
      userId: user.id,
      error: result.error,
    });
    return sendServerError(res, 'Failed to fetch jobs');
  }

  logger.debug('Jobs listed successfully', {
    userId: user.id,
    count: result.data.length,
    total: result.pagination.total,
  });

  return sendSuccess(res, {
    jobs: result.data,
    pagination: result.pagination,
  });
};

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') return await handleCreate(req, res);
    if (req.method === 'GET') return await handleList(req, res);
    return sendMethodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    logger.logError(error, req);
    return sendServerError(res, 'Internal server error');
  }
}
