import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { authLogger } from '@/lib/authLogger';
import { validateClerkToken } from '@/lib/auth/tokenValidator';

// Handler type for API functions
export type ApiHandler = (request: NextRequest, context?: any) => Promise<Response>;

// Middleware type for API functions
export type ApiMiddleware = (handler: ApiHandler) => ApiHandler;

// Options for authentication
export interface AuthOptions {
  /** Required roles (if any) */
  requiredRoles?: string[];
  /** Whether to allow API key authentication */
  allowApiKey?: boolean;
  /** Custom error message for unauthorized access */
  unauthorizedMessage?: string;
  /** Whether to allow public access without authentication */
  allowPublicAccess?: boolean;
}

/**
 * Error types for API responses
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  
  constructor(code: ErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    
    // Default status codes based on error type
    switch (code) {
      case ErrorCode.BAD_REQUEST:
        this.status = 400;
        break;
      case ErrorCode.UNAUTHORIZED:
        this.status = 401;
        break;
      case ErrorCode.FORBIDDEN:
        this.status = 403;
        break;
      case ErrorCode.NOT_FOUND:
        this.status = 404;
        break;
      case ErrorCode.INTERNAL_ERROR:
        this.status = 500;
        break;
      default:
        this.status = 500;
    }
    
    // Override with custom status if provided
    if (status) {
      this.status = status;
    }
  }
}

/**
 * Handle API errors
 */
export function handleError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { 
        error: error.message,
        code: error.code
      },
      { status: error.status }
    );
  }
  
  // For generic errors, return 500
  authLogger.error('Unhandled API error', {
    context: 'error-handler',
    data: { error }
  });
  
  return Response.json(
    { 
      error: 'An unexpected error occurred',
      code: ErrorCode.INTERNAL_ERROR
    },
    { status: 500 }
  );
}

/**
 * Error handling middleware
 */
export function withErrorHandling(): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context: any = {}) => {
      try {
        return await handler(request, context);
      } catch (error) {
        return handleError(error);
      }
    };
  };
}

/**
 * Request logging middleware
 */
export function withRequestLogging(): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context: any = {}) => {
      const requestId = crypto.randomUUID();
      const startTime = Date.now();
      
      // Add request ID to context
      context.requestId = requestId;
      
      // Log request
      authLogger.info(`API request: ${request.method} ${request.url}`, {
        context: 'api-request',
        data: {
          method: request.method,
          url: request.url,
          requestId
        }
      });
      
      try {
        const response = await handler(request, context);
        
        // Log response timing
        const duration = Date.now() - startTime;
        authLogger.debug(`API response in ${duration}ms`, {
          context: 'api-response',
          data: {
            method: request.method,
            url: request.url,
            status: response.status,
            duration,
            requestId
          }
        });
        
        return response;
      } catch (error) {
        // Log error
        const duration = Date.now() - startTime;
        authLogger.error(`API error after ${duration}ms`, {
          context: 'api-error',
          data: {
            method: request.method,
            url: request.url,
            error,
            duration,
            requestId
          }
        });
        
        throw error;
      }
    };
  };
}

/**
 * Create a handler that checks authentication
 */
export function withAuth(options: AuthOptions = {}): ApiMiddleware {
  const {
    requiredRoles = [],
    allowApiKey = true,
    unauthorizedMessage = 'Authentication required',
    allowPublicAccess = false
  } = options;
  
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context: any = {}) => {
      try {
        // Get authentication data
        const auth = await getAuth(request);
        const requestId = context.requestId || 'unknown';
        
        // Check if authenticated
        if (!auth.userId) {
          // If public access is allowed, proceed
          if (allowPublicAccess) {
            authLogger.info('Public access allowed', {
              context: 'auth-handler',
              data: { 
                path: request.url,
                method: request.method,
                requestId
              }
            });
            
            return handler(request, {
              ...context,
              auth: {
                type: 'public',
                userId: null
              }
            });
          }
          
          // If API key authentication is allowed, check for that
          if (allowApiKey) {
            const apiKey = request.headers.get('x-api-key');
            if (apiKey && await validateApiKey(apiKey)) {
              // If valid API key, proceed
              authLogger.info('API key authentication successful', {
                context: 'auth-handler',
                data: { 
                  path: request.url,
                  method: request.method,
                  requestId
                }
              });
              
              return handler(request, {
                ...context,
                auth: {
                  type: 'apiKey',
                  userId: 'api'
                }
              });
            }
          }
          
          // Try to validate token from Authorization header
          const authHeader = request.headers.get('authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            
            // Validate token with enhanced validator
            const isValid = await validateClerkToken(token);
            
            if (isValid) {
              authLogger.debug('Valid token authentication', {
                context: 'auth-handler',
                data: { 
                  path: request.url, 
                  method: request.method, 
                  requestId 
                }
              });
              
              // Get user ID from token since Clerk auth didn't provide it
              // This would need to be implemented based on your token structure
              const userId = 'token-user'; // Placeholder
              
              return handler(request, {
                ...context,
                auth: {
                  type: 'token',
                  userId
                }
              });
            }
          }
          
          // No valid authentication found
          authLogger.warn('Unauthorized access attempt', {
            context: 'auth-handler',
            data: {
              path: request.url,
              method: request.method,
              requestId
            }
          });
          
          throw new ApiError(
            ErrorCode.UNAUTHORIZED,
            unauthorizedMessage
          );
        }
        
        // If roles are required, check them
        if (requiredRoles.length > 0) {
          const userRoles = await getUserRoles(auth.userId);
          
          const hasRequiredRole = requiredRoles.some(role => 
            userRoles.includes(role)
          );
          
          if (!hasRequiredRole) {
            authLogger.warn('Insufficient permissions', {
              context: 'auth-handler',
              data: {
                userId: auth.userId,
                requiredRoles,
                userRoles,
                requestId
              }
            });
            
            throw new ApiError(
              ErrorCode.FORBIDDEN,
              'Insufficient permissions to access this resource'
            );
          }
        }
        
        // Authentication successful, proceed
        return handler(request, {
          ...context,
          auth: {
            type: 'user',
            userId: auth.userId,
            sessionId: auth.sessionId
          }
        });
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        
        // Handle unexpected errors
        authLogger.error('Authentication error', {
          context: 'auth-handler',
          data: { error, requestId: context.requestId }
        });
        
        throw new ApiError(
          ErrorCode.UNAUTHORIZED,
          'Authentication failed'
        );
      }
    };
  };
}

/**
 * Validate an API key
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  // Implementation would check against stored API keys
  // This is a placeholder
  const validApiKey = process.env.ADMIN_API_SECRET;
  return apiKey === validApiKey;
}

/**
 * Get user roles
 */
async function getUserRoles(userId: string): Promise<string[]> {
  // Implementation would fetch roles from database
  // This is a placeholder that assumes all users are regular users
  // In a real implementation, you would fetch roles from a database or other source
  
  // For demo purposes, make 'admin' user an admin
  if (userId === 'admin') {
    return ['admin', 'user'];
  }
  
  return ['user'];
}

/**
 * Request validation middleware
 */
export function withValidation<T>(validator: (body: any) => T): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context: any = {}) => {
      try {
        // Only validate for methods that might have a body
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const body = await request.json();
          const validatedData = validator(body);
          
          // Add validated data to context
          context.validatedData = validatedData;
        }
        
        return handler(request, context);
      } catch (error) {
        // Handle validation errors
        authLogger.warn('Request validation failed', {
          context: 'validation',
          data: { error, requestId: context.requestId }
        });
        
        throw new ApiError(
          ErrorCode.BAD_REQUEST,
          error instanceof Error ? error.message : 'Invalid request data'
        );
      }
    };
  };
}

/**
 * Method checking middleware
 */
export function withMethodCheck(allowedMethods: string[]): ApiMiddleware {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context: any = {}) => {
      if (!allowedMethods.includes(request.method)) {
        throw new ApiError(
          ErrorCode.BAD_REQUEST,
          `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
          405 // Method Not Allowed
        );
      }
      
      return handler(request, context);
    };
  };
}

/**
 * Create an API handler with middleware
 */
export function createApiHandler(
  handler: ApiHandler,
  options: {
    allowedMethods: string[];
    middleware?: ApiMiddleware[];
  }
): ApiHandler {
  const { allowedMethods, middleware = [] } = options;
  
  // Start with method checking
  let finalHandler = withMethodCheck(allowedMethods)(handler);
  
  // Apply middleware in reverse order
  for (let i = middleware.length - 1; i >= 0; i--) {
    finalHandler = middleware[i](finalHandler);
  }
  
  return finalHandler;
}

/**
 * Create an authenticated API handler
 */
export function createAuthenticatedHandler(
  handler: ApiHandler,
  options: {
    allowedMethods: string[];
    authOptions?: AuthOptions;
    middleware?: ApiMiddleware[];
    validator?: (body: any) => any;
  }
): ApiHandler {
  const { allowedMethods, authOptions, middleware = [], validator } = options;
  
  // Build middleware chain with authentication
  const allMiddleware: ApiMiddleware[] = [
    withAuth(authOptions)
  ];
  
  // Add validation middleware if provided
  if (validator) {
    allMiddleware.push(withValidation(validator));
  }
  
  // Add other middleware
  allMiddleware.push(...middleware);
  
  // Return handler with all middleware
  return createApiHandler(handler, {
    allowedMethods,
    middleware: allMiddleware
  });
} 