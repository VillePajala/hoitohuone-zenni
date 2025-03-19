# Migration Plan: `/api/services` Endpoint

## Current Implementation Analysis

The current `/api/services` endpoint is a GET endpoint that retrieves all active services from the database, ordered by the `order` field and then by `name`.

### Key characteristics:

1. **Route Configuration**:
   - Uses dynamic configuration to bypass middleware caching
   - Sets `force-no-store` for fetch cache
   - Sets revalidate to 0

2. **Functionality**:
   - Fetches active services from the database
   - Orders services by `order` field and then by `name`
   - Returns the services as JSON

3. **Error Handling**:
   - Basic try/catch structure
   - Returns a 500 error with error details on failure

4. **Caching**:
   - Sets no-cache headers explicitly

5. **Logging**:
   - Uses multiple `console.log` statements for debugging
   - Logs when the API is called, database connections, and error states

6. **Database Connection**:
   - Explicitly connects to and disconnects from the database in each request
   - Uses a try/catch/finally pattern for disconnection

## Issues with Current Implementation

1. **Inconsistent Error Handling**: Error response format is inconsistent with other endpoints
2. **Excessive Logging**: Uses multiple console.log statements instead of structured logging
3. **Manual Database Connection Management**: Manually connects and disconnects from the database
4. **No Request ID**: Doesn't track request IDs for tracing
5. **Inconsistent Response Format**: Doesn't follow a standardized response structure
6. **No Middleware for Common Concerns**: Doesn't use middleware for cross-cutting concerns

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities:

```typescript
// src/app/api/services/route.ts
import { prisma } from '@/lib/prisma';
import { 
  createGetHandler,
  success,
  log
} from '@/lib/api';

// Force the route to be dynamic and bypass middleware caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/services - Get all active services
export const GET = createGetHandler(
  async ({ requestId }) => {
    log.info('Fetching active services', { requestId });
    
    const services = await prisma.service.findMany({
      where: {
        active: true
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });
    
    log.info(`Found ${services.length} active services`, { requestId, count: services.length });
    
    return success(services, {
      requestId,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  {
    // No specific query validation needed for this endpoint
  }
);
```

### 2. Key Improvements

1. **Standardized Error Handling**:
   - The `createGetHandler` middleware automatically handles errors using the standardized error handling
   
2. **Structured Logging**:
   - Replaced console.log with structured logging from the logging utility
   - Added requestId to logs for better traceability
   
3. **Removed Manual DB Connection Management**:
   - Prisma automatically manages connections, no need for manual connect/disconnect
   
4. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   
5. **Middleware Integration**:
   - Request handling, logging, and error handling are provided by middleware
   - Automatically includes request ID tracking
   
6. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Verify that the handler returns the expected response format
   - Test error handling by mocking database errors

2. **Integration Testing**:
   - Test the endpoint with real database calls
   - Verify that the response format is correct
   - Confirm that services are properly ordered

3. **Performance Testing**:
   - Compare performance with the old implementation
   - Ensure no performance regressions

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