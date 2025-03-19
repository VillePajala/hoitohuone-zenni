import { 
  createGetHandler,
  createPostHandler,
  success,
  notFound,
  unauthorized,
  validationError,
  log,
  string,
  boolean,
  createObjectValidator,
  validateQueryParams
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Query parameters validation schema for GET
interface GetBookingsQueryParams {
  status?: string;
  date?: string;
  upcoming?: string;
  past?: string;
}

const getBookingsSchema = createObjectValidator<GetBookingsQueryParams>({
  status: string(),
  date: string(),
  upcoming: string(),
  past: string()
});

// Request body validation schema for POST (creating a booking as admin)
interface AdminBookingRequestBody {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  language?: string;
  status?: string;
  sendConfirmation?: boolean;
}

const adminBookingSchema = createObjectValidator<AdminBookingRequestBody>({
  serviceId: string({ required: true }),
  customerName: string({ required: true }),
  customerEmail: string({ required: true }),
  customerPhone: string(),
  date: string({ required: true }),
  startTime: string({ required: true }),
  endTime: string({ required: true }),
  notes: string(),
  language: string(),
  status: string(),
  sendConfirmation: boolean()
});

// GET /api/admin/bookings - Get all bookings with optional filtering
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    // Get query parameters from URL
    const url = new URL(request.url);
    const queryParams = url.searchParams;
    
    // Validate query parameters
    const validationResult = validateQueryParams(queryParams, getBookingsSchema);
    if (!validationResult.success) {
      return Response.json(
        { 
          success: false, 
          error: validationResult.errors?.[0]?.message || 'Invalid query parameters'
        }, 
        { status: 400 }
      );
    }
    
    const query = validationResult.data;
    
    // Get requestId from context
    const { requestId } = context;
    
    log.info('Admin bookings API called', { requestId });
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Build where clause based on query parameters
    const where: any = {};
    
    // Filter by status if provided
    if (query?.status) {
      where.status = query.status;
      log.info('Filtering bookings by status', { 
        requestId, 
        status: query.status 
      });
    }
    
    // Filter by date if provided
    if (query?.date) {
      try {
        const requestedDate = new Date(query.date);
        const nextDay = new Date(requestedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.date = {
          gte: requestedDate,
          lt: nextDay
        };
        
        log.info('Filtering bookings by date', { 
          requestId, 
          date: requestedDate.toISOString() 
        });
      } catch (error) {
        log.warn('Invalid date format in query', { 
          requestId, 
          date: query.date,
          error 
        });
      }
    }
    
    // Filter for upcoming bookings
    if (query?.upcoming === 'true') {
      where.date = {
        gte: new Date()
      };
      log.info('Filtering for upcoming bookings', { requestId });
    }
    
    // Filter for past bookings
    if (query?.past === 'true') {
      where.date = {
        lt: new Date()
      };
      log.info('Filtering for past bookings', { requestId });
    }
    
    // Count bookings to check if database has any
    const bookingCount = await prisma.booking.count({ where });
    log.info('Total matching bookings count', { 
      requestId, 
      count: bookingCount 
    });
    
    if (bookingCount === 0) {
      log.info('No bookings found matching the criteria', { requestId });
      return Response.json(
        { success: false, error: 'No bookings found' },
        { status: 404 }
      );
    }
    
    // Fetch bookings with included service details
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            nameFi: true,
            nameEn: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    log.info('Bookings retrieved successfully', { 
      requestId, 
      count: bookings.length 
    });
    
    // Format bookings for the frontend
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      service: {
        id: booking.service.id,
        name: booking.service.name,
        nameFi: booking.service.nameFi,
        nameEn: booking.service.nameEn
      },
      date: booking.date.toISOString(),
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      language: booking.language,
      notes: booking.notes || undefined,
      createdAt: booking.createdAt.toISOString()
    }));
    
    log.info('Bookings formatted for response', { 
      requestId, 
      count: formattedBookings.length 
    });
    
    return Response.json(
      { 
        success: true, 
        data: { bookings: formattedBookings },
        requestId 
      }
    );
  },
  {
    allowedMethods: ['GET'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to view bookings'
    }
  }
);

// Cookie helper function to safely extract cookie values
const getTestEmailOverrides = async () => {
  try {
    // This function must be called in a Server Component or Route Handler
    const cookieStore = await cookies();
    const testCustomerEmail = cookieStore.get('test_customer_email')?.value;
    const testAdminEmail = cookieStore.get('test_admin_email')?.value;
    return { testCustomerEmail, testAdminEmail };
  } catch (error) {
    log.error('Error accessing cookies', { error });
    return { testCustomerEmail: undefined, testAdminEmail: undefined };
  }
};

// Validator function for admin booking requests
function validateAdminBooking(body: any): AdminBookingRequestBody {
  const validationResult = adminBookingSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid booking data');
  }
  return validationResult.data;
}

// POST /api/admin/bookings - Create a new booking as admin
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const requestId = context.requestId;
    log.info('Admin booking creation called', { requestId });
    
    // Get validated body data
    const body = context.validatedData as AdminBookingRequestBody;
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      date,
      startTime,
      endTime,
      notes,
      language = 'fi',
      status = 'confirmed',
      sendConfirmation = false
    } = body;
    
    log.info('Creating new booking as admin', { 
      requestId, 
      serviceId, 
      customerEmail, 
      date,
      status
    });
    
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service) {
      log.warn('Service not found', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found' },
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
    
    // Check if the slot is available (admins may override conflicts)
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
      // Log the conflict but allow admin to proceed - we'll just warn
      log.warn('Admin is creating a conflicting booking', { requestId });
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
        status,
        cancellationId
      }
    });
    
    log.info('Booking created successfully', { 
      requestId, 
      bookingId: booking.id 
    });
    
    // Only send confirmation emails if requested
    if (sendConfirmation) {
      // Get test email overrides from cookies - this must be called directly in the route handler
      const { testCustomerEmail, testAdminEmail } = await getTestEmailOverrides();
      
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
    } else {
      log.info('Skipping confirmation emails per admin request', { requestId });
    }
    
    return Response.json(
      { 
        success: true,
        data: { 
          booking,
          message: 'Booking created successfully',
          emailSent: sendConfirmation
        }
      },
      { status: 201 }
    );
  },
  {
    allowedMethods: ['POST'],
    validator: validateAdminBooking,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to create bookings'
    }
  }
);