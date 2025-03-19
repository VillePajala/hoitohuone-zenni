/**
 * API Base Handler Utilities
 * 
 * Provides factory functions for creating standardized API route handlers:
 * - Route handler factories for different HTTP methods
 * - Standardized response formatting
 * - Error handling integration
 * - Authentication integration
 * 
 * @deprecated These utilities are deprecated and will be removed in a future release.
 * Please use the new authentication handler system from `@/lib/api/authHandler.ts` instead.
 * Example: Replace `createGetHandler` with `createAuthenticatedHandler` with appropriate options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiHandler, createApiHandler } from './middleware';
import { ValidationError, Validator, validateJsonBody, validateQueryParams } from './validation';
import { createSuccessResponse, createNoContentResponse, createPaginatedResponse } from './responseFormatting';
import { ErrorCode, ApiError } from './errorHandling';

/**
 * Options for creating API handlers
 * @deprecated Use AuthOptions from authHandler.ts instead
 */
export interface ApiHandlerOptions {
  requireAuth?: boolean;
  cors?: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    allowCredentials?: boolean;
    maxAge?: number;
  };
  skipLogging?: boolean;
}

/**
 * Context for GET handler
 */
interface GetHandlerContext {
  params?: Record<string, string>;
  query?: Record<string, any>;
  requestId?: string;
  request: NextRequest;
}

/**
 * Context for POST/PUT/PATCH/DELETE handlers
 */
interface BodyHandlerContext<T> {
  params?: Record<string, string>;
  body: T;
  requestId?: string;
  request: NextRequest;
}

/**
 * Factory function for creating GET handlers
 * @deprecated Use createAuthenticatedHandler from authHandler.ts instead
 */
export function createGetHandler<QueryParams = Record<string, any>>(
  handler: (
    context: GetHandlerContext
  ) => Promise<NextResponse> | NextResponse,
  options: ApiHandlerOptions & {
    queryValidator?: Validator<QueryParams>;
  } = {}
): ApiHandler {
  // Use only in development to prevent console spam in production
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Warning: createGetHandler is deprecated and will be removed in a future release. ' +
      'Please use createAuthenticatedHandler from @/lib/api/authHandler.ts instead.'
    );
  }

  const { queryValidator, ...restOptions } = options;
  
  const apiHandler: ApiHandler = async (request: NextRequest, context: any = {}) => {
    try {
      // Get URL parameters
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      // Validate query parameters if a validator is provided
      let queryParams: Record<string, any> = {};
      
      if (queryValidator) {
        const validationResult = validateQueryParams(searchParams, queryValidator);
        
        if (!validationResult.success || !validationResult.data) {
          throw new ApiError(
            ErrorCode.VALIDATION_ERROR,
            'Invalid query parameters',
            { errors: validationResult.errors }
          );
        }
        
        queryParams = validationResult.data;
      } else {
        // Convert searchParams to object
        searchParams.forEach((value, key) => {
          if (queryParams[key]) {
            if (Array.isArray(queryParams[key])) {
              queryParams[key].push(value);
            } else {
              queryParams[key] = [queryParams[key], value];
            }
          } else {
            queryParams[key] = value;
          }
        });
      }
      
      // Call the handler with the context
      return handler({
        params: context.params,
        query: queryParams,
        requestId: context.requestId,
        request
      });
    } catch (error) {
      throw error;
    }
  };
  
  // Apply middleware and return the handler
  return createApiHandler(apiHandler, {
    allowedMethods: ['GET'],
    ...restOptions,
  });
}

/**
 * Factory function for creating POST handlers
 * @deprecated Use createAuthenticatedHandler from authHandler.ts instead
 */
export function createPostHandler<BodyType = Record<string, any>>(
  handler: (
    context: BodyHandlerContext<BodyType>
  ) => Promise<NextResponse> | NextResponse,
  options: ApiHandlerOptions & {
    bodyValidator?: Validator<BodyType>;
  } = {}
): ApiHandler {
  // Use only in development to prevent console spam in production
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Warning: createPostHandler is deprecated and will be removed in a future release. ' +
      'Please use createAuthenticatedHandler from @/lib/api/authHandler.ts instead.'
    );
  }

  const { bodyValidator, ...restOptions } = options;
  
  const apiHandler: ApiHandler = async (request: NextRequest, context: any = {}) => {
    // Validate body if a validator is provided
    if (bodyValidator) {
      const validationResult = await validateJsonBody<BodyType>(request, bodyValidator);
      
      if (!validationResult.success || !validationResult.data) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid request body',
          { errors: validationResult.errors }
        );
      }
      
      // Call the handler with the validated body
      return handler({
        params: context.params,
        body: validationResult.data,
        requestId: context.requestId,
        request
      });
    } else {
      // Parse body without validation
      try {
        const body = await request.json();
        
        // Call the handler with the body
        return handler({
          params: context.params,
          body: body as BodyType,
          requestId: context.requestId,
          request
        });
      } catch (error) {
        throw new ApiError(
          ErrorCode.BAD_REQUEST,
          'Invalid JSON in request body'
        );
      }
    }
  };
  
  // Apply middleware and return the handler
  return createApiHandler(apiHandler, {
    allowedMethods: ['POST'],
    ...restOptions,
  });
}

/**
 * Factory function for creating PUT handlers
 * @deprecated Use createAuthenticatedHandler from authHandler.ts instead
 */
export function createPutHandler<BodyType = Record<string, any>>(
  handler: (
    context: BodyHandlerContext<BodyType>
  ) => Promise<NextResponse> | NextResponse,
  options: ApiHandlerOptions & {
    bodyValidator?: Validator<BodyType>;
  } = {}
): ApiHandler {
  const { bodyValidator, ...restOptions } = options;
  
  const apiHandler: ApiHandler = async (request: NextRequest, context: any = {}) => {
    // Validate body if a validator is provided
    if (bodyValidator) {
      const validationResult = await validateJsonBody<BodyType>(request, bodyValidator);
      
      if (!validationResult.success || !validationResult.data) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid request body',
          { errors: validationResult.errors }
        );
      }
      
      // Call the handler with the validated body
      return handler({
        params: context.params,
        body: validationResult.data,
        requestId: context.requestId,
        request
      });
    } else {
      // Parse body without validation
      try {
        const body = await request.json();
        
        // Call the handler with the body
        return handler({
          params: context.params,
          body: body as BodyType,
          requestId: context.requestId,
          request
        });
      } catch (error) {
        throw new ApiError(
          ErrorCode.BAD_REQUEST,
          'Invalid JSON in request body'
        );
      }
    }
  };
  
  // Apply middleware and return the handler
  return createApiHandler(apiHandler, {
    allowedMethods: ['PUT'],
    ...restOptions,
  });
}

/**
 * Factory function for creating PATCH handlers
 * @deprecated Use createAuthenticatedHandler from authHandler.ts instead
 */
export function createPatchHandler<BodyType = Record<string, any>>(
  handler: (
    context: BodyHandlerContext<BodyType>
  ) => Promise<NextResponse> | NextResponse,
  options: ApiHandlerOptions & {
    bodyValidator?: Validator<BodyType>;
  } = {}
): ApiHandler {
  const { bodyValidator, ...restOptions } = options;
  
  const apiHandler: ApiHandler = async (request: NextRequest, context: any = {}) => {
    // Validate body if a validator is provided
    if (bodyValidator) {
      const validationResult = await validateJsonBody<BodyType>(request, bodyValidator);
      
      if (!validationResult.success || !validationResult.data) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid request body',
          { errors: validationResult.errors }
        );
      }
      
      // Call the handler with the validated body
      return handler({
        params: context.params,
        body: validationResult.data,
        requestId: context.requestId,
        request
      });
    } else {
      // Parse body without validation
      try {
        const body = await request.json();
        
        // Call the handler with the body
        return handler({
          params: context.params,
          body: body as BodyType,
          requestId: context.requestId,
          request
        });
      } catch (error) {
        throw new ApiError(
          ErrorCode.BAD_REQUEST,
          'Invalid JSON in request body'
        );
      }
    }
  };
  
  // Apply middleware and return the handler
  return createApiHandler(apiHandler, {
    allowedMethods: ['PATCH'],
    ...restOptions,
  });
}

/**
 * Factory function for creating DELETE handlers
 * @deprecated Use createAuthenticatedHandler from authHandler.ts instead
 */
export function createDeleteHandler(
  handler: (
    context: GetHandlerContext
  ) => Promise<NextResponse> | NextResponse,
  options: ApiHandlerOptions = {}
): ApiHandler {
  const apiHandler: ApiHandler = async (request: NextRequest, context: any = {}) => {
    try {
      // Get URL parameters
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      // Convert searchParams to object
      const queryParams: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        if (queryParams[key]) {
          if (Array.isArray(queryParams[key])) {
            queryParams[key].push(value);
          } else {
            queryParams[key] = [queryParams[key], value];
          }
        } else {
          queryParams[key] = value;
        }
      });
      
      // Call the handler with the context
      return handler({
        params: context.params,
        query: queryParams,
        requestId: context.requestId,
        request
      });
    } catch (error) {
      throw error;
    }
  };
  
  // Apply middleware and return the handler
  return createApiHandler(apiHandler, {
    allowedMethods: ['DELETE'],
    ...options,
  });
}

/**
 * Create a standard success response helper
 * @deprecated Use Response.json() directly or from authHandler.ts helpers
 */
export function success<T>(
  data: T,
  options?: {
    status?: number;
    meta?: Record<string, any>;
    requestId?: string;
    headers?: Record<string, string>;
  }
): NextResponse {
  return createSuccessResponse(data, options);
}

/**
 * Create a standard no content response helper
 * @deprecated Use Response.json() with empty body or status 204
 */
export function noContent(): NextResponse {
  return createNoContentResponse();
}

/**
 * Create a standard paginated response helper
 * @deprecated Use Response.json() with pagination data included
 */
export function paginatedSuccess<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  },
  options?: {
    status?: number;
    meta?: Record<string, any>;
    requestId?: string;
    headers?: Record<string, string>;
  }
): NextResponse {
  return createPaginatedResponse(data, pagination, options);
} 