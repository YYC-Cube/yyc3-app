/**
 * Logger Utility - Structured Logging
 *
 * Provides structured logging capabilities with different log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  structured: boolean;
  prefix?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class Logger {
  private config: LoggerConfig;
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | Record<string, any>, context?: Record<string, any>): void {
    let errorContext: Record<string, any> = context || {};

    if (error) {
      if (error instanceof Error) {
        errorContext.error = {
          message: error.message,
          stack: error.stack,
        };
      } else {
        errorContext.error = error;
      }
    }

    this.log('error', message, errorContext);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };

    if (this.config.structured) {
      this.logStructured(entry);
    } else {
      this.logSimple(entry);
    }
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const currentPriority = this.levelPriority[this.config.level];
    const messagePriority = this.levelPriority[level];
    return messagePriority >= currentPriority;
  }

  /**
   * Log in structured JSON format
   */
  private logStructured(entry: LogEntry): void {
    const output = {
      ...(this.config.prefix && { prefix: this.config.prefix }),
      ...entry,
    };

    console.log(JSON.stringify(output));
  }

  /**
   * Log in simple human-readable format
   */
  private logSimple(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const levelTag = level.toUpperCase().padEnd(5);

    let logLine = `${prefix} [${timestamp}] ${levelTag} ${message}`;

    if (context && Object.keys(context).length > 0) {
      logLine += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      logLine += `\nError: ${error.message}`;
      if (error.stack) {
        logLine += `\nStack: ${error.stack}`;
      }
    }

    switch (level) {
      case 'debug':
        console.debug(logLine);
        break;
      case 'info':
        console.info(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      case 'error':
        console.error(logLine);
        break;
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable/disable structured logging
   */
  setStructured(structured: boolean): void {
    this.config.structured = structured;
  }

  /**
   * Check if structured logging is enabled
   */
  isStructured(): boolean {
    return this.config.structured;
  }
}

/**
 * Create a logger instance from environment variables
 */
export function createLogger(): Logger {
  const level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  const structured = process.env.STRUCTURED_LOGGING === 'true';
  const prefix = process.env.LOG_PREFIX || 'PostgreSQL-MCP';

  return new Logger({
    level,
    structured,
    prefix,
  });
}