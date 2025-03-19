# Migration Plan: `/api/bookings` Endpoint

## Current Implementation Analysis

The current `/api/bookings` endpoint is a POST endpoint that creates a new booking in the system.

### Key characteristics:

1. **Functionality**:
   - Creates a new booking record in the database
   - Validates required fields and input formats
   - Checks for service existence
   - Validates date formats
   - Checks for booking conflicts (existing bookings in the same time slot)
   - Checks for blocked dates
   - Generates a unique cancellation ID
   - Sends confirmation emails to the customer and notification emails to the admin
   - Returns booking details with a success message

2. **Request Body Parameters**:
   - `serviceId`: ID of the service to book (required)
   - `customerName`: Name of the customer (required)
   - `customerEmail`: Email of the customer (required)
   - `customerPhone`: Phone number of the customer
   - `date`: Date of the booking (required)
   - `startTime`: Start time of the booking (required)
   - `endTime`: End time of the booking (required)
   - `notes`: Additional notes for the booking
   - `language`: Preferred language (defaults to 'fi')

3. **Error Handling**:
   - Validates required fields (400 error for missing fields)
   - Validates email format (400 error for invalid format)
   - Validates service existence (404 error for non-existent service)
   - Validates date formats (400 error for invalid formats)
   - Checks for booking conflicts (409 error for conflicts)
   - Checks for blocked dates (409 error for blocked dates)
   - General error handling with try/catch (500 error for unexpected errors)

4. **Response Format**:
   - Success: 201 status with booking object, success message, and email test mode flag
   - Error: Various status codes (400, 404, 409, 500) with error messages

5. **Email Functionality**:
   - Sends confirmation email to customer
   - Sends notification email to admin
   - Supports test email overrides using cookies
   - Does not fail the booking creation if email sending fails

## Issues with Current Implementation

1. **Inconsistent Error Handling**: Error response format is inconsistent with other endpoints
2. **Limited Logging**: Only logs errors with no structured format
3. **No Request ID**: Doesn't track request IDs for tracing
4. **Inconsistent Response Format**: Doesn't follow a standardized response structure
5. **Manual Validation**: Uses manual validation instead of middleware
6. **Multiple Database Queries**: Makes multiple separate database queries
7. **Complex Email Logic Embedded**: Email sending logic is embedded in the route handler

## Migration Plan

### 1. Create New Implementation

Create a new implementation using the new API utilities and updating to use more structured code:

```typescript
// src/app/api/bookings/route.ts
import { 
  createPostHandler,
  success,
  validationError,
  notFound,
  conflict,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';

// Request body validation schema
interface BookingRequestBody {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  language?: string;
}

const bookingSchema = createObjectValidator<BookingRequestBody>({
  serviceId: string({ required: true }),
  customerName: string({ required: true }),
  customerEmail: string({ 
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: 'Invalid email format'
  }),
  customerPhone: string(),
  date: string({ required: true }),
  startTime: string({ required: true }),
  endTime: string({ required: true }),
  notes: string(),
  language: string()
});

// POST /api/bookings - Create a new booking
export const POST = createPostHandler(
  async ({ body, requestId, request }) => {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      date,
      startTime,
      endTime,
      notes,
      language = 'fi'
    } = body as BookingRequestBody;
    
    log.info('Creating new booking', { 
      requestId, 
      serviceId, 
      customerEmail, 
      date 
    });
    
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId, active: true }
    });
    
    if (!service) {
      log.warn('Service not found or inactive', { requestId, serviceId });
      return notFound('Service not found or inactive');
    }
    
    // Parse dates
    const bookingDate = new Date(date);
    const bookingStartTime = new Date(startTime);
    const bookingEndTime = new Date(endTime);
    
    // Validate parsed dates
    if (isNaN(bookingDate.getTime()) || 
        isNaN(bookingStartTime.getTime()) || 
        isNaN(bookingEndTime.getTime())) {
      log.warn('Invalid date format', { 
        requestId, 
        date, 
        startTime, 
        endTime 
      });
      return validationError('Invalid date format. Please use ISO format (YYYY-MM-DD for date, YYYY-MM-DDTHH:MM:SS for times)');
    }
    
    log.info('Checking for booking conflicts', { 
      requestId, 
      date: bookingDate.toISOString(), 
      startTime: bookingStartTime.toISOString(), 
      endTime: bookingEndTime.toISOString() 
    });
    
    // Check if the slot is available
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: {
          equals: bookingDate
        },
        OR: [
          {
            startTime: {
              lt: bookingEndTime
            },
            endTime: {
              gt: bookingStartTime
            }
          }
        ],
        status: {
          not: 'cancelled'
        }
      }
    });
    
    if (existingBooking) {
      log.warn('Booking conflict detected', { 
        requestId, 
        date, 
        conflictingBookingId: existingBooking.id 
      });
      return conflict('The selected time slot is no longer available');
    }
    
    // Check for blocked dates
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    if (blockedDate) {
      log.warn('Blocked date detected', { 
        requestId, 
        date, 
        blockedDateId: blockedDate.id 
      });
      return conflict('The selected date is not available for booking');
    }
    
    // Generate a unique ID for cancellation
    const cancellationId = randomUUID();
    
    log.info('Creating booking record', { requestId });
    
    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        customerName,
        customerEmail,
        customerPhone,
        date: bookingDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        notes,
        language,
        status: 'confirmed',
        cancellationId
      }
    });
    
    log.info('Booking created successfully', { 
      requestId, 
      bookingId: booking.id 
    });
    
    // Get test email overrides from cookies
    let testCustomerEmail;
    let testAdminEmail;
    
    try {
      // Extract cookie values manually from request headers
      const cookieHeader = request.headers.get('cookie') || '';
      const cookiePairs = cookieHeader.split(';').map(pair => pair.trim());
      
      for (const pair of cookiePairs) {
        const [name, value] = pair.split('=');
        if (name === 'test_customer_email') {
          testCustomerEmail = decodeURIComponent(value);
        } else if (name === 'test_admin_email') {
          testAdminEmail = decodeURIComponent(value);
        }
      }
      
      if (testCustomerEmail || testAdminEmail) {
        log.info('Using test email overrides', { 
          requestId, 
          testCustomerEmail, 
          testAdminEmail 
        });
      }
    } catch (cookieError) {
      log.error('Error parsing cookies', { 
        requestId, 
        error: cookieError 
      });
    }
    
    // Add email overrides if cookies exist
    const bookingWithOverrides = {
      ...booking,
      _testEmailOverride: testCustomerEmail,
      _testAdminEmailOverride: testAdminEmail
    };
    
    // Send confirmation emails
    try {
      log.info('Sending confirmation emails', { requestId });
      
      // Send confirmation email to customer
      await sendBookingConfirmationEmail(bookingWithOverrides, service);
      
      // Send notification email to admin
      await sendAdminNotificationEmail(bookingWithOverrides, service);
      
      log.info('Emails sent successfully', { requestId });
    } catch (emailError) {
      // Log the error but don't fail the booking creation
      log.error('Error sending confirmation emails', { 
        requestId, 
        error: emailError 
      });
    }
    
    return success({ 
      booking,
      message: 'Booking confirmed successfully',
      emailTestMode: !!(testCustomerEmail || testAdminEmail)
    }, {
      requestId,
      statusCode: 201
    });
  },
  {
    bodyValidator: bookingSchema
  }
);
```

### 2. Key Improvements

1. **Standardized Error Handling**:
   - Uses the validation middleware for validating request body
   - Uses `validationError` for validation failures
   - Uses `notFound` for non-existent services
   - Uses `conflict` for booking conflicts and blocked dates
   - The `createPostHandler` middleware automatically handles other errors

2. **Structured Logging**:
   - Added structured logging with `log.info` for tracking the request flow
   - Added `log.warn` for warning conditions
   - Added `log.error` for error conditions
   - Added requestId and additional context to logs for better traceability

3. **Request ID Tracking**:
   - Request ID is automatically generated and included in responses and logs

4. **Standardized Response Format**:
   - Uses the `success` helper to create responses with consistent structure
   - Maintains the same response fields and status codes

5. **Improved Validation**:
   - Uses the validation utility to validate request body
   - Adds more thorough validation for email format with custom error message
   - Validates date formats consistently

6. **Clear Date Handling**:
   - Creates date objects separately and validates them explicitly
   - Uses clearer start/end of day calculations for blocked date check

7. **Improved Error Messages**:
   - Provides more specific error messages, including format guidance

### 3. Testing Plan

1. **Unit Testing**:
   - Create unit tests for the new implementation
   - Test various scenarios:
     - Valid booking creation
     - Missing required fields
     - Invalid email format
     - Non-existent service
     - Invalid date formats
     - Booking conflicts
     - Blocked dates
   - Mock database calls for consistent testing
   - Mock email sending functionality

2. **Integration Testing**:
   - Test with real database calls
   - Verify correct handling of conflicts
   - Verify that emails are correctly sent
   - Test with and without test email overrides

3. **Performance Testing**:
   - Compare performance with the old implementation
   - Ensure no performance regressions

### 4. Rollout Plan

1. **Development Environment**:
   - Implement and test the changes in the development environment
   - Verify that the endpoint works correctly with the new API utilities

2. **Staging Environment**:
   - Deploy to staging and test with real-world scenarios
   - Verify that the endpoint integrates properly with the booking frontend
   - Test email functionality thoroughly

3. **Production Environment**:
   - Deploy to production during a low-traffic period
   - Monitor for any issues or errors
   - Pay special attention to email delivery and conflict handling

### 5. Rollback Plan

If issues are encountered after deployment:

1. Revert to the previous implementation
2. Analyze and fix issues in the new implementation
3. Re-deploy after thorough testing 