# Migration Plan: `/api/available-dates` Endpoint

## Current Implementation Analysis

The current `/api/available-dates` endpoint is a GET endpoint that retrieves a list of available dates for a given month and year.

### Key characteristics:

1. **Query Parameters**:
   - Requires `month` and `year` parameters
   - Optional `serviceId` parameter that is not currently used
   - Returns a 400 error if required parameters are missing

2. **Functionality**:
   - Currently uses a mock implementation that generates random available dates
   - Skips weekends and has a 70% chance of adding weekdays to available dates
   - Returns a list of available dates in ISO format (YYYY-MM-DD)

3. **Error Handling**:
   - Basic try/catch structure
   - Returns a 400 error for missing required parameters
   - Returns a 500 error for unexpected errors
   - Logs errors to the console

4. **Response Format**:
   - Returns a JSON response with an `availableDates` array
   - No standardized response structure

## Issues with Current Implementation

1. **Mock Implementation**: The current implementation is a mock that does not query the database for actual availability
2. **Inconsistent Error Handling**: Error response format is inconsistent with other endpoints
3. **Limited Logging**: Only logs errors with no structured format
4. **No Request ID**: Doesn't track request IDs for tracing
5. **Inconsistent Response Format**: Doesn't follow a standardized response structure
6. **No Validation Middleware**: Uses manual validation instead of middleware
7. **Unused Parameter**: The `serviceId` parameter is not used in the current implementation

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities and updating to use real data:

```typescript
// src/app/api/available-dates/route.ts
import { 
  createGetHandler,
  success,
  validationError,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { add, format, parse, isSameDay } from 'date-fns';

// Query parameters validation schema
interface AvailableDatesQueryParams {
  month: string;
  year: string;
  serviceId?: string;
}

const querySchema = createObjectValidator<AvailableDatesQueryParams>({
  month: string({ required: true }),
  year: string({ required: true }),
  serviceId: string()
});

// GET /api/available-dates?month=MM&year=YYYY&serviceId=xxx
export const GET = createGetHandler(
  async ({ query, requestId }) => {
    const { month, year, serviceId } = query as AvailableDatesQueryParams;
    
    log.info('Fetching available dates', { requestId, month, year, serviceId });
    
    // Validate and parse date
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (
      isNaN(monthNum) || 
      isNaN(yearNum) || 
      monthNum < 1 || 
      monthNum > 12 || 
      yearNum < 2000 || 
      yearNum > 2100
    ) {
      return validationError('Invalid month or year format');
    }
    
    // Start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1); // Month is 0-indexed in JS Date
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    
    // Get all dates in the month
    const allDates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Get weekly availability
    const weeklyAvailability = await prisma.availability.findMany({
      where: {
        isAvailable: true
      }
    });
    
    // If serviceId is provided, check if the service exists
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, active: true }
      });
      
      if (!service) {
        log.info('Service not found or inactive', { requestId, serviceId });
        return success({ availableDates: [] });
      }
    }
    
    // Calculate available dates
    const availableDates = allDates.filter(date => {
      // Check if date is blocked
      const isBlocked = blockedDates.some(blockedDate => 
        isSameDay(new Date(blockedDate.date), date)
      );
      
      if (isBlocked) return false;
      
      // Check if day has weekly availability
      const dayOfWeek = date.getDay();
      const hasAvailability = weeklyAvailability.some(
        avail => avail.dayOfWeek === dayOfWeek
      );
      
      return hasAvailability;
    });
    
    // Format dates to YYYY-MM-DD
    const formattedDates = availableDates.map(date => 
      format(date, 'yyyy-MM-dd')
    );
    
    log.info('Available dates calculated', { 
      requestId, 
      month, 
      year, 
      count: formattedDates.length 
    });
    
    return success({ 
      availableDates: formattedDates 
    }, {
      requestId,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  {
    queryValidator: querySchema
  }
);
```

### 2. Key Improvements

1. **Real Data Implementation**:
   - Replaces mock implementation with real database queries
   - Checks blocked dates from the database
   - Uses weekly availability settings from the database
   - Considers service existence if `serviceId` is provided
   
2. **Standardized Error Handling**:
   - Uses the validation middleware for validating query parameters
   - Uses `validationError` for validation errors
   - The `createGetHandler` middleware automatically handles other errors
   
3. **Structured Logging**:
   - Added structured logging with `log.info` for tracking the request flow
   - Added requestId and additional context to logs for better traceability
   
4. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs
   
5. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   - Maintains the same response field (`availableDates`)
   
6. **Parameter Validation**:
   - Uses the validation utility to validate query parameters
   - Adds more thorough validation for month and year values
   
7. **No-Cache Headers**:
   - Adds cache control headers to ensure fresh data

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test various scenarios:
     - Valid month/year with available dates
     - Valid month/year with no available dates
     - Invalid month/year parameters
     - With and without serviceId
   - Mock database calls for consistent testing

2. **Integration Testing**:
   - Test with real database calls using various months and years
   - Verify correct handling of blocked dates
   - Verify that availability settings are properly considered

3. **Performance Testing**:
   - Compare performance with the old implementation
   - Ensure no performance regressions with real data

### 4. Rollout Plan

1. **Development Environment**:
   - Implement and test the changes in the development environment
   - Verify that the endpoint works correctly with the new API utilities

2. **Staging Environment**:
   - Deploy to staging and test with real-world scenarios
   - Verify that the endpoint integrates properly with the booking frontend

3. **Production Environment**:
   - Deploy to production during a low-traffic period
   - Monitor for any issues or errors

### 5. Rollback Plan

If issues are encountered after deployment:

1. Revert to the previous implementation
2. Analyze and fix issues in the new implementation
3. Re-deploy after thorough testing 