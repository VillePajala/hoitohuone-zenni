# Migration Plan: `/api/time-slots` Endpoint

## Current Implementation Analysis

The current `/api/time-slots` endpoint is a GET endpoint that retrieves time slots for a specific date, with an optional service ID filter.

### Key characteristics:

1. **Query Parameters**:
   - Requires `date` parameter (format: YYYY-MM-DD)
   - Optional `serviceId` parameter that is not currently used in the implementation
   - Returns a 400 error if date parameter is missing

2. **Functionality**:
   - Currently uses a mock implementation that generates random time slots
   - Creates time slots between 9 AM and 5 PM in 60-minute increments
   - Randomly marks ~80% of slots as available
   - Returns a list of available time slots with start and end times

3. **Error Handling**:
   - Basic try/catch structure
   - Returns a 400 error for missing date parameter
   - Returns a 500 error for unexpected errors
   - Logs errors to the console

4. **Response Format**:
   - Returns a JSON response with a `timeSlots` array
   - No standardized response structure

## Issues with Current Implementation

1. **Mock Implementation**: The current implementation is a mock that does not query the database for actual availability
2. **Inconsistent Error Handling**: Error response format is inconsistent with other endpoints
3. **Limited Logging**: Only logs errors with no structured format
4. **No Request ID**: Doesn't track request IDs for tracing
5. **Inconsistent Response Format**: Doesn't follow a standardized response structure
6. **No Validation Middleware**: Uses manual validation instead of middleware
7. **Unused Parameter**: The `serviceId` parameter is collected but not used in the current implementation

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities and updating to use real data:

```typescript
// src/app/api/time-slots/route.ts
import { 
  createGetHandler,
  success,
  validationError,
  notFound,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { format, parse, add } from 'date-fns';

// Query parameters validation schema
interface TimeSlotQueryParams {
  date: string;
  serviceId?: string;
}

const querySchema = createObjectValidator<TimeSlotQueryParams>({
  date: string({ required: true }),
  serviceId: string()
});

// GET /api/time-slots?date=YYYY-MM-DD&serviceId=xxx
export const GET = createGetHandler(
  async ({ query, requestId }) => {
    const { date, serviceId } = query as TimeSlotQueryParams;
    
    log.info('Fetching time slots', { requestId, date, serviceId });
    
    // Validate date format
    try {
      parse(date, 'yyyy-MM-dd', new Date());
    } catch (error) {
      log.warn('Invalid date format', { requestId, date });
      return validationError('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        }
      }
    });
    
    if (blockedDate) {
      log.info('Date is blocked', { requestId, date, blockedDateId: blockedDate.id });
      return success({ timeSlots: [] });
    }
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = new Date(date).getDay();
    
    // Get availability settings for the day of the week
    const availabilitySettings = await prisma.availability.findMany({
      where: { dayOfWeek, isAvailable: true }
    });
    
    if (availabilitySettings.length === 0) {
      log.info('No availability set for this day', { requestId, date, dayOfWeek });
      return success({ timeSlots: [] });
    }
    
    // Get service duration if serviceId is provided
    let serviceDuration = 60; // Default 60 minutes
    
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, active: true }
      });
      
      if (!service) {
        log.info('Service not found or inactive', { requestId, serviceId });
        return notFound('Service not found or inactive');
      }
      
      serviceDuration = service.duration;
    }
    
    // Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        status: 'confirmed'
      },
      select: {
        startTime: true,
        endTime: true
      }
    });
    
    log.info('Retrieved existing bookings', { 
      requestId, 
      date, 
      bookingCount: existingBookings.length 
    });
    
    // Generate time slots based on availability settings
    const timeSlots = [];
    
    for (const setting of availabilitySettings) {
      const [startHour, startMinute] = setting.startTime.split(':').map(Number);
      const [endHour, endMinute] = setting.endTime.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Generate time slots based on service duration or default increment
      for (let time = startTimeMinutes; time + serviceDuration <= endTimeMinutes; time += 30) {
        const slotStartHour = Math.floor(time / 60);
        const slotStartMinute = time % 60;
        
        const slotEndHour = Math.floor((time + serviceDuration) / 60);
        const slotEndMinute = (time + serviceDuration) % 60;
        
        const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
        
        // Check if this slot overlaps with any existing booking
        const isBooked = existingBookings.some(booking => {
          // Get hours and minutes from DateTime objects
          const startDateTime = new Date(booking.startTime);
          const endDateTime = new Date(booking.endTime);
          
          const bookingStartHour = startDateTime.getHours();
          const bookingStartMinute = startDateTime.getMinutes();
          const bookingEndHour = endDateTime.getHours();
          const bookingEndMinute = endDateTime.getMinutes();
          
          const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute;
          const bookingEndMinutes = bookingEndHour * 60 + bookingEndMinute;
          
          // Check for overlap
          return (
            (time < bookingEndMinutes && time + serviceDuration > bookingStartMinutes) ||
            (bookingStartMinutes < time + serviceDuration && bookingEndMinutes > time)
          );
        });
        
        if (!isBooked) {
          timeSlots.push({
            startTime: slotStartTime,
            endTime: slotEndTime
          });
        }
      }
    }
    
    log.info('Generated time slots', { 
      requestId, 
      date, 
      serviceDuration,
      timeSlotCount: timeSlots.length 
    });
    
    return success({ 
      timeSlots 
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
   - Considers service duration if `serviceId` is provided
   - Checks for existing bookings to avoid double-bookings
   
2. **Standardized Error Handling**:
   - Uses the validation middleware for validating query parameters
   - Uses `validationError` for validation failures
   - Uses `notFound` for non-existent services
   - The `createGetHandler` middleware automatically handles other errors
   
3. **Structured Logging**:
   - Added structured logging with `log.info` for tracking the request flow
   - Added requestId and additional context to logs for better traceability
   
4. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs
   
5. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   - Maintains the same response field (`timeSlots`)
   
6. **Parameter Validation**:
   - Uses the validation utility to validate query parameters
   - Adds more thorough validation for date format
   
7. **No-Cache Headers**:
   - Adds cache control headers to ensure fresh data

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test various scenarios:
     - Valid date with available time slots
     - Valid date with no availability
     - Blocked date
     - Invalid date format
     - With and without serviceId
   - Mock database calls for consistent testing

2. **Integration Testing**:
   - Test with real database calls using various dates
   - Verify correct handling of blocked dates
   - Verify that availability settings are properly considered
   - Verify that existing bookings are properly considered

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