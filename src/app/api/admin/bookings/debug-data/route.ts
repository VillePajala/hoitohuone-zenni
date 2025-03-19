import { 
  createGetHandler, 
  success, 
  log,
  unauthorized
} from '@/lib/api';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/bookings/debug-data - Get static booking data for debugging
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Debug static bookings endpoint called', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for debug static bookings request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    try {
      log.info('Generating static booking data', { requestId });
      
      // Create static test bookings that don't rely on database
      const staticBookings = [
        {
          id: 'static-1',
          customerName: 'Test Customer 1',
          customerEmail: 'test1@example.com',
          service: {
            id: 'static-service-1',
            name: 'Test Service',
            nameFi: 'Testipalvelu',
            nameEn: 'Test Service'
          },
          date: new Date().toISOString(),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'confirmed',
          language: 'en'
        },
        {
          id: 'static-2',
          customerName: 'Test Customer 2',
          customerEmail: 'test2@example.com',
          service: {
            id: 'static-service-1',
            name: 'Test Service',
            nameFi: 'Testipalvelu',
            nameEn: 'Test Service'
          },
          date: new Date().toISOString(),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'cancelled',
          language: 'fi'
        }
      ];
      
      log.info('Static booking data generated', { 
        requestId, 
        count: staticBookings.length
      });
      
      return success(staticBookings, { requestId });
    } catch (error) {
      log.error('Error generating static booking data', { requestId, error });
      throw error; // Let the handler middleware catch and format this error
    }
  }
); 