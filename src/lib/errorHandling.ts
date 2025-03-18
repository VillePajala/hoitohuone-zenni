import { NextResponse } from 'next/server';

// Define error types for the application
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

// Standard error structure
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  status?: number;
}

// HTTP status codes map based on error type
const errorStatusMap: Record<ErrorType, number> = {
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.VALIDATION]: 400,
  [ErrorType.DATABASE]: 500,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.SERVER]: 500,
  [ErrorType.NETWORK]: 503,
  [ErrorType.UNKNOWN]: 500
};

// Map of user-friendly messages for each error type
const userFriendlyMessages: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: 'Authentication required. Please sign in to continue.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to access this resource.',
  [ErrorType.VALIDATION]: 'Invalid request data. Please check your inputs and try again.',
  [ErrorType.DATABASE]: 'Database operation failed. Please try again later.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Custom error class
export class ApplicationError extends Error implements AppError {
  type: ErrorType;
  code?: string;
  details?: any;
  status: number;

  constructor(params: AppError) {
    super(params.message);
    this.name = 'ApplicationError';
    this.type = params.type;
    this.code = params.code;
    this.details = params.details;
    this.status = params.status || errorStatusMap[params.type];
  }
}

// Helper function to create a specific typed error
export function createError(
  type: ErrorType,
  message?: string,
  details?: any,
  code?: string
): ApplicationError {
  return new ApplicationError({
    type,
    message: message || userFriendlyMessages[type],
    details,
    code
  });
}

// For API routes: Create a standardized error response
export function createErrorResponse(error: Error | AppError | any): NextResponse {
  // Handle ApplicationError
  if (error instanceof ApplicationError) {
    console.error(`[${error.type.toUpperCase()}] ${error.message}`, error.details || '');
    
    return NextResponse.json(
      {
        error: {
          type: error.type,
          message: error.message,
          code: error.code
        }
      },
      { status: error.status }
    );
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Try to determine error type from message
    let type = ErrorType.UNKNOWN;
    let status = 500;
    
    if (error.message.toLowerCase().includes('not found')) {
      type = ErrorType.NOT_FOUND;
      status = 404;
    } else if (error.message.toLowerCase().includes('unauthorized') || 
              error.message.toLowerCase().includes('unauthenticated')) {
      type = ErrorType.AUTHENTICATION;
      status = 401;
    } else if (error.message.toLowerCase().includes('forbidden') || 
              error.message.toLowerCase().includes('permission')) {
      type = ErrorType.AUTHORIZATION;
      status = 403;
    } else if (error.message.toLowerCase().includes('validation') ||
              error.message.toLowerCase().includes('invalid')) {
      type = ErrorType.VALIDATION;
      status = 400;
    } else if (error.message.toLowerCase().includes('database') ||
              error.message.toLowerCase().includes('prisma')) {
      type = ErrorType.DATABASE;
      status = 500;
    }
    
    console.error(`[${type.toUpperCase()}] ${error.message}`);
    
    return NextResponse.json(
      {
        error: {
          type,
          message: userFriendlyMessages[type],
          originalMessage: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      },
      { status }
    );
  }
  
  // Handle unknown error objects
  console.error('[UNKNOWN_ERROR]', error);
  
  return NextResponse.json(
    {
      error: {
        type: ErrorType.UNKNOWN,
        message: userFriendlyMessages[ErrorType.UNKNOWN]
      }
    },
    { status: 500 }
  );
}

// For client side: Format error for display
export function formatErrorForClient(error: any): {
  title: string;
  message: string;
  actionText?: string;
  actionFn?: () => void;
} {
  // Handle ApplicationError
  if (error instanceof ApplicationError) {
    return {
      title: `Error: ${error.type.charAt(0).toUpperCase() + error.type.slice(1)}`,
      message: error.message
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Try to determine error type from message
    let type = ErrorType.UNKNOWN;
    
    if (error.message.toLowerCase().includes('not found')) {
      type = ErrorType.NOT_FOUND;
    } else if (error.message.toLowerCase().includes('unauthorized') || 
              error.message.toLowerCase().includes('unauthenticated')) {
      type = ErrorType.AUTHENTICATION;
    } else if (error.message.toLowerCase().includes('forbidden') || 
              error.message.toLowerCase().includes('permission')) {
      type = ErrorType.AUTHORIZATION;
    } else if (error.message.toLowerCase().includes('validation') ||
              error.message.toLowerCase().includes('invalid')) {
      type = ErrorType.VALIDATION;
    } else if (error.message.toLowerCase().includes('database') ||
              error.message.toLowerCase().includes('prisma')) {
      type = ErrorType.DATABASE;
    }
    
    return {
      title: `Error: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: userFriendlyMessages[type]
    };
  }
  
  // Handle fetch response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number(error.status);
    
    if (status === 401) {
      return {
        title: 'Authentication Required',
        message: userFriendlyMessages[ErrorType.AUTHENTICATION],
        actionText: 'Sign In',
        actionFn: () => window.location.href = '/admin/sign-in'
      };
    }
    
    if (status === 403) {
      return {
        title: 'Access Denied',
        message: userFriendlyMessages[ErrorType.AUTHORIZATION]
      };
    }
    
    if (status === 404) {
      return {
        title: 'Not Found',
        message: userFriendlyMessages[ErrorType.NOT_FOUND]
      };
    }
    
    if (status >= 500) {
      return {
        title: 'Server Error',
        message: userFriendlyMessages[ErrorType.SERVER]
      };
    }
  }
  
  // Handle unknown errors
  return {
    title: 'Unexpected Error',
    message: userFriendlyMessages[ErrorType.UNKNOWN]
  };
}

// Parse API response errors
export async function parseApiError(response: Response): Promise<ApplicationError> {
  let errorData;
  
  try {
    errorData = await response.json();
  } catch (e) {
    // If we can't parse the JSON, just use the status text
    return createError(
      ErrorType.UNKNOWN,
      response.statusText || userFriendlyMessages[ErrorType.UNKNOWN]
    );
  }
  
  // Try to extract error information
  const errorType = (errorData?.error?.type || ErrorType.UNKNOWN) as ErrorType;
  const errorMessage = errorData?.error?.message || userFriendlyMessages[errorType];
  const errorCode = errorData?.error?.code;
  const errorDetails = errorData?.error?.details;
  
  return new ApplicationError({
    type: errorType,
    message: errorMessage,
    code: errorCode,
    details: errorDetails,
    status: response.status
  });
}

// Helper for logging errors consistently
export function logError(error: any, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  
  if (error instanceof ApplicationError) {
    console.error(`${prefix} [${error.type.toUpperCase()}] ${error.message}`, error.details || '');
    return;
  }
  
  if (error instanceof Error) {
    console.error(`${prefix} Error: ${error.message}`, error.stack);
    return;
  }
  
  console.error(`${prefix} Unknown error:`, error);
} 