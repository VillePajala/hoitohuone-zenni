/**
 * API Middleware Utilities
 * 
 * Provides middleware functions for API routes:
 * - Authentication and authorization
 * - Request logging
 * - Response formatting
 * - Error handling
 * - Rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from './logging';
import { ApiError, ErrorCode, handleError } from './errorHandling';
import { createSuccessResponse } from './responseFormatting';
import crypto from 'crypto';

export type ApiHandler = (
  request: NextRequest, 
  context?: any
) => Promise<NextResponse> | NextResponse;

export type ApiMiddleware = (
  handler: ApiHandler
) => ApiHandler;

export interface RequestContext {
  requestId: string;
  startTime: number;
  [key: string]: any;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Chain multiple middleware functions
 */
export function composeMiddleware(...middlewares: ApiMiddleware[]): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight((composed, middleware) => {
      return middleware(composed);
    }, handler);
  };
}

/**
 * Generate a request ID and add it to the context
 */
export function withRequestId(): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context = {} as RequestContext) => {
      // Check if request ID already exists in headers
      const requestId = request.headers.get('x-request-id') || generateRequestId();
      
      // Add request ID to context
      context.requestId = requestId;
      
      // Call the next handler
      const response = await handler(request, context);
      
      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      
      return response;
    };
  };
}

/**
 * Log incoming requests and outgoing responses
 */
export function withRequestLogging(): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context = {} as RequestContext) => {
      // Start timer
      const startTime = Date.now();
      context.startTime = startTime;
      
      // Get request details
      const { method, url } = request;
      const requestId = context.requestId || 'unknown';
      
      // Log request
      log.info(`API Request: ${method} ${url}`, { 
        method, 
        url, 
        requestId 
      });
      
      try {
        // Process the request
        const response = await handler(request, context);
        
        // Calculate duration
        const duration = Date.now() - startTime;
        
        // Log response
        log.info(`API Response: ${response.status}`, { 
          status: response.status, 
          duration, 
          requestId 
        });
        
        return response;
      } catch (error) {
        // Calculate duration
        const duration = Date.now() - startTime;
        
        // Log error
        log.error(`API Error Response`, { 
          error, 
          duration, 
          requestId 
        });
        
        // Handle error and return appropriate response
        return handleError(error, requestId);
      }
    };
  };
}

/**
 * Catch errors and return appropriate error responses
 */
export function withErrorHandling(): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context = {} as RequestContext) => {
      try {
        return await handler(request, context);
      } catch (error) {
        return handleError(error, context.requestId);
      }
    };
  };
}

/**
 * Validate that the request method is one of the allowed methods
 */
export function withAllowedMethods(methods: string[]): ApiMiddleware {
  const allowedMethods = methods.map(method => method.toUpperCase());
  
  return (handler: ApiHandler): ApiHandler => {
    return (request: NextRequest, context = {} as RequestContext) => {
      const method = request.method.toUpperCase();
      
      if (!allowedMethods.includes(method)) {
        throw new ApiError(
          ErrorCode.METHOD_NOT_ALLOWED,
          `Method ${method} not allowed`,
          { allowedMethods }
        );
      }
      
      return handler(request, context);
    };
  };
}

/**
 * Add CORS headers to the response
 */
export function withCors(options: {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
} = {}): ApiMiddleware {
  const {
    allowedOrigins = ['*'],
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    allowCredentials = true,
    maxAge = 86400,
  } = options;
  
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context = {} as RequestContext) => {
      // Handle preflight requests
      if (request.method.toUpperCase() === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        setCorsHeaders(response, request.headers.get('origin'), options);
        return response;
      }
      
      // Process the request
      const response = await handler(request, context);
      
      // Add CORS headers to response
      setCorsHeaders(response, request.headers.get('origin'), options);
      
      return response;
    };
  };
}

/**
 * Apply CORS headers to a response
 */
function setCorsHeaders(
  response: NextResponse,
  requestOrigin: string | null,
  options: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    allowCredentials?: boolean;
    maxAge?: number;
  }
): void {
  const {
    allowedOrigins = ['*'],
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    allowCredentials = true,
    maxAge = 86400,
  } = options;
  
  // Set Access-Control-Allow-Origin
  if (allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
  }
  
  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  
  if (allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set('Access-Control-Max-Age', maxAge.toString());
}

/**
 * Create a standard API route handler with common middleware
 */
export function createApiHandler(
  handler: ApiHandler,
  options: {
    allowedMethods?: string[];
    cors?: {
      allowedOrigins?: string[];
      allowedMethods?: string[];
      allowedHeaders?: string[];
      allowCredentials?: boolean;
      maxAge?: number;
    };
    skipLogging?: boolean;
  } = {}
): ApiHandler {
  const { allowedMethods, cors, skipLogging = false } = options;
  
  // Build middleware stack
  const middlewares: ApiMiddleware[] = [
    withRequestId(),
    withErrorHandling(),
  ];
  
  // Add CORS middleware if configured
  if (cors) {
    middlewares.push(withCors(cors));
  }
  
  // Add allowed methods middleware if specified
  if (allowedMethods && allowedMethods.length > 0) {
    middlewares.push(withAllowedMethods(allowedMethods));
  }
  
  // Add request logging middleware if not skipped
  if (!skipLogging) {
    middlewares.push(withRequestLogging());
  }
  
  // Compose middleware and return handler
  return composeMiddleware(...middlewares)(handler);
} 