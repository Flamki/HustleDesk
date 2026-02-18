/**
 * Server-side logging utility for API endpoints
 * Provides structured logging for backend operations
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class ServerLogger {
  constructor() {
    this.minLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  formatEntry(level, message, context, error) {
    const timestamp = new Date().toISOString();
    const parts = [`[${timestamp}]`, `[${level.toUpperCase()}]`, message];

    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context));
    }

    if (error) {
      parts.push(`\nError: ${error.message}`);
      if (error.stack) {
        parts.push(error.stack);
      }
    }

    return parts.join(' ');
  }

  log(level, message, context = {}, error = null) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatEntry(level, message, context, error);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // Integration point for external logging services (Sentry, Datadog, etc.)
    // Example: if (process.env.SENTRY_DSN && level === 'error') { Sentry.captureException(error); }
  }

  debug(message, context) {
    this.log('debug', message, context);
  }

  info(message, context) {
    this.log('info', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  error(message, context, error) {
    this.log('error', message, context, error);
  }

  /**
   * Create a request-specific logger with request context
   */
  withRequest(req) {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const method = req.method;
    const url = req.url;

    return {
      debug: (message, context = {}) => this.debug(message, { requestId, method, url, ...context }),
      info: (message, context = {}) => this.info(message, { requestId, method, url, ...context }),
      warn: (message, context = {}) => this.warn(message, { requestId, method, url, ...context }),
      error: (message, context = {}, error = null) => this.error(message, { requestId, method, url, ...context }, error),
    };
  }
}

// Export singleton instance
const serverLogger = new ServerLogger();

export { serverLogger };
