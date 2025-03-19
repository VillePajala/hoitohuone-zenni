# Migration Plan: `/api/availability/[date]` Endpoint

## Current Implementation Analysis

The current `/api/availability/[date]` endpoint is a GET endpoint that retrieves available time slots for a specific date, filtered by a service ID.

### Key characteristics:

1. **Route Parameters and Query Parameters**:
   - Uses dynamic route parameter to get the date
   - Requires a `serviceId` query parameter
   - Returns an error if `serviceId` is missing

2. **Functionality**:
   - Validates the date format and service ID
   - Checks if the date is blocked in the blocked dates table
   - Retrieves the service details to determine duration
   - Gets availability settings for the day of the week
   - Retrieves existing bookings for the date
   - Calculates available time slots based on availability settings, existing bookings, and service duration
   - Returns a response with availability status, message, and time slots

3. **Error Handling**:
   - Returns a 400 error for invalid date format or missing service ID
   - Returns a 404 error if the service is not found
   - Returns a 500 error for unexpected errors
   - Returns a success response with `available: false` for valid requests with no availability

4. **Logging**:
   - Only logs errors to the console
   - No informational or debug logging

5. **Response Format**:
   - Returns a JSON response with `available`, `message`, and `timeSlots` fields
   - No standardized response structure

## Issues with Current Implementation

1. **Inconsistent Error Handling**: Error response format is inconsistent with other endpoints
2. **Limited Logging**: Only logs errors, with no structured format
3. **No Request ID**: Doesn't track request IDs for tracing
4. **Inconsistent Response Format**: Doesn't follow a standardized response structure
5. **No Validation Middleware**: Uses manual validation instead of middleware
6. **No Caching Headers**: No explicit caching headers

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities:

```typescript
// src/app/api/availability/[date]/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  createGetHandler,
  success,
  notFound,
  validationError,
  log,
  string,
  createObjectValidator
} from '@/lib/api';

// Query parameters validation schema
const querySchema = createObjectValidator({
  serviceId: string({ required: true })
});

// GET /api/availability/[date]?serviceId=xxx
export const GET = createGetHandler(
  async ({ params, query, requestId }) => {
    const dateParam = params?.date;
    const { serviceId } = query;
    
    // Validate date format
    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return validationError('Invalid date format');
    }
    
    log.info('Checking availability for date and service', { requestId, date: dateParam, serviceId });
    
    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        }
      }
    });
    
    if (blockedDate) {
      log.info('Date is blocked', { requestId, date: dateParam, blockedDateId: blockedDate.id });
      return success({
        available: false,
        message: 'This date is not available for booking',
        timeSlots: []
      });
    }
    
    // Get the service details to determine duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service) {
      log.info('Service not found', { requestId, serviceId });
      return notFound('Service not found');
    }
    
    // Get the day of the week (0-6, where 0 is Sunday)
    const dayOfWeek = date.getDay();
    
    // Get availability settings for the day of the week
    const availabilitySettings = await prisma.availability.findMany({
      where: { dayOfWeek, isAvailable: true }
    });
    
    if (availabilitySettings.length === 0) {
      log.info('No availability set for this day', { requestId, date: dateParam, dayOfWeek });
      return success({
        available: false,
        message: 'No availability set for this day',
        timeSlots: []
      });
    }
    
    // Create a new date object for comparison (without changing the original date)
    const compareDate = new Date(date);
    
    // Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(compareDate.setHours(0, 0, 0, 0)),
          lt: new Date(compareDate.setHours(23, 59, 59, 999))
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
      date: dateParam, 
      bookingCount: existingBookings.length 
    });
    
    // Calculate available time slots
    const serviceDuration = service.duration; // Duration in minutes
    const timeSlots = [];
    
    for (const setting of availabilitySettings) {
      const [startHour, startMinute] = setting.startTime.split(':').map(Number);
      const [endHour, endMinute] = setting.endTime.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Generate potential 30-minute time slots
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
    
    log.info('Calculated available time slots', { 
      requestId, 
      date: dateParam, 
      serviceId, 
      timeSlotCount: timeSlots.length 
    });
    
    return success({
      available: timeSlots.length > 0,
      message: timeSlots.length > 0 ? 'Available time slots found' : 'No available time slots for this date',
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

1. **Standardized Error Handling**:
   - Uses `validationError` for validation errors
   - Uses `notFound` for 404 responses
   - The `createGetHandler` middleware automatically handles other errors
   
2. **Structured Logging**:
   - Added structured logging with `log.info` for tracking the request flow
   - Added requestId and additional context to logs for better traceability
   
3. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs
   
4. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   - Maintains the same response fields (`available`, `message`, `timeSlots`)
   
5. **Added Caching Headers**:
   - Added caching headers to ensure fresh data is returned
   
6. **Parameter Validation**:
   - Uses the validation utility to validate query parameters
   - Provides clearer error messages for validation failures

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test various scenarios:
     - Date is blocked
     - Service not found
     - No availability set for the day
     - Availability with no bookings
     - Availability with overlapping bookings
   - Test error handling for invalid inputs

2. **Integration Testing**:
   - Test with real database calls using various dates and services
   - Verify that available time slots are calculated correctly
   - Confirm correct handling of blocked dates

3. **Performance Testing**:
   - Compare performance with the old implementation
   - Ensure no performance regressions, especially for dates with many bookings

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