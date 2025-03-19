import { 
  createGetHandler, 
  createDeleteHandler,
  success,
  unauthorized,
  notFound,
  badRequest,
  log
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// GET /api/admin/blocked-dates/[id] - Get a specific blocked date by ID
export const GET = createGetHandler(
  async ({ params, requestId, request }) => {
    log.info('Fetching blocked date by ID', { requestId, id: params?.id });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for blocked date GET request', { 
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
      log.warn('Missing blocked date ID parameter', { requestId });
      return badRequest('Blocked date ID is required');
    }
    
    // Fetch the blocked date by ID
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id: params.id }
    });
    
    if (!blockedDate) {
      log.warn('Blocked date not found', { requestId, id: params.id });
      return notFound('Blocked date not found');
    }
    
    log.info('Blocked date retrieved successfully', { 
      requestId, 
      id: params.id 
    });
    
    return success(blockedDate, { requestId });
  }
);

// DELETE /api/admin/blocked-dates/[id] - Delete a specific blocked date by ID
export const DELETE = createDeleteHandler(
  async ({ params, requestId, request }) => {
    log.info('Deleting blocked date by ID', { requestId, id: params?.id });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for blocked date DELETE request', { 
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
      log.warn('Missing blocked date ID parameter', { requestId });
      return badRequest('Blocked date ID is required');
    }
    
    try {
      // Check if the blocked date exists
      const blockedDate = await prisma.blockedDate.findUnique({
        where: { id: params.id }
      });
      
      if (!blockedDate) {
        log.warn('Blocked date not found for deletion', { requestId, id: params.id });
        return notFound('Blocked date not found');
      }
      
      // Delete the blocked date
      await prisma.blockedDate.delete({
        where: { id: params.id }
      });
      
      log.info('Blocked date deleted successfully', { 
        requestId, 
        id: params.id 
      });
      
      return success({ 
        message: 'Blocked date deleted successfully',
        id: params.id
      }, { requestId });
    } catch (error) {
      log.error('Failed to delete blocked date', { 
        requestId, 
        error, 
        id: params.id 
      });
      
      return badRequest('Failed to delete blocked date');
    }
  }
); 