/**
 * Structured logging utility for API endpoints
 * 
 * This module provides a consistent interface for logging across the application,
 * with support for different log levels, context data, and formatting.
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log entry format
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

// Current environment
const isProduction = process.env.NODE_ENV === 'production';

// Default minimum log level based on environment
let minimumLogLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG;

/**
 * Configure the logger
 */
export function configureLogger(options: { minimumLevel?: LogLevel }) {
  if (options.minimumLevel) {
    minimumLogLevel = options.minimumLevel;
  }
}

/**
 * Get numeric value for log level for comparison
 */
function getLogLevelValue(level: LogLevel): number {
  switch (level) {
    case LogLevel.DEBUG: return 0;
    case LogLevel.INFO: return 1;
    case LogLevel.WARN: return 2;
    case LogLevel.ERROR: return 3;
    default: return 1;
  }
}

/**
 * Format log entry as JSON string
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Log a message at the specified level if it meets the minimum level threshold
 */
function logAtLevel(level: LogLevel, message: string, context?: Record<string, any>) {
  // Skip if below minimum level
  if (getLogLevelValue(level) < getLogLevelValue(minimumLogLevel)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {})
  };

  const formattedEntry = formatLogEntry(entry);

  // Output to appropriate console method based on level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedEntry);
      break;
    case LogLevel.INFO:
      console.info(formattedEntry);
      break;
    case LogLevel.WARN:
      console.warn(formattedEntry);
      break;
    case LogLevel.ERROR:
      console.error(formattedEntry);
      break;
  }
  
  // In a real-world app, you might also:
  // - Send logs to a service like Datadog, Sentry, or CloudWatch
  // - Write logs to a file
  // - Filter sensitive information
}

// Export public logging interface
export const log = {
  debug: (message: string, context?: Record<string, any>) => 
    logAtLevel(LogLevel.DEBUG, message, context),
  
  info: (message: string, context?: Record<string, any>) => 
    logAtLevel(LogLevel.INFO, message, context),
  
  warn: (message: string, context?: Record<string, any>) => 
    logAtLevel(LogLevel.WARN, message, context),
  
  error: (message: string, context?: Record<string, any>) => 
    logAtLevel(LogLevel.ERROR, message, context),
  
  // Additional utility method for logging errors with stack traces
  exception: (error: unknown, message?: string, context?: Record<string, any>) => {
    const errorObject = error instanceof Error ? error : new Error(String(error));
    const errorContext = {
      ...context,
      error: {
        name: errorObject.name,
        message: errorObject.message,
        stack: errorObject.stack,
      }
    };
    
    logAtLevel(
      LogLevel.ERROR, 
      message || errorObject.message || 'An error occurred', 
      errorContext
    );
  }
}; 