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
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

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

// Validator functions
function validateCancelBooking(body: any): CancelBookingRequestBody {
  const validationResult = cancelBookingSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid cancellation data');
  }
  return validationResult.data;
}

// POST /api/bookings/cancel - Cancel a booking using cancellationId
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const requestId = context.requestId;
    const body = context.validatedData as CancelBookingRequestBody;
    const { cancellationId } = body;
    
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
      return Response.json(
        { success: false, error: 'Booking not found with the provided cancellation ID' },
        { status: 404 }
      );
    }
    
    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      log.warn('Booking is already cancelled', { 
        requestId, 
        bookingId: booking.id 
      });
      return Response.json(
        { success: false, error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }
    
    // Check if booking date is in the past
    const now = new Date();
    if (booking.startTime < now) {
      log.warn('Cannot cancel past bookings', { 
        requestId, 
        bookingId: booking.id,
        bookingTime: booking.startTime
      });
      return Response.json(
        { success: false, error: 'Cannot cancel past bookings' },
        { status: 400 }
      );
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
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 400 }
      );
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
    
    return Response.json({ 
      success: true,
      data: {
        booking: updatedBooking,
        message: 'Booking cancelled successfully'
      }
    });
  },
  {
    allowedMethods: ['POST'],
    validator: validateCancelBooking,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      allowPublicAccess: true // Public endpoint for customer cancellations
    }
  }
);

// GET /api/bookings/cancel?id={cancellationId} - Get booking info for cancellation page
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const requestId = context.requestId;
    
    // Extract query parameter
    const url = new URL(request.url);
    const cancellationId = url.searchParams.get('id');
    
    if (!cancellationId) {
      return Response.json(
        { success: false, error: 'Cancellation ID is required' },
        { status: 400 }
      );
    }
    
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
      return Response.json(
        { success: false, error: 'Booking not found with the provided cancellation ID' },
        { status: 404 }
      );
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
    
    // Set cache headers in response
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return Response.json(
      { success: true, data: { booking: bookingInfo } },
      { 
        headers 
      }
    );
  },
  {
    allowedMethods: ['GET'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      allowPublicAccess: true // Public endpoint for cancellation page info
    }
  }
); 