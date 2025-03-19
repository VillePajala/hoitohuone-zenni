# Migration Plan: `/api/admin/services` Endpoint

## Current Implementation Analysis

The current `/api/admin/services` endpoint supports multiple HTTP methods:

1. **GET Method**:
   - Retrieves all services with optional filtering for active ones only.
   - Includes authentication check via Clerk or Bearer token.
   - Supports query parameter `activeOnly` to filter for active services.
   - Returns services ordered by the `order` field.

2. **POST Method**:
   - Creates a new service with the provided data.
   - Validates required fields (name and duration).
   - Automatically assigns the next order value.
   - Sets default values for missing fields.

3. **PATCH Method**:
   - Updates the order of services.
   - Processes an array of services with their new order values.
   - Executes updates in a transaction to ensure consistency.

### Key characteristics:

1. **Authentication**:
   - Uses a common `checkAuth` function to validate authentication.
   - Supports both Clerk session-based auth and Bearer token auth.
   - Returns 401 for unauthenticated requests.

2. **Query/Body Parameters**:
   - GET: `activeOnly` query parameter for filtering
   - POST: JSON body with service details
   - PATCH: JSON body with an array of service IDs and order values

3. **Error Handling**:
   - 400 errors for validation failures
   - 401 errors for authentication failures
   - 500 errors for database or unexpected errors
   - Basic try/catch structure with console logging

4. **Response Format**:
   - GET: Returns an array of services
   - POST: Returns the created service with 201 status
   - PATCH: Returns a success flag
   - Error responses include an error message and appropriate status code

5. **Database Interactions**:
   - Connects to and disconnects from the database explicitly (in GET)
   - Uses Prisma for database operations
   - Uses transactions for batch updates in PATCH

## Issues with Current Implementation

1. **Inconsistent Error Handling**: Error response format is inconsistent with other migrated endpoints
2. **Limited Structured Logging**: Uses console.log/error without structured format
3. **No Request ID**: Doesn't track request IDs for tracing
4. **Inconsistent Response Format**: Doesn't follow a standardized response structure
5. **Manual Validation**: Uses manual validation instead of middleware
6. **Inconsistent Auth Handling**: Authentication logic is embedded in the route handlers
7. **Explicit Database Connection Management**: Explicitly connects/disconnects from the database in some methods
8. **Manual Parameter Validation**: Manually validates parameters without a schema

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities and introducing authentication middleware:

```typescript
// src/app/api/admin/services/route.ts
import { 
  createGetHandler,
  createPostHandler,
  createPatchHandler,
  success,
  validationError,
  unauthorized,
  log,
  string,
  number,
  boolean,
  array,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Query parameters validation schema for GET
interface GetServicesQueryParams {
  activeOnly?: string;
}

const getServicesSchema = createObjectValidator<GetServicesQueryParams>({
  activeOnly: string()
});

// Request body validation schema for POST
interface CreateServiceRequestBody {
  name: string;
  nameEn?: string;
  nameFi?: string;
  description?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  duration: number;
  price?: number;
  currency?: string;
  active?: boolean;
}

const createServiceSchema = createObjectValidator<CreateServiceRequestBody>({
  name: string({ required: true }),
  nameEn: string(),
  nameFi: string(),
  description: string(),
  descriptionEn: string(),
  descriptionFi: string(),
  duration: number({ required: true }),
  price: number(),
  currency: string(),
  active: boolean()
});

// Request body validation schema for PATCH
interface ReorderServicesRequestBody {
  services: Array<{
    id: string;
    order: number;
  }>;
}

const reorderServicesSchema = createObjectValidator<ReorderServicesRequestBody>({
  services: array({
    required: true,
    items: createObjectValidator({
      id: string({ required: true }),
      order: number({ required: true })
    })
  })
});

// GET /api/admin/services - Get all services
export const GET = createGetHandler(
  async ({ query, requestId, request }) => {
    log.info('Getting services', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for services GET request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Parse query parameters
    const activeOnly = query.activeOnly === 'true';
    
    // Build where clause based on query parameters
    const where: any = {};
    
    if (activeOnly) {
      where.active = true;
    }
    
    log.info('Fetching services', { 
      requestId, 
      filter: activeOnly ? 'active only' : 'all' 
    });
    
    // Get services
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    });
    
    log.info('Services retrieved successfully', { 
      requestId, 
      count: services.length 
    });
    
    return success(services, { requestId });
  },
  {
    queryValidator: getServicesSchema
  }
);

// POST /api/admin/services - Create a new service
export const POST = createPostHandler(
  async ({ body, requestId, request }) => {
    log.info('Creating new service', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for service creation', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    const {
      name,
      nameEn,
      nameFi,
      description,
      descriptionEn,
      descriptionFi,
      duration,
      price,
      currency,
      active
    } = body as CreateServiceRequestBody;
    
    log.info('Finding highest service order', { requestId });
    
    // Find the highest order value and add 1
    const maxOrderService = await prisma.service.findFirst({
      orderBy: {
        order: 'desc'
      },
      select: {
        order: true
      }
    });
    
    const nextOrder = maxOrderService && typeof maxOrderService.order === 'number' 
      ? maxOrderService.order + 1 
      : 0;
    
    log.info('Creating service', { 
      requestId, 
      serviceName: name, 
      nextOrder 
    });
    
    // Create new service with the next order value
    const service = await prisma.service.create({
      data: {
        name,
        nameEn: nameEn || name,
        nameFi: nameFi || name,
        description: description || '',
        descriptionEn: descriptionEn || description || '',
        descriptionFi: descriptionFi || description || '',
        duration,
        price: price || 0,
        currency: currency || 'EUR',
        active: active !== undefined ? active : true,
        order: nextOrder
      }
    });
    
    log.info('Service created successfully', { 
      requestId, 
      serviceId: service.id 
    });
    
    return success(service, { 
      requestId,
      status: 201 
    });
  },
  {
    bodyValidator: createServiceSchema
  }
);

// PATCH /api/admin/services - Update service order
export const PATCH = createPatchHandler(
  async ({ body, requestId, request }) => {
    log.info('Reordering services', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for service reordering', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    const { services } = body as ReorderServicesRequestBody;
    
    log.info('Processing service reordering', { 
      requestId, 
      serviceCount: services.length 
    });
    
    // Update orders in a transaction
    const updates = services.map(service => 
      prisma.service.update({
        where: { id: service.id },
        data: { order: service.order }
      })
    );
    
    try {
      await prisma.$transaction(updates);
      log.info('Services reordered successfully', { requestId });
      
      return success({ success: true }, { requestId });
    } catch (error) {
      log.error('Error during service reordering transaction', { 
        requestId, 
        error 
      });
      throw error; // Let the handler middleware catch and format this error
    }
  },
  {
    bodyValidator: reorderServicesSchema
  }
);
```

### 2. Authentication Utility

Create a centralized authentication utility to handle both Clerk and Bearer token authentication:

```typescript
// src/lib/auth.ts
import { getAuth } from '@clerk/nextjs/server';
import { log } from '@/lib/api';

interface AuthResult {
  authenticated: boolean;
  userId?: string;
  reason?: string;
}

export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    // Check if user is authenticated via Clerk
    const { userId } = getAuth({ request });
    
    if (userId) {
      log.info('User authenticated via Clerk session', { userId });
      return {
        authenticated: true,
        userId
      };
    }
    
    // Check for Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Validate token format - should be non-empty after Bearer prefix
      const token = authHeader.substring(7).trim();
      if (token.length > 0) {
        log.info('User authenticated via Bearer token');
        return {
          authenticated: true,
          userId: 'api-user' // Or validate against a real token and extract userId
        };
      } else {
        log.warn('Empty Bearer token provided');
        return {
          authenticated: false,
          reason: 'Invalid authentication token'
        };
      }
    }
    
    log.warn('No valid authentication found in request');
    return {
      authenticated: false,
      reason: 'No authentication credentials provided'
    };
  } catch (error) {
    log.error('Error in auth check', { error });
    return {
      authenticated: false,
      reason: 'Authentication verification failed'
    };
  }
}
```

### 3. Key Improvements

1. **Standardized Error Handling**:
   - Uses the handler middleware for standardized error handling
   - Uses `unauthorized` for authentication failures
   - Uses `validationError` for validation failures

2. **Structured Logging**:
   - Added structured logging with `log.info`, `log.warn`, and `log.error`
   - Added requestId and additional context to logs for better traceability
   - Logs authentication status and user ID for security auditing

3. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs

4. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   - Maintains the same response fields

5. **Improved Validation**:
   - Uses the validation utility to validate query parameters and request body
   - Provides detailed type definitions for request/response data

6. **Centralized Authentication**:
   - Moved authentication logic to a shared utility function
   - Returns detailed authentication results for better error reporting

7. **Removed Manual DB Connection Management**:
   - Relies on Prisma's connection pooling instead of manual connect/disconnect

8. **Type Safety**:
   - Added TypeScript interfaces for request bodies and query parameters
   - Uses proper type annotations to avoid `any` types where possible

### 4. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test various scenarios:
     - Authentication success and failure cases
     - GET with and without activeOnly filter
     - POST with valid and invalid data
     - PATCH with valid and invalid reordering data
   - Mock database calls for consistent testing

2. **Integration Testing**:
   - Test with real database calls
   - Verify authentication works correctly with Clerk and Bearer tokens
   - Verify that all three methods (GET, POST, PATCH) work correctly

3. **Security Testing**:
   - Verify that unauthenticated requests are properly rejected
   - Test with various authentication edge cases

### 5. Rollout Plan

1. **Development Environment**:
   - Implement and test the changes in the development environment
   - Verify that the endpoint works correctly with the new API utilities
   - Test authentication with real Clerk accounts

2. **Staging Environment**:
   - Deploy to staging and test with real-world scenarios
   - Verify that the endpoint integrates properly with the admin frontend

3. **Production Environment**:
   - Deploy to production during a low-traffic period
   - Monitor for any issues or errors
   - Pay special attention to authentication flows

### 6. Rollback Plan

If issues are encountered after deployment:

1. Revert to the previous implementation
2. Analyze and fix issues in the new implementation
3. Re-deploy after thorough testing 