import { 
  createGetHandler,
  createPutHandler,
  success,
  unauthorized,
  badRequest,
  notFound,
  log,
  string,
  array,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Request body validation schema for PUT
interface BulkUpdateStatusRequestBody {
  bookingIds: string[];
  status: string;
}

const bulkUpdateStatusSchema = createObjectValidator<BulkUpdateStatusRequestBody>({
  bookingIds: array(string({ required: true }), { required: true }),
  status: string({ required: true })
});

// GET /api/admin/bookings/status - System diagnostics for bookings API
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Bookings API diagnostics requested', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for bookings diagnostics', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Initialize diagnostics object
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      tests: {},
      counts: {},
      sampleData: {}
    };
    
    // Test 1: Database connection
    try {
      log.info('Testing database connection', { requestId });
      diagnostics.tests.databaseConnection = { status: 'pending' };
      
      await prisma.$connect();
      diagnostics.tests.databaseConnection = { 
        status: 'success',
        message: 'Connected to database successfully'
      };
      
      log.info('Database connection successful', { requestId });
    } catch (dbError) {
      log.error('Database connection test failed', { 
        requestId, 
        error: dbError
      });
      
      diagnostics.tests.databaseConnection = { 
        status: 'failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database connection error'
      };
      
      // Early return if can't connect to database
      return success(diagnostics, { requestId, status: 500 });
    }
    
    // Test 2: Count tables
    try {
      log.info('Counting records in tables', { requestId });
      diagnostics.tests.recordCounts = { status: 'pending' };
      
      const bookingCount = await prisma.booking.count();
      const serviceCount = await prisma.service.count();
      const availabilityCount = await prisma.availability.count();
      const blockedDateCount = await prisma.blockedDate.count();
      
      diagnostics.counts = {
        bookings: bookingCount,
        services: serviceCount,
        availability: availabilityCount,
        blockedDates: blockedDateCount
      };
      
      diagnostics.tests.recordCounts = { 
        status: 'success',
        message: `Found ${bookingCount} bookings, ${serviceCount} services, ${availabilityCount} availability records, and ${blockedDateCount} blocked dates`
      };
      
      log.info('Record counts retrieved successfully', { 
        requestId,
        counts: diagnostics.counts 
      });
    } catch (countError) {
      log.error('Record count test failed', { 
        requestId, 
        error: countError 
      });
      
      diagnostics.tests.recordCounts = { 
        status: 'failed',
        error: countError instanceof Error ? countError.message : 'Unknown count error'
      };
    }
    
    // Test 3: Fetch sample data
    try {
      log.info('Fetching sample data', { requestId });
      diagnostics.tests.sampleData = { status: 'pending' };
      
      // Get a sample service
      const sampleService = await prisma.service.findFirst();
      
      // Get a sample booking
      const sampleBooking = await prisma.booking.findFirst({
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true
            }
          }
        }
      });
      
      // Format dates to ISO strings if they exist
      const formattedBooking = sampleBooking ? {
        id: sampleBooking.id,
        customerName: sampleBooking.customerName,
        customerEmail: sampleBooking.customerEmail,
        service: sampleBooking.service,
        date: sampleBooking.date?.toISOString(),
        startTime: sampleBooking.startTime?.toISOString(),
        endTime: sampleBooking.endTime?.toISOString(),
        status: sampleBooking.status,
        createdAt: sampleBooking.createdAt?.toISOString(),
        updatedAt: sampleBooking.updatedAt?.toISOString()
      } : null;
      
      diagnostics.sampleData.service = sampleService;
      diagnostics.sampleData.booking = formattedBooking;
      
      diagnostics.tests.sampleData = { 
        status: 'success',
        message: `Sample data fetched successfully`
      };
      
      log.info('Sample data retrieved successfully', { requestId });
    } catch (sampleError) {
      log.error('Sample data test failed', { 
        requestId, 
        error: sampleError 
      });
      
      diagnostics.tests.sampleData = { 
        status: 'failed',
        error: sampleError instanceof Error ? sampleError.message : 'Unknown sample data error'
      };
    }
    
    // Test 4: Status counts
    try {
      log.info('Counting bookings by status', { requestId });
      diagnostics.tests.statusCounts = { status: 'pending' };
      
      const statusCounts = await prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM Booking
        GROUP BY status
      `;
      
      diagnostics.statusCounts = statusCounts;
      
      diagnostics.tests.statusCounts = { 
        status: 'success',
        message: `Status counts retrieved successfully`
      };
      
      log.info('Booking status counts retrieved', { 
        requestId,
        statusCounts 
      });
    } catch (statusError) {
      log.error('Status count test failed', { 
        requestId, 
        error: statusError 
      });
      
      diagnostics.tests.statusCounts = { 
        status: 'failed',
        error: statusError instanceof Error ? statusError.message : 'Unknown status count error'
      };
    }
    
    log.info('Diagnostics completed successfully', { requestId });
    return success(diagnostics, { requestId });
  }
);

// PUT /api/admin/bookings/status - Bulk update booking statuses
export const PUT = createPutHandler(
  async ({ body, requestId, request }) => {
    log.info('Bulk booking status update requested', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for bulk status update', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    const { bookingIds, status } = body;
    
    if (!bookingIds || bookingIds.length === 0) {
      log.warn('No booking IDs provided for bulk update', { requestId });
      return badRequest('At least one booking ID is required');
    }
    
    if (!status) {
      log.warn('No status provided for bulk update', { requestId });
      return badRequest('Status is required');
    }
    
    log.info('Performing bulk status update', { 
      requestId, 
      bookingCount: bookingIds.length,
      newStatus: status 
    });
    
    // Validate that all bookings exist
    const existingBookings = await prisma.booking.findMany({
      where: {
        id: {
          in: bookingIds
        }
      },
      select: {
        id: true,
        status: true
      }
    });
    
    if (existingBookings.length !== bookingIds.length) {
      // Find which booking IDs don't exist
      const existingIds = existingBookings.map(booking => booking.id);
      const missingIds = bookingIds.filter(id => !existingIds.includes(id));
      
      log.warn('Some booking IDs not found', { 
        requestId, 
        missingIds 
      });
      
      return notFound(`The following booking IDs were not found: ${missingIds.join(', ')}`);
    }
    
    // Prepare update data
    const updateData: any = {
      status
    };
    
    // If status is changed to cancelled, update cancelledAt
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      log.info('Setting cancelled status with timestamp', { requestId });
    }
    
    // Perform bulk update
    const updateResults = await Promise.all(
      bookingIds.map(async (id) => {
        try {
          // Check if the status is actually changing
          const currentBooking = existingBookings.find(b => b.id === id);
          const isStatusChanging = currentBooking?.status !== status;
          
          // Only update if status is changing
          if (isStatusChanging) {
            const updated = await prisma.booking.update({
              where: { id },
              data: updateData,
              select: {
                id: true,
                status: true,
                updatedAt: true
              }
            });
            
            return {
              id,
              success: true,
              previousStatus: currentBooking?.status,
              newStatus: updated.status,
              updatedAt: updated.updatedAt.toISOString()
            };
          } else {
            // No change needed
            return {
              id,
              success: true,
              status: currentBooking?.status,
              message: 'Status unchanged'
            };
          }
        } catch (error) {
          log.error('Error updating individual booking', { 
            requestId, 
            bookingId: id,
            error 
          });
          
          return {
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    // Summarize results
    const successCount = updateResults.filter(r => r.success).length;
    const failureCount = updateResults.length - successCount;
    
    log.info('Bulk status update completed', { 
      requestId, 
      successCount,
      failureCount 
    });
    
    return success({
      message: `Bulk status update completed. ${successCount} succeeded, ${failureCount} failed.`,
      results: updateResults
    }, { requestId });
  },
  {
    bodyValidator: bulkUpdateStatusSchema
  }
); 