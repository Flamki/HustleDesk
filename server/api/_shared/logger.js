/**
 * Centralized logging utility for backend operations
 * Provides structured logging with different levels and context
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const shouldLog = (level) => {
  const envLevel = process.env.LOG_LEVEL || 'INFO';
  const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  return levels.indexOf(level) <= levels.indexOf(envLevel);
};

const formatLog = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // In production, this could be sent to a logging service (e.g., Datadog, CloudWatch)
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // Development-friendly format
  return `[${timestamp}] ${level}: ${message} ${Object.keys(context).length ? JSON.stringify(context) : ''}`;
};

export const logger = {
  error: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatLog(LOG_LEVELS.ERROR, message, context));
    }
  },

  warn: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatLog(LOG_LEVELS.WARN, message, context));
    }
  },

  info: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info(formatLog(LOG_LEVELS.INFO, message, context));
    }
  },

  debug: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(formatLog(LOG_LEVELS.DEBUG, message, context));
    }
  },

  /**
   * Log API request with metadata
   */
  logRequest: (req, context = {}) => {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      ...context,
    });
  },

  /**
   * Log API response with metadata
   */
  logResponse: (req, statusCode, context = {}) => {
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode,
      ...context,
    });
  },

  /**
   * Log error with full context
   */
  logError: (error, req, context = {}) => {
    logger.error('API Error', {
      message: error.message,
      stack: error.stack,
      method: req?.method,
      url: req?.url,
      ...context,
    });
  },
};
