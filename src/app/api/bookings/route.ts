import { 
  createPostHandler,
  success,
  validationError,
  notFound,
  log,
  string,
  createObjectValidator,
  CookieService
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Cookie names for test email configuration
const CUSTOMER_EMAIL_COOKIE = 'test_customer_email';
const ADMIN_EMAIL_COOKIE = 'test_admin_email';

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
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }),
  customerPhone: string(),
  date: string({ required: true }),
  startTime: string({ required: true }),
  endTime: string({ required: true }),
  notes: string(),
  language: string()
});

// Validator function for booking requests
function validateBooking(body: any): BookingRequestBody {
  const validationResult = bookingSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid booking data');
  }
  return validationResult.data;
}

// POST /api/bookings - Create a new booking
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const requestId = context.requestId;
    
    // Get validated body data
    const body = context.validatedData as BookingRequestBody;
    
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
    } = body;
    
    log.info('Creating new booking', { 
      requestId, 
      serviceId, 
      customerEmail, 
      date 
    });
    
    // Check if service exists and is active
    const service = await prisma.service.findUnique({
      where: { id: serviceId, active: true }
    });
    
    if (!service) {
      log.warn('Service not found or inactive', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found or inactive' },
        { status: 404 }
      );
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
      return Response.json(
        { 
          success: false, 
          error: 'Invalid date format. Please use ISO format (YYYY-MM-DD for date, YYYY-MM-DDTHH:MM:SS for times)'
        },
        { status: 400 }
      );
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
      // Using status 409 (Conflict) for booking conflicts
      return Response.json(
        { success: false, error: 'The selected time slot is no longer available' },
        { status: 409 }
      );
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
      // Using status 409 (Conflict) for blocked dates
      return Response.json(
        { success: false, error: 'The selected date is not available for booking' },
        { status: 409 }
      );
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
    
    // Get test email overrides from cookies using CookieService
    const cookieValues = CookieService.getMultiple(request, [CUSTOMER_EMAIL_COOKIE, ADMIN_EMAIL_COOKIE], requestId);
    const testCustomerEmail = cookieValues[CUSTOMER_EMAIL_COOKIE];
    const testAdminEmail = cookieValues[ADMIN_EMAIL_COOKIE];
    
    if (testCustomerEmail || testAdminEmail) {
      log.info('Using test email overrides', { 
        requestId, 
        testCustomerEmail, 
        testAdminEmail 
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
    
    return Response.json(
      {
        success: true,
        data: {
          booking,
          message: 'Booking confirmed successfully',
          emailTestMode: !!(testCustomerEmail || testAdminEmail)
        }
      },
      { status: 201 }
    );
  },
  {
    allowedMethods: ['POST'],
    validator: validateBooking,
    middleware: [withRequestLogging(), withErrorHandling()],
    // This is a public endpoint, so no auth required
    authOptions: {
      requiredRoles: [], // No roles required
      allowPublicAccess: true // Allow unauthenticated access
    }
  }
); 