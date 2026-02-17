import {
  authenticate,
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendMethodNotAllowed,
  sendServerError,
  parseQueryParams,
  validateStringLength,
  validateNumber,
  validateISODate,
  sanitizeString,
  logger,
  executePaginatedQuery,
  executeQuery,
  RATE_LIMIT_CONFIGS,
  applyRateLimit,
} from '../_shared/index.js';

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizePayload = (body) => {
  const client = sanitizeString(body.client, 200);
  const project = sanitizeString(body.project, 200);
  const description = sanitizeString(body.description, 2000);
  
  const startTimeValidation = validateISODate(body.startTime);
  const endTimeValidation = validateISODate(body.endTime);
  
  const hourlyRate = toNum(body.hourlyRate, 0);
  const currency = sanitizeString(body.currency || 'USD', 10) || 'USD';
  const durationSeconds = Math.max(0, Math.floor(toNum(body.durationSeconds, 0)));
  const earnings = Math.max(0, toNum(body.earnings, 0));
  const jobId = body.jobId ? String(body.jobId) : null;

  return {
    client,
    project,
    description,
    startTime: startTimeValidation.valid ? startTimeValidation.date : null,
    endTime: endTimeValidation.valid ? endTimeValidation.date : null,
    hourlyRate,
    currency,
    durationSeconds,
    earnings,
    jobId,
  };
};

const validatePayload = (payload) => {
  const errors = [];

  // Validate required fields
  if (!payload.client) {
    errors.push('Client is required');
  } else {
    const validation = validateStringLength(payload.client, { min: 1, max: 200, name: 'Client' });
    if (!validation.valid) errors.push(validation.error);
  }

  if (!payload.project) {
    errors.push('Project is required');
  } else {
    const validation = validateStringLength(payload.project, { min: 1, max: 200, name: 'Project' });
    if (!validation.valid) errors.push(validation.error);
  }

  // Validate times
  if (!payload.startTime || !payload.endTime) {
    errors.push('Valid start and end time are required');
  } else if (new Date(payload.endTime).getTime() < new Date(payload.startTime).getTime()) {
    errors.push('End time must be after start time');
  }

  // Validate duration
  const durationValidation = validateNumber(payload.durationSeconds, { min: 1, max: 86400 * 365 }); // max 1 year in seconds
  if (!durationValidation.valid) {
    errors.push('Duration: ' + durationValidation.error);
  }

  // Validate hourly rate
  if (payload.hourlyRate !== null) {
    const rateValidation = validateNumber(payload.hourlyRate, { min: 0, max: 100000 });
    if (!rateValidation.valid) {
      errors.push('Hourly rate: ' + rateValidation.error);
    }
  }

  // Validate earnings
  if (payload.earnings !== null) {
    const earningsValidation = validateNumber(payload.earnings, { min: 0, max: 10000000 });
    if (!earningsValidation.valid) {
      errors.push('Earnings: ' + earningsValidation.error);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
};

const handleList = async (req, res) => {
  // Apply rate limiting
  const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.LENIENT, 'time-entries:list');
  if (!rateLimitAllowed) return;

  // Authenticate
  const auth = await authenticate(req, res);
  if (!auth) return;

  const { user, supabase } = auth;

  const params = parseQueryParams(req);
  
  // Validate date filters
  let from = null;
  let to = null;
  
  if (params.from) {
    const fromValidation = validateISODate(params.from);
    if (!fromValidation.valid) {
      return sendBadRequest(res, 'Invalid from date');
    }
    from = fromValidation.date;
  }
  
  if (params.to) {
    const toValidation = validateISODate(params.to);
    if (!toValidation.valid) {
      return sendBadRequest(res, 'Invalid to date');
    }
    to = toValidation.date;
  }

  // Build query
  let query = supabase
    .from('time_entries')
    .select('*', { count: 'estimated' })
    .eq('user_id', user.id);

  if (from) {
    query = query.gte('start_time', from);
  }
  if (to) {
    query = query.lte('start_time', to);
  }

  query = query.order('start_time', { ascending: false });

  // Execute paginated query
  const result = await executePaginatedQuery(query, params, {
    operation: 'list_time_entries',
    userId: user.id,
  });

  if (!result.success) {
    logger.error('Time entries listing failed', {
      userId: user.id,
      error: result.error,
    });
    return sendServerError(res, 'Failed to fetch time entries');
  }

  return sendSuccess(res, {
    entries: result.data,
    pagination: result.pagination,
  });
};

const handleCreate = async (req, res) => {
  // Apply rate limiting
  const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE, 'time-entries:create');
  if (!rateLimitAllowed) return;

  // Authenticate
  const auth = await authenticate(req, res);
  if (!auth) return;

  const { user, supabase } = auth;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const payload = normalizePayload(body);
  const validation = validatePayload(payload);
  
  if (!validation.valid) {
    logger.warn('Time entry creation validation failed', {
      userId: user.id,
      errors: validation.errors,
    });
    return sendBadRequest(res, validation.errors.join(', '));
  }

  const insertPayload = {
    user_id: user.id,
    job_id: payload.jobId,
    client: payload.client,
    project: payload.project,
    description: payload.description,
    start_time: payload.startTime,
    end_time: payload.endTime,
    duration_seconds: payload.durationSeconds,
    hourly_rate: payload.hourlyRate,
    currency: payload.currency,
    earnings: payload.earnings,
  };

  const result = await executeQuery(
    supabase.from('time_entries').insert(insertPayload).select('*').single(),
    {
      operation: 'create_time_entry',
      userId: user.id,
    }
  );

  if (!result.success) {
    logger.error('Time entry creation failed', {
      userId: user.id,
      error: result.error,
    });
    return sendServerError(res, 'Failed to create time entry');
  }

  logger.info('Time entry created', {
    userId: user.id,
    entryId: result.data.id,
  });

  return sendCreated(res, { entry: result.data });
};

const handleUpdate = async (req, res) => {
  // Apply rate limiting
  const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE, 'time-entries:update');
  if (!rateLimitAllowed) return;

  // Authenticate
  const auth = await authenticate(req, res);
  if (!auth) return;

  const { user, supabase } = auth;

  const params = parseQueryParams(req);
  const id = sanitizeString(params.id || '', 100);
  
  if (!id) {
    return sendBadRequest(res, 'id is required');
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const payload = normalizePayload(body);
  const validation = validatePayload(payload);
  
  if (!validation.valid) {
    logger.warn('Time entry update validation failed', {
      userId: user.id,
      entryId: id,
      errors: validation.errors,
    });
    return sendBadRequest(res, validation.errors.join(', '));
  }

  const updatePayload = {
    job_id: payload.jobId,
    client: payload.client,
    project: payload.project,
    description: payload.description,
    start_time: payload.startTime,
    end_time: payload.endTime,
    duration_seconds: payload.durationSeconds,
    hourly_rate: payload.hourlyRate,
    currency: payload.currency,
    earnings: payload.earnings,
  };

  const result = await executeQuery(
    supabase
      .from('time_entries')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single(),
    {
      operation: 'update_time_entry',
      userId: user.id,
      entryId: id,
    }
  );

  if (!result.success) {
    logger.error('Time entry update failed', {
      userId: user.id,
      entryId: id,
      error: result.error,
    });
    return sendServerError(res, 'Failed to update time entry');
  }

  if (!result.data) {
    return sendBadRequest(res, 'Time entry not found or access denied');
  }

  logger.info('Time entry updated', {
    userId: user.id,
    entryId: id,
  });

  return sendSuccess(res, { entry: result.data });
};

const handleDelete = async (req, res) => {
  // Apply rate limiting
  const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.MODERATE, 'time-entries:delete');
  if (!rateLimitAllowed) return;

  // Authenticate
  const auth = await authenticate(req, res);
  if (!auth) return;

  const { user, supabase } = auth;

  const params = parseQueryParams(req);
  const id = sanitizeString(params.id || '', 100);
  
  if (!id) {
    return sendBadRequest(res, 'id is required');
  }

  const result = await executeQuery(
    supabase
      .from('time_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id),
    {
      operation: 'delete_time_entry',
      userId: user.id,
      entryId: id,
    }
  );

  if (!result.success) {
    logger.error('Time entry deletion failed', {
      userId: user.id,
      entryId: id,
      error: result.error,
    });
    return sendServerError(res, 'Failed to delete time entry');
  }

  logger.info('Time entry deleted', {
    userId: user.id,
    entryId: id,
  });

  return sendSuccess(res, { message: 'Time entry deleted successfully' });
};

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await handleList(req, res);
    if (req.method === 'POST') return await handleCreate(req, res);
    if (req.method === 'PATCH') return await handleUpdate(req, res);
    if (req.method === 'DELETE') return await handleDelete(req, res);
    return sendMethodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
  } catch (error) {
    logger.logError(error, req);
    return sendServerError(res, 'Internal server error');
  }
}
