import { 
  createGetHandler, 
  success, 
  log,
  unauthorized,
  badRequest
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/bookings/debug - Get raw booking data for debugging
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Debug bookings endpoint called', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for debug bookings request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Test database connection
    try {
      log.info('Testing database connection', { requestId });
      await prisma.$connect();
      log.info('Database connection successful', { requestId });
    } catch (dbError) {
      log.error('Database connection failed', { requestId, error: dbError });
      return badRequest('Database connection failed', {
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }

    try {
      log.info('Fetching all bookings for debug', { requestId });
      
      // Get all bookings with minimal processing
      const bookings = await prisma.booking.findMany({
        include: {
          service: true
        }
      });
      
      log.info(`Found ${bookings.length} bookings for debug`, { 
        requestId, 
        count: bookings.length 
      });
      
      // Return raw bookings with stringified dates
      const debugBookings = bookings.map(booking => ({
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        serviceId: booking.serviceId,
        serviceName: booking.service.name,
        serviceNameFi: booking.service.nameFi,
        rawDate: booking.date,
        dateString: booking.date.toISOString(),
        dateConstructor: booking.date.constructor.name,
        rawStartTime: booking.startTime,
        startTimeString: booking.startTime.toISOString(),
        rawEndTime: booking.endTime,
        endTimeString: booking.endTime.toISOString(),
        status: booking.status
      }));

      log.info('Debug booking data prepared', { requestId });
      
      return success({
        count: bookings.length,
        bookings: debugBookings
      }, { requestId });
    } catch (error) {
      log.error('Error fetching debug booking data', { requestId, error });
      throw error; // Let the handler middleware catch and format this error
    } finally {
      await prisma.$disconnect();
      log.info('Database disconnected', { requestId });
    }
  }
); 