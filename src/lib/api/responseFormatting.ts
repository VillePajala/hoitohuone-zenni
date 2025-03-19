/**
 * API Response Formatting Utilities
 * 
 * Provides standardized response formatting for API routes, including:
 * - Consistent response structure
 * - Standard HTTP headers
 * - Caching directives
 */

import { NextResponse } from 'next/server';

// Interface for paginated responses
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Interface for basic success response metadata
export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
}

/**
 * Create a standard success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    status?: number;
    meta?: Record<string, any>;
    requestId?: string;
    headers?: Record<string, string>;
  }
): NextResponse {
  const { status = 200, meta = {}, requestId, headers = {} } = options || {};
  
  // Standard response metadata
  const responseMeta: ResponseMeta = {
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    ...meta,
  };
  
  // Create response with standard structure
  const response = NextResponse.json(
    {
      data,
      meta: responseMeta,
    },
    { status }
  );
  
  // Add standard headers
  response.headers.set('Content-Type', 'application/json');
  
  // Add custom headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  options?: {
    status?: number;
    meta?: Record<string, any>;
    requestId?: string;
    headers?: Record<string, string>;
  }
): NextResponse {
  const { meta = {}, ...rest } = options || {};
  
  return createSuccessResponse(data, {
    ...rest,
    meta: {
      ...meta,
      pagination,
    },
  });
}

/**
 * Create a response with no content (204)
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create a response with caching directives
 */
export function createCachedResponse<T>(
  data: T,
  options: {
    maxAge: number; // Max age in seconds
    status?: number;
    meta?: Record<string, any>;
    requestId?: string;
    headers?: Record<string, string>;
    staleWhileRevalidate?: number; // SWR in seconds
    isPublic?: boolean;
  }
): NextResponse {
  const {
    maxAge,
    staleWhileRevalidate,
    isPublic = false,
    headers = {},
    ...rest
  } = options;
  
  // Build cache-control header
  let cacheControl = isPublic ? 'public' : 'private';
  cacheControl += `, max-age=${maxAge}`;
  
  if (staleWhileRevalidate) {
    cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
  }
  
  // Add cache control header
  const cacheHeaders = {
    'Cache-Control': cacheControl,
    ...headers,
  };
  
  return createSuccessResponse(data, {
    ...rest,
    headers: cacheHeaders,
  });
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    page,
    pageSize,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultPageSize = 10,
  maxPageSize = 100
): { page: number; pageSize: number } {
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');
  
  let page = 1;
  let pageSize = defaultPageSize;
  
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }
  
  if (pageSizeParam) {
    const parsedPageSize = parseInt(pageSizeParam, 10);
    if (!isNaN(parsedPageSize) && parsedPageSize > 0) {
      pageSize = Math.min(parsedPageSize, maxPageSize);
    }
  }
  
  return { page, pageSize };
} 