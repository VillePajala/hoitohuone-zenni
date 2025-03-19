/**
 * Auth Logger
 * Specialized logger for authentication-related events
 * Provides consistent formatting and environment-aware logging
 */

import { ErrorType } from './errorHandling';

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4 // For disabling logging entirely
}

interface LogOptions {
  context?: string;
  data?: any;
}

// Set this to change the minimum log level that will be output
// Can be overridden in specific environments
let currentLogLevel = 
  process.env.NODE_ENV === 'production' 
    ? LogLevel.WARN   // Only show warnings and errors in production
    : LogLevel.DEBUG; // Show all logs in development

// Environment check is necessary for SSR compatibility
const isClient = typeof window !== 'undefined';

// Optional local storage key for dynamic log level changes
const LOG_LEVEL_STORAGE_KEY = 'zenni_auth_log_level';

// Read log level from localStorage if available
if (isClient) {
  try {
    const savedLevel = localStorage.getItem(LOG_LEVEL_STORAGE_KEY);
    if (savedLevel !== null) {
      const parsedLevel = parseInt(savedLevel, 10);
      if (!isNaN(parsedLevel) && parsedLevel >= LogLevel.DEBUG && parsedLevel <= LogLevel.NONE) {
        currentLogLevel = parsedLevel;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Helper to format log message with optional context
const formatLogMessage = (message: string, options?: LogOptions): string => {
  if (options?.context) {
    return `[${options.context}] ${message}`;
  }
  return message;
};

// Helper to add console colors to logs
const colorize = (level: LogLevel, message: string): string => {
  if (!isClient) return message; // No colors in Node environment
  
  switch (level) {
    case LogLevel.DEBUG:
      return `%c${message}`;
    case LogLevel.INFO:
      return `%c${message}`;
    case LogLevel.WARN:
      return `%c${message}`;
    case LogLevel.ERROR:
      return `%c${message}`;
    default:
      return message;
  }
};

// Helper to get console color styles
const getColorStyles = (level: LogLevel): string => {
  if (!isClient) return ''; // No colors in Node environment
  
  switch (level) {
    case LogLevel.DEBUG:
      return 'color: #6c757d'; // Gray
    case LogLevel.INFO:
      return 'color: #0d6efd'; // Blue
    case LogLevel.WARN:
      return 'color: #fd7e14; font-weight: bold'; // Orange
    case LogLevel.ERROR:
      return 'color: #dc3545; font-weight: bold'; // Red
    default:
      return '';
  }
};

// Auth logger that handles different log levels and formatting
export const authLogger = {
  // Set minimum log level
  setLevel(level: LogLevel): void {
    currentLogLevel = level;
    // Save to localStorage for persistence if in browser
    if (isClient) {
      try {
        localStorage.setItem(LOG_LEVEL_STORAGE_KEY, level.toString());
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Get current log level
  getLevel(): LogLevel {
    return currentLogLevel;
  },
  
  // Debug level logs (most verbose) - development only
  debug(message: string, options?: LogOptions): void {
    if (currentLogLevel <= LogLevel.DEBUG) {
      const formattedMessage = formatLogMessage(message, options);
      if (isClient) {
        console.debug(colorize(LogLevel.DEBUG, formattedMessage), getColorStyles(LogLevel.DEBUG), options?.data || '');
      } else {
        console.debug(formattedMessage, options?.data || '');
      }
    }
  },
  
  // Information level logs
  info(message: string, options?: LogOptions): void {
    if (currentLogLevel <= LogLevel.INFO) {
      const formattedMessage = formatLogMessage(message, options);
      if (isClient) {
        console.log(colorize(LogLevel.INFO, formattedMessage), getColorStyles(LogLevel.INFO), options?.data || '');
      } else {
        console.log(formattedMessage, options?.data || '');
      }
    }
  },
  
  // Warning level logs
  warn(message: string, options?: LogOptions): void {
    if (currentLogLevel <= LogLevel.WARN) {
      const formattedMessage = formatLogMessage(message, options);
      if (isClient) {
        console.warn(colorize(LogLevel.WARN, formattedMessage), getColorStyles(LogLevel.WARN), options?.data || '');
      } else {
        console.warn(formattedMessage, options?.data || '');
      }
    }
  },
  
  // Error level logs
  error(message: string, options?: LogOptions): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      const formattedMessage = formatLogMessage(message, options);
      if (isClient) {
        console.error(colorize(LogLevel.ERROR, formattedMessage), getColorStyles(LogLevel.ERROR), options?.data || '');
      } else {
        console.error(formattedMessage, options?.data || '');
      }
    }
  },
  
  // Log auth-related errors with proper format and error type
  authError(error: Error | unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.error(`Authentication error: ${errorMessage}`, { 
      context,
      data: {
        error,
        type: ErrorType.AUTHENTICATION
      }
    });
  }
}; 