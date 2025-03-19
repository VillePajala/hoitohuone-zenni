# Migration Plan: `/api/services/[id]` Endpoint

## Current Implementation Analysis

The current `/api/services/[id]` endpoint is a GET endpoint that retrieves a specific service by its ID.

### Key characteristics:

1. **Route Parameters**:
   - Uses dynamic route parameters to get the service ID
   - Extracts ID from `params` in the handler function

2. **Functionality**:
   - Fetches a single service from the database by ID
   - Returns a 404 error if the service is not found
   - Returns the service details as JSON if found

3. **Error Handling**:
   - Basic try/catch structure
   - Returns a 404 if the service is not found
   - Returns a 500 error on server error
   - Logs errors to the console

4. **Logging**:
   - Uses `console.error` for error logging
   - No informational or debug logging

## Issues with Current Implementation

1. **Inconsistent Error Handling**: Error response format is inconsistent with other endpoints
2. **Limited Logging**: Only logs errors, with no structured format
3. **No Request ID**: Doesn't track request IDs for tracing
4. **Inconsistent Response Format**: Doesn't follow a standardized response structure
5. **No Caching Headers**: Unlike the services list endpoint, no explicit caching headers
6. **No Middleware for Common Concerns**: Doesn't use middleware for cross-cutting concerns

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities:

```typescript
// src/app/api/services/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { 
  createGetHandler,
  success,
  notFound,
  log
} from '@/lib/api';

// GET /api/services/:id - Get a specific service by ID
export const GET = createGetHandler(
  async ({ params, requestId }) => {
    const serviceId = params?.id;
    
    if (!serviceId) {
      return notFound('Service ID is required');
    }
    
    log.info('Fetching service by ID', { requestId, serviceId });
    
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      }
    });
    
    if (!service) {
      log.info('Service not found', { requestId, serviceId });
      return notFound('Service not found');
    }
    
    log.info('Service found', { requestId, serviceId });
    
    return success(service, {
      requestId,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
);
```

### 2. Key Improvements

1. **Standardized Error Handling**:
   - Uses the `notFound` helper for 404 responses
   - The `createGetHandler` middleware automatically handles other errors
   
2. **Structured Logging**:
   - Added structured logging with `log.info` for tracking the request flow
   - Added requestId and serviceId to logs for better traceability
   
3. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs
   
4. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   
5. **Added Caching Headers**:
   - Added the same caching headers as the services list endpoint for consistency
   
6. **Middleware Integration**:
   - Request handling, logging, and error handling are provided by middleware

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test the happy path (service found)
   - Test error handling (service not found, invalid ID)
   - Test response format and headers

2. **Integration Testing**:
   - Test the endpoint with real database calls
   - Verify correct behavior with valid and invalid IDs
   - Verify response format is consistent with other endpoints

### 4. Rollout Plan

1. **Development Environment**:
   - Implement and test the changes in the development environment
   - Verify that the endpoint works correctly with the new API utilities

2. **Staging Environment**:
   - Deploy to staging and test with real-world scenarios
   - Verify that the endpoint integrates properly with the frontend

3. **Production Environment**:
   - Deploy to production during a low-traffic period
   - Monitor for any issues or errors

### 5. Rollback Plan

If issues are encountered after deployment:

1. Revert to the previous implementation
2. Analyze and fix issues in the new implementation
3. Re-deploy after thorough testing 