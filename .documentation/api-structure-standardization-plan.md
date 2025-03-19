# API Structure Standardization Plan

This document outlines a plan for standardizing the API structure in the Hoitohuone Zenni booking application to improve maintainability, consistency, and developer experience.

## Current State Analysis

### Directory Structure

The application currently has two API directory structures:

1. **App Router API Routes** (`src/app/api/*`)
   - Main API endpoints used by the application
   - Follows Next.js App Router conventions
   - Contains most functionality (services, bookings, availability)

2. **Pages Router API Routes** (`src/api/*`)
   - Appears to be legacy or experimental endpoints
   - May not be actively used

### Inconsistencies Identified

1. **Directory Structure**
   - Mixed use of `src/api` and `src/app/api`
   - Inconsistent nesting patterns for related endpoints

2. **Error Handling**
   - Inconsistent error response formats
   - Varied HTTP status code usage
   - Non-standardized error messages

3. **Authentication**
   - Different auth checking mechanisms in different endpoints
   - Duplicate authentication logic

4. **Logging**
   - Excessive use of `console.log` statements
   - Inconsistent logging format and detail level
   - No structured logging system

5. **Request Validation**
   - Inconsistent input validation approaches
   - Duplicate validation logic across endpoints

6. **Response Formatting**
   - Different response structures
   - Inconsistent use of HTTP headers
   - Varying caching directives

## Standardization Goals

1. **Unified Directory Structure**
   - Standardize on `src/app/api` for all endpoints
   - Create logical grouping of related endpoints
   - Implement consistent naming conventions

2. **Standardized Error Handling**
   - Create central error handling utilities
   - Define consistent error response format
   - Implement proper HTTP status code usage

3. **Middleware Implementation**
   - Create reusable middleware for common concerns
   - Implement consistent auth checking
   - Add request validation middleware

4. **Structured Logging**
   - Replace console.log with proper logging utilities
   - Define log levels and formatting
   - Enable context-aware logging

5. **Consistent Response Format**
   - Define standard response structure
   - Implement consistent headers
   - Standardize caching directives

## Implementation Plan

### Phase 1: Analysis and Planning

1. **Catalog Existing Endpoints**
   - Document all current API endpoints
   - Map their functionality and dependencies
   - Note any special requirements or edge cases

2. **Define Standards**
   - Create API design standards document
   - Define error response format
   - Define standard HTTP status code usage
   - Create response format specifications

3. **Create Utilities and Helpers**
   - Implement error handling utilities
   - Create middleware for common concerns
   - Develop response formatting helpers
   - Build structured logging utility

### Phase 2: Implementation

#### Step 1: Create Core Infrastructure

1. **Create API Utilities** in `src/lib/api`
   - `errorHandling.ts`: Standard error responses and status codes
   - `middleware.ts`: Reusable middleware functions (auth, validation, logging)
   - `responseFormatting.ts`: Utilities for consistent response formatting
   - `validation.ts`: Request validation utilities
   - `logging.ts`: Structured logging utility

2. **Create Base Handler** in `src/lib/api/baseHandler.ts`
   - Wrapper function for route handlers
   - Applies standard middleware
   - Handles errors consistently
   - Formats responses

#### Step 2: Migrate and Standardize Endpoints

1. **Move `src/api` endpoints** to `src/app/api` if still needed
   - Update imports and references
   - Verify functionality after migration

2. **Refactor Simple Endpoints First**
   - Start with simpler, lower-risk endpoints
   - Apply new standards and utilities
   - Test thoroughly after changes

3. **Refactor Complex Endpoints**
   - Tackle complex endpoints one by one
   - Ensure backward compatibility
   - Prioritize based on importance and usage

#### Step 3: Implement Advanced Features

1. **Add Request Validation**
   - Create validators for each endpoint
   - Apply validation middleware
   - Standardize validation error responses

2. **Enhance Logging**
   - Replace console.log statements
   - Add context and request IDs
   - Implement appropriate log levels

3. **Optimize Performance**
   - Add proper caching directives
   - Implement etag support where appropriate
   - Optimize database queries

### Phase 3: Documentation and Cleanup

1. **Create API Documentation**
   - Document all endpoints
   - Describe request/response formats
   - Provide examples

2. **Remove Deprecated Endpoints**
   - Identify unused or deprecated endpoints
   - Create migration plan for consumers
   - Remove after ensuring no dependencies

3. **Setup Monitoring**
   - Add performance monitoring
   - Implement error tracking
   - Create usage analytics

## Technical Specifications

### Directory Structure

```
src/
  app/
    api/
      v1/                            # API version namespace
        services/
          route.ts                   # GET, POST /api/v1/services
          [id]/
            route.ts                 # GET, PATCH, DELETE /api/v1/services/:id
        bookings/
          route.ts                   # GET, POST /api/v1/bookings
          [id]/
            route.ts                 # GET, PATCH, DELETE /api/v1/bookings/:id
            cancel/
              route.ts               # POST /api/v1/bookings/:id/cancel
        availability/
          [date]/
            route.ts                 # GET /api/v1/availability/:date
        admin/                       # Admin-specific endpoints
          services/
            route.ts                 # Admin services endpoints
          bookings/
            route.ts                 # Admin bookings endpoints
  lib/
    api/
      errorHandling.ts               # Error handling utilities
      middleware.ts                  # API middleware
      responseFormatting.ts          # Response formatting utilities
      validation.ts                  # Request validation utilities
      logging.ts                     # Structured logging
      baseHandler.ts                 # Base API handler factory
```

### Standard Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;      // Error code, e.g., "VALIDATION_ERROR"
    message: string;   // Human-readable error message
    details?: any;     // Optional additional error details
    timestamp: string; // ISO timestamp of when the error occurred
    requestId?: string; // Optional request ID for tracing
  };
}
```

### Base Handler Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/api/validation';
import { handleError } from '@/lib/api/errorHandling';
import { formatResponse } from '@/lib/api/responseFormatting';
import { log } from '@/lib/api/logging';

export function createHandler(options: {
  schema?: any;
  handler: (req: NextRequest, params?: any) => Promise<any>;
  requireAuth?: boolean;
  cacheControl?: string;
}) {
  return async function handler(req: NextRequest, context: { params: any }) {
    const requestId = crypto.randomUUID();
    
    try {
      log.info(`API request started: ${req.method} ${req.url}`, { requestId });
      
      // Apply authentication if required
      if (options.requireAuth) {
        // Auth check logic
      }
      
      // Validate request if schema provided
      if (options.schema) {
        await validateRequest(req, options.schema);
      }
      
      // Execute handler
      const result = await options.handler(req, context.params);
      
      // Format response
      return formatResponse(result, {
        requestId,
        cacheControl: options.cacheControl,
      });
    } catch (error) {
      log.error(`API request failed: ${req.method} ${req.url}`, {
        requestId,
        error,
      });
      
      return handleError(error, requestId);
    } finally {
      log.info(`API request completed: ${req.method} ${req.url}`, { requestId });
    }
  };
}
```

### Example Refactored Endpoint

```typescript
// src/app/api/v1/services/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHandler } from '@/lib/api/baseHandler';
import { z } from 'zod';

// Force the route to be dynamic
export const dynamic = 'force-dynamic';

// Define validation schema for GET requests
const getQuerySchema = z.object({
  activeOnly: z.string().optional().transform(val => val === 'true'),
});

// Handler for GET requests
export const GET = createHandler({
  schema: {
    query: getQuerySchema,
  },
  cacheControl: 'no-store, must-revalidate',
  async handler(req: NextRequest) {
    const { activeOnly } = getQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    
    const where = activeOnly ? { active: true } : {};
    
    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ],
    });
    
    return services;
  },
});

// Define validation schema for POST requests
const postBodySchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional(),
  nameFi: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionFi: z.string().optional(),
  duration: z.number().positive(),
  price: z.number().nonnegative(),
  currency: z.string().optional(),
  active: z.boolean().optional(),
});

// Handler for POST requests
export const POST = createHandler({
  schema: {
    body: postBodySchema,
  },
  requireAuth: true,
  async handler(req: NextRequest) {
    const data = await req.json();
    const validatedData = postBodySchema.parse(data);
    
    // Find the highest order value and add 1
    const maxOrderService = await prisma.service.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    
    const nextOrder = maxOrderService?.order ? maxOrderService.order + 1 : 0;
    
    // Create new service
    const service = await prisma.service.create({
      data: {
        ...validatedData,
        nameEn: validatedData.nameEn || validatedData.name,
        nameFi: validatedData.nameFi || validatedData.name,
        descriptionEn: validatedData.descriptionEn || validatedData.description || '',
        descriptionFi: validatedData.descriptionFi || validatedData.description || '',
        currency: validatedData.currency || 'EUR',
        active: validatedData.active ?? true,
        order: nextOrder,
      },
    });
    
    return service;
  },
});
```

## Migration Strategy

To ensure a smooth transition without disrupting the existing application:

1. **One Endpoint at a Time**
   - Refactor endpoints incrementally
   - Start with lower-risk endpoints
   - Focus first on non-user-facing admin endpoints

2. **Side-by-Side Testing**
   - Create new endpoints alongside existing ones
   - Test against same database
   - Compare responses to ensure consistency

3. **Gradual Cutover**
   - Once an endpoint is verified, update client code
   - Keep old endpoint temporarily for rollback
   - Remove old endpoint after stability period

4. **Documentation Maintenance**
   - Update documentation with each migration
   - Note any response format changes
   - Document new validation requirements

## Testing Strategy

1. **Unit Tests**
   - Test API utilities in isolation
   - Verify error handling functions
   - Test validation logic

2. **Integration Tests**
   - Test each endpoint with various inputs
   - Test authentication and authorization
   - Verify error responses

3. **Performance Tests**
   - Measure response times before and after changes
   - Test under load
   - Verify caching behavior

4. **Compatibility Tests**
   - Ensure clients can work with new response formats
   - Test with all supported browsers
   - Verify mobile compatibility

## Timeline and Milestones

| Phase | Estimated Duration | Milestone |
|-------|-------------------|-----------|
| Analysis and Planning | 2-3 days | API standards document complete |
| Core Infrastructure | 2-3 days | API utilities implemented and tested |
| Initial Migration | 3-5 days | First set of endpoints migrated |
| Complete Migration | 5-7 days | All endpoints standardized |
| Documentation | 2-3 days | API documentation complete |
| Cleanup | 1-2 days | Old endpoints removed |

Total estimated time: 15-23 days

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes to API responses | Medium | High | Maintain backward compatibility, adopt gradual migration |
| Performance degradation | Low | Medium | Performance testing before/after, optimize middleware |
| Missing edge cases | Medium | Medium | Comprehensive test suite, gradual rollout |
| Auth-related regressions | Medium | High | Thorough testing of auth flows, maintain fallbacks |

## Success Criteria

1. **All API routes follow consistent patterns**
   - Directory structure follows standards
   - Response formats are consistent
   - Error handling is standardized

2. **Developer experience is improved**
   - Clear, predictable API patterns
   - Consistent error messages
   - Standardized validation
   - Better documentation

3. **Maintenance burden is reduced**
   - No duplicate code
   - Centralized utilities
   - Structured logging
   - Clear separation of concerns

## Conclusion

This API structure standardization plan provides a comprehensive approach to improving the consistency, maintainability, and developer experience of the Hoitohuone Zenni booking application's API layer. By following a gradual, methodical approach, we can achieve significant improvements with minimal disruption to the existing application.

Standardizing the API structure is a foundational step that will facilitate other improvements, including the authentication system restructuring, by providing a consistent and reliable API layer for other components to build upon.
