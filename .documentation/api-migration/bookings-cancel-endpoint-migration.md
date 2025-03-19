# Migration Plan: `/api/bookings/cancel` Endpoint

## Current Implementation Analysis

The current `/api/bookings/cancel` endpoint supports both GET and POST methods:

1. **GET Method**:
   - Retrieves booking information for the cancellation page using a cancellation ID provided as a query parameter.
   - Returns information about the booking and its associated service.
   - Filters out sensitive information before returning the booking details.

2. **POST Method**:
   - Handles the actual cancellation of a booking using a cancellation ID provided in the request body.
   - Performs various validations:
     - Checks if the cancellation ID is provided
     - Verifies the booking exists
     - Ensures the booking is not already cancelled
     - Confirms the booking is not in the past
   - Updates the booking status to "cancelled"
   - Sends a cancellation confirmation email
   - Returns the updated booking with a success message

### Key characteristics:

1. **Query/Body Parameters**:
   - GET: `id` query parameter for the cancellation ID
   - POST: `cancellationId` in the request body

2. **Error Handling**:
   - 400 errors for validation failures (missing ID, already cancelled, past bookings)
   - 404 error for non-existent bookings
   - 500 errors for unexpected errors or missing services
   - Basic try/catch structure for both methods

3. **Response Format**:
   - GET: Returns filtered booking information with service details
   - POST: Returns updated booking with a success message
   - Error responses include an error message and appropriate status code

4. **Email Functionality**:
   - Sends a cancellation confirmation email
   - Does not fail the cancellation if email sending fails
   - Logs email success or failure

## Issues with Current Implementation

1. **Inconsistent Error Handling**: Error response format is inconsistent with other migrated endpoints
2. **Limited Logging**: Only logs errors with console.log and console.error
3. **No Request ID**: Doesn't track request IDs for tracing
4. **Inconsistent Response Format**: Doesn't follow a standardized response structure
5. **Manual Validation**: Uses manual validation instead of middleware
6. **Multiple Database Queries**: Makes separate database queries for booking and service

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities:

```typescript
// src/app/api/bookings/cancel/route.ts
import { 
  createGetHandler,
  createPostHandler,
  success,
  validationError,
  notFound,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { sendBookingCancellationEmail } from '@/lib/emailService';

// Request body validation schema for POST
interface CancelBookingRequestBody {
  cancellationId: string;
}

const cancelBookingSchema = createObjectValidator<CancelBookingRequestBody>({
  cancellationId: string({ required: true })
});

// Query parameters validation schema for GET
interface GetBookingQueryParams {
  id: string;
}

const getBookingSchema = createObjectValidator<GetBookingQueryParams>({
  id: string({ required: true })
});

// POST /api/bookings/cancel - Cancel a booking using cancellationId
export const POST = createPostHandler(
  async ({ body, requestId }) => {
    const { cancellationId } = body as CancelBookingRequestBody;
    
    log.info('Cancelling booking', { requestId, cancellationId });
    
    // Find booking by cancellationId
    const booking = await prisma.booking.findUnique({
      where: { cancellationId }
    });
    
    if (!booking) {
      log.warn('Booking not found with provided cancellation ID', { 
        requestId, 
        cancellationId 
      });
      return notFound('Booking not found with the provided cancellation ID');
    }
    
    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      log.warn('Booking is already cancelled', { 
        requestId, 
        bookingId: booking.id 
      });
      return validationError('Booking is already cancelled');
    }
    
    // Check if booking date is in the past
    const now = new Date();
    if (booking.startTime < now) {
      log.warn('Cannot cancel past bookings', { 
        requestId, 
        bookingId: booking.id,
        bookingTime: booking.startTime
      });
      return validationError('Cannot cancel past bookings');
    }
    
    // Get the service details for the email
    const service = await prisma.service.findUnique({
      where: { id: booking.serviceId }
    });
    
    if (!service) {
      log.error('Service not found for booking', { 
        requestId, 
        bookingId: booking.id,
        serviceId: booking.serviceId
      });
      return validationError('Service not found');
    }
    
    log.info('Updating booking status to cancelled', { 
      requestId, 
      bookingId: booking.id 
    });
    
    // Update booking status to cancelled
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' }
    });
    
    // Send cancellation confirmation email
    try {
      log.info('Sending cancellation email', { requestId, bookingId: booking.id });
      await sendBookingCancellationEmail(updatedBooking, service);
      log.info('Cancellation email sent successfully', { requestId });
    } catch (emailError) {
      log.error('Error sending cancellation email', { 
        requestId, 
        bookingId: booking.id,
        error: emailError
      });
      // Continue with cancellation even if email fails
    }
    
    return success({ 
      booking: updatedBooking,
      message: 'Booking cancelled successfully'
    }, { requestId });
  },
  {
    bodyValidator: cancelBookingSchema
  }
);

// GET /api/bookings/cancel?id={cancellationId} - Get booking info for cancellation page
export const GET = createGetHandler(
  async ({ query, requestId }) => {
    const { id: cancellationId } = query as GetBookingQueryParams;
    
    log.info('Retrieving booking info for cancellation page', { 
      requestId, 
      cancellationId 
    });
    
    // Find booking by cancellationId
    const booking = await prisma.booking.findUnique({
      where: { cancellationId },
      include: { service: true }
    });
    
    if (!booking) {
      log.warn('Booking not found with provided cancellation ID', { 
        requestId, 
        cancellationId 
      });
      return notFound('Booking not found with the provided cancellation ID');
    }
    
    log.info('Booking found', { requestId, bookingId: booking.id });
    
    // Remove sensitive or unnecessary data before sending to the client
    const bookingInfo = {
      id: booking.id,
      customerName: booking.customerName,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      service: {
        id: booking.service.id,
        name: booking.service.name,
        nameEn: booking.service.nameEn,
        nameFi: booking.service.nameFi,
        duration: booking.service.duration
      }
    };
    
    return success({ 
      booking: bookingInfo 
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
    queryValidator: getBookingSchema
  }
);
```

### 2. Key Improvements

1. **Standardized Error Handling**:
   - Uses the validation middleware for validating request body and query parameters
   - Uses `validationError` for validation failures
   - Uses `notFound` for non-existent bookings and services
   - The handler middleware automatically handles other errors

2. **Structured Logging**:
   - Added structured logging with `log.info`, `log.warn`, and `log.error`
   - Added requestId and additional context to logs for better traceability
   - Logs success and failure cases

3. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs

4. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   - Maintains the same response fields

5. **Improved Validation**:
   - Uses the validation utility to validate request body and query parameters
   - Provides consistent validation error messages

6. **No-Cache Headers for GET**:
   - Adds cache control headers to ensure the cancellation page always shows fresh data

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test various scenarios:
     - Valid booking cancellation
     - Missing cancellation ID
     - Non-existent booking
     - Already cancelled booking
     - Past booking cancellation attempt
     - Missing service
     - Valid booking info retrieval
   - Mock database calls for consistent testing
   - Mock email sending functionality

2. **Integration Testing**:
   - Test with real database calls
   - Verify correct handling of already cancelled bookings
   - Verify that emails are correctly sent
   - Verify that the cancellation page receives correct booking information

3. **End-to-End Testing**:
   - Test the full cancellation flow from the cancellation page
   - Verify that the cancellation process works correctly in a real environment

### 4. Rollout Plan

1. **Development Environment**:
   - Implement and test the changes in the development environment
   - Verify that the endpoint works correctly with the new API utilities

2. **Staging Environment**:
   - Deploy to staging and test with real-world scenarios
   - Verify that the endpoint integrates properly with the cancellation frontend

3. **Production Environment**:
   - Deploy to production during a low-traffic period
   - Monitor for any issues or errors
   - Pay special attention to email delivery

### 5. Rollback Plan

If issues are encountered after deployment:

1. Revert to the previous implementation
2. Analyze and fix issues in the new implementation
3. Re-deploy after thorough testing 