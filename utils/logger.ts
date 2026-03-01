/**
 * Centralized logging utility for GetSoloDesk
 * Provides structured logging with consistent formatting and integration points for external logging services
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  userId?: string;
  requestId?: string;
  route?: string;
  action?: string;
  [key: string]: unknown;
};

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
};

type LoggerConfig = {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteHandler?: (entry: LogEntry) => void | Promise<void>;
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: import.meta.env.PROD ? 'info' : 'debug',
      enableConsole: true,
      enableRemote: import.meta.env.PROD,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    if (entry.error) {
      parts.push(`\nError: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(entry.error.stack);
      }
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    // Console logging
    if (this.config.enableConsole) {
      const formatted = this.formatEntry(entry);
      
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
    }

    // Remote logging (integration point for services like Sentry, Datadog, etc.)
    if (this.config.enableRemote && this.config.remoteHandler) {
      try {
        this.config.remoteHandler(entry);
      } catch (err) {
        // Fail silently to avoid logging loop
        console.error('Remote logging handler failed:', err);
      }
    }
  }

  /**
   * Log debug information (development only by default)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log errors
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Update logger configuration at runtime
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing or custom instances
export { Logger };

