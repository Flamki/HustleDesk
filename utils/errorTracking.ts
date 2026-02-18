/**
 * Error tracking utility with integration points for error monitoring services
 * Compatible with services like Sentry, Rollbar, Datadog, etc.
 */

import { logger, type LogContext } from './logger';

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export type ErrorMetadata = {
  severity?: ErrorSeverity;
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
};

export type ErrorTrackingConfig = {
  enabled: boolean;
  dsn?: string;
  environment?: string;
  release?: string;
  beforeSend?: (error: Error, metadata: ErrorMetadata) => boolean;
  onError?: (error: Error, metadata: ErrorMetadata) => void | Promise<void>;
};

class ErrorTracker {
  private config: ErrorTrackingConfig;

  constructor() {
    this.config = {
      enabled: import.meta.env.PROD,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
    };
  }

  /**
   * Initialize error tracking with configuration
   * Call this early in your app initialization
   */
  init(config: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...config };

    // Set up global error handlers
    if (this.config.enabled) {
      this.setupGlobalHandlers();
    }
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          {
            severity: 'error',
            tags: { type: 'unhandled_rejection' },
          }
        );
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message), {
          severity: 'error',
          tags: { 
            type: 'global_error',
            filename: event.filename,
            lineno: String(event.lineno),
            colno: String(event.colno),
          },
        });
      });
    }
  }

  /**
   * Capture an exception with metadata
   */
  captureException(error: Error, metadata: ErrorMetadata = {}): void {
    if (!this.config.enabled) {
      // In development, just log to console
      logger.error('Error captured', { ...metadata.extra }, error);
      return;
    }

    // Allow filtering with beforeSend hook
    if (this.config.beforeSend && !this.config.beforeSend(error, metadata)) {
      return;
    }

    // Log locally
    logger.error(error.message, {
      severity: metadata.severity || 'error',
      userId: metadata.userId,
      tags: metadata.tags,
      ...metadata.extra,
    }, error);

    // Integration point for external error tracking
    // Example: Sentry.captureException(error, { level: metadata.severity, user: { id: metadata.userId }, tags: metadata.tags, extra: metadata.extra });
    if (this.config.onError) {
      try {
        this.config.onError(error, metadata);
      } catch (err) {
        // Fail silently to avoid error tracking loop
        console.error('Error tracking handler failed:', err);
      }
    }
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, metadata: ErrorMetadata = {}): void {
    if (!this.config.enabled) {
      logger.info(message, metadata.extra as LogContext);
      return;
    }

    logger.info(message, {
      severity: metadata.severity || 'info',
      userId: metadata.userId,
      tags: metadata.tags,
      ...metadata.extra,
    });

    // Integration point for external error tracking
    // Example: Sentry.captureMessage(message, { level: metadata.severity, user: { id: metadata.userId }, tags: metadata.tags, extra: metadata.extra });
    if (this.config.onError) {
      try {
        this.config.onError(new Error(message), metadata);
      } catch (err) {
        console.error('Error tracking handler failed:', err);
      }
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string | null, userData?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    // Integration point for external error tracking
    // Example: Sentry.setUser(userId ? { id: userId, ...userData } : null);
    logger.debug('User context set', { userId, ...userData });
  }

  /**
   * Add breadcrumb for context
   */
  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    // Integration point for external error tracking
    // Example: Sentry.addBreadcrumb({ message, category, data, timestamp: Date.now() });
    logger.debug('Breadcrumb added', { message, category, ...data });
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Export class for testing
export { ErrorTracker };
