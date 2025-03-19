import { 
  createGetHandler,
  createPatchHandler,
  createDeleteHandler,
  success,
  notFound,
  badRequest,
  unauthorized,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Request body validation schema for PATCH
interface UpdateBookingRequestBody {
  notes?: string;
  status?: string;
}

const updateBookingSchema = createObjectValidator<UpdateBookingRequestBody>({
  notes: string(),
  status: string()
});

// GET /api/admin/bookings/[id] - Get a specific booking
export const GET = createGetHandler(
  async ({ params, requestId, request }) => {
    log.info('Getting booking by ID', { requestId, bookingId: params?.id });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for booking GET request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Validate ID exists
    if (!params?.id) {
      log.warn('Missing booking ID parameter', { requestId });
      return badRequest('Booking ID is required');
    }
    
    // Get the booking with service details
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameFi: true,
            duration: true
          }
        }
      }
    });
    
    if (!booking) {
      log.warn('Booking not found', { requestId, bookingId: params.id });
      return notFound('Booking not found');
    }
    
    log.info('Booking retrieved successfully', { 
      requestId, 
      bookingId: booking.id 
    });
    
    // Format for consistency with other endpoints
    const formattedBooking = {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone || undefined,
      service: booking.service,
      date: booking.date.toISOString(),
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      notes: booking.notes || undefined,
      language: booking.language,
      cancellationId: booking.cancellationId || undefined,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString()
    };
    
    return success(formattedBooking, { requestId });
  }
);

// PATCH /api/admin/bookings/[id] - Update a booking's status or notes
export const PATCH = createPatchHandler(
  async ({ params, body, requestId, request }) => {
    log.info('Updating booking', { requestId, bookingId: params?.id });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for booking PATCH request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Validate ID exists
    if (!params?.id) {
      log.warn('Missing booking ID parameter', { requestId });
      return badRequest('Booking ID is required');
    }
    
    const { notes, status } = body;
    
    log.info('Requested booking updates', { 
      requestId, 
      bookingId: params.id,
      updates: { 
        notes: notes !== undefined ? 'Updated' : 'Unchanged',
        status: status !== undefined ? status : 'Unchanged'
      }
    });
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.id }
    });
    
    if (!existingBooking) {
      log.warn('Booking not found for update', { requestId, bookingId: params.id });
      return notFound('Booking not found');
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (status !== undefined) {
      updateData.status = status;
      
      // If status is changed to cancelled, update cancelledAt
      if (status === 'cancelled' && existingBooking.status !== 'cancelled') {
        updateData.cancelledAt = new Date();
        log.info('Setting booking as cancelled', { requestId, bookingId: params.id });
      }
    }
    
    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameFi: true
          }
        }
      }
    });
    
    log.info('Booking updated successfully', { 
      requestId, 
      bookingId: params.id,
      newStatus: updatedBooking.status
    });
    
    // Format the response data
    const responseData = {
      booking: {
        id: updatedBooking.id,
        customerName: updatedBooking.customerName,
        customerEmail: updatedBooking.customerEmail,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        date: updatedBooking.date.toISOString(),
        serviceName: updatedBooking.service.name,
        updatedAt: updatedBooking.updatedAt.toISOString()
      },
      message: 'Booking updated successfully'
    };
    
    return success(responseData, { requestId });
  },
  {
    bodyValidator: updateBookingSchema
  }
);

// DELETE /api/admin/bookings/[id] - Delete a booking
export const DELETE = createDeleteHandler(
  async ({ params, requestId, request }) => {
    log.info('Deleting booking', { requestId, bookingId: params?.id });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for booking DELETE request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Validate ID exists
    if (!params?.id) {
      log.warn('Missing booking ID parameter', { requestId });
      return badRequest('Booking ID is required');
    }
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        service: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!existingBooking) {
      log.warn('Booking not found for deletion', { requestId, bookingId: params.id });
      return notFound('Booking not found');
    }
    
    // Store some info for the response
    const bookingDate = existingBooking.date.toISOString().split('T')[0];
    const serviceName = existingBooking.service.name;
    
    // Delete the booking
    await prisma.booking.delete({
      where: { id: params.id }
    });
    
    log.info('Booking deleted successfully', { 
      requestId, 
      bookingId: params.id,
      customerEmail: existingBooking.customerEmail,
      bookingDate
    });
    
    return success({
      message: 'Booking deleted successfully',
      details: {
        customerName: existingBooking.customerName,
        date: bookingDate,
        service: serviceName
      }
    }, { requestId });
  }
);

// POST /api/admin/bookings/[id]/cancel endpoint is removed as its functionality
// is covered by the PATCH endpoint with status='cancelled' 