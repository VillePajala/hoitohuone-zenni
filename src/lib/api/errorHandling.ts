/**
 * API Error Handling Utilities
 * 
 * Provides standardized error handling for API routes, including:
 * - Error types and codes
 * - Consistent error response format
 * - Mapping of error types to HTTP status codes
 * 
 * @deprecated Many of these utilities are being replaced by the newer error handling
 * in @/lib/api/authHandler.ts. Only the ApiError class and ErrorCode enum will be
 * maintained going forward.
 */

import { NextResponse } from 'next/server';
import { log } from './logging';

// Standard error codes
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Map error codes to HTTP status codes
const errorStatusMap: Record<ErrorCode, number> = {
  // Client errors
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  
  // Server errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.NOT_IMPLEMENTED]: 501,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
};

// Default error messages
const defaultErrorMessages: Record<ErrorCode, string> = {
  // Client errors
  [ErrorCode.BAD_REQUEST]: 'The request was malformed or contained invalid parameters.',
  [ErrorCode.UNAUTHORIZED]: 'Authentication is required to access this resource.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.METHOD_NOT_ALLOWED]: 'The HTTP method is not supported for this resource.',
  [ErrorCode.VALIDATION_ERROR]: 'The request data failed validation.',
  [ErrorCode.CONFLICT]: 'The request conflicts with the current state of the resource.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later.',
  
  // Server errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred on the server.',
  [ErrorCode.NOT_IMPLEMENTED]: 'This feature is not yet implemented.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable.',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred.',
};

// Validation error interface
export interface ValidationError {
  errors: Array<{
    path: string[];
    message: string;
  }>;
}

// Check if an object is a validation error
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as any).errors) &&
    (error as any).errors.every((err: any) => 
      'path' in err && 
      Array.isArray(err.path) &&
      'message' in err && 
      typeof err.message === 'string'
    )
  );
}

// API Error class
export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: any;
  
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(message || defaultErrorMessages[code]);
    this.name = 'ApiError';
    this.code = code;
    this.status = errorStatusMap[code];
    this.details = details;
  }
}

/**
 * Create a standard error response
 * @deprecated Use ApiError class and Response.json() instead
 */
export function createErrorResponse(
  error: ApiError | Error | unknown,
  requestId?: string
): NextResponse {
  // Default to internal server error if not an ApiError
  const apiError = error instanceof ApiError 
    ? error 
    : new ApiError(ErrorCode.INTERNAL_SERVER_ERROR);
  
  // Additional error details to include in the response
  let details = apiError.details;
  
  // For validation errors, format the details nicely
  if (isValidationError(error)) {
    apiError.code = ErrorCode.VALIDATION_ERROR;
    apiError.status = errorStatusMap[ErrorCode.VALIDATION_ERROR];
    details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
  }
  
  // Log the error
  log.error(`API Error: ${apiError.message}`, {
    code: apiError.code,
    status: apiError.status,
    details,
    requestId,
    stack: apiError.stack,
  });
  
  // Create the error response
  return NextResponse.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
      }
    },
    { status: apiError.status }
  );
}

/**
 * Handle any error and return a standardized error response
 * @deprecated Use the error handling from authHandler.ts instead
 */
export function handleError(error: unknown, requestId?: string): NextResponse {
  // Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error, requestId);
  }
  
  // Validation errors
  if (isValidationError(error)) {
    return createErrorResponse(error, requestId);
  }
  
  // Known API errors
  if (error instanceof ApiError) {
    return createErrorResponse(error, requestId);
  }
  
  // Generic errors
  if (error instanceof Error) {
    log.exception(error, 'Unhandled error in API route', { requestId });
    return createErrorResponse(
      new ApiError(ErrorCode.INTERNAL_SERVER_ERROR, error.message),
      requestId
    );
  }
  
  // Unknown errors
  log.error('Unknown error type in API route', { 
    error: String(error),
    requestId
  });
  
  return createErrorResponse(
    new ApiError(ErrorCode.INTERNAL_SERVER_ERROR, 'An unexpected error occurred'),
    requestId
  );
}

/**
 * Check if an error is a Prisma error
 */
function isPrismaError(error: any): boolean {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('P')
  );
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: any, requestId?: string): NextResponse {
  let apiError: ApiError;
  
  // Map common Prisma error codes to API errors
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      apiError = new ApiError(
        ErrorCode.CONFLICT,
        'A resource with this identifier already exists.',
        { fields: error.meta?.target }
      );
      break;
      
    case 'P2025': // Record not found
      apiError = new ApiError(
        ErrorCode.NOT_FOUND,
        'The requested resource was not found.'
      );
      break;
      
    case 'P2003': // Foreign key constraint failure
      apiError = new ApiError(
        ErrorCode.BAD_REQUEST,
        'Invalid reference to a related resource.',
        { field: error.meta?.field_name }
      );
      break;
      
    default:
      apiError = new ApiError(
        ErrorCode.DATABASE_ERROR,
        'A database error occurred.',
        { prismaCode: error.code }
      );
      break;
  }
  
  return createErrorResponse(apiError, requestId);
}

/**
 * Return a not found error response
 * @deprecated Use ApiError class and Response.json() instead
 */
export function notFound(message?: string, details?: any): NextResponse {
  return createErrorResponse(
    new ApiError(ErrorCode.NOT_FOUND, message, details)
  );
}

/**
 * Return a validation error response
 * @deprecated Use ApiError class and Response.json() instead
 */
export function validationError(message?: string, details?: any): NextResponse {
  return createErrorResponse(
    new ApiError(ErrorCode.VALIDATION_ERROR, message, details)
  );
}

/**
 * Return an unauthorized error response
 * @deprecated Use ApiError class and Response.json() instead
 */
export function unauthorized(message?: string): NextResponse {
  return createErrorResponse(
    new ApiError(ErrorCode.UNAUTHORIZED, message)
  );
}

/**
 * Return a forbidden error response
 * @deprecated Use ApiError class and Response.json() instead
 */
export function forbidden(message?: string): NextResponse {
  return createErrorResponse(
    new ApiError(ErrorCode.FORBIDDEN, message)
  );
}

/**
 * Return a bad request error response
 * @deprecated Use ApiError class and Response.json() instead
 */
export function badRequest(message?: string, details?: any): NextResponse {
  return createErrorResponse(
    new ApiError(ErrorCode.BAD_REQUEST, message, details)
  );
} 