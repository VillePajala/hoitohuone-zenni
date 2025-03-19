import { 
  createGetHandler,
  createPostHandler,
  createDeleteHandler,
  success,
  unauthorized,
  badRequest,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Interface for blocked date data
interface BlockedDateData {
  date: string;
  reason: string;
}

// Interface for delete request
interface DeleteBlockedDateData {
  id: string;
}

// Validation schema for creating a blocked date
const createBlockedDateSchema = createObjectValidator<BlockedDateData>({
  date: string({ required: true }),
  reason: string({ required: true })
});

// Validation schema for deleting a blocked date
const deleteBlockedDateSchema = createObjectValidator<DeleteBlockedDateData>({
  id: string({ required: true })
});

// GET /api/admin/availability/blocked - Get all blocked dates
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Fetching blocked dates', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for blocked dates GET request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Fetch all blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    
    log.info('Blocked dates retrieved', { 
      requestId, 
      count: blockedDates.length 
    });
    
    return success(blockedDates, { requestId });
  }
);

// POST /api/admin/availability/blocked - Create a new blocked date
export const POST = createPostHandler<BlockedDateData>(
  async ({ body, requestId, request }) => {
    log.info('Creating new blocked date', { 
      requestId,
      date: body.date 
    });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for blocked dates POST request', { 
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
      // Create new blocked date
      const blockedDate = await prisma.blockedDate.create({
        data: {
          date: new Date(body.date),
          reason: body.reason
        }
      });
      
      log.info('Blocked date created successfully', { 
        requestId, 
        blockedDateId: blockedDate.id 
      });
      
      return success(blockedDate, { requestId });
    } catch (error) {
      log.error('Failed to create blocked date', { 
        requestId, 
        error,
        date: body.date 
      });
      
      return badRequest('Failed to create blocked date. The date may already be blocked.');
    }
  },
  {
    bodyValidator: createBlockedDateSchema
  }
);

// DELETE /api/admin/availability/blocked - Delete a blocked date
export const DELETE = createDeleteHandler(
  async ({ params, requestId, request }) => {
    log.info('Deleting blocked date', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for blocked dates DELETE request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // For this endpoint, we expect the ID to be in the request body
    // since it's a direct DELETE to /api/admin/availability/blocked
    // and not to a dynamic route path
    const body = await request.json();
    const id = body.id;
    
    if (!id) {
      log.warn('Missing blocked date ID', { requestId });
      return badRequest('Missing required field (id)');
    }
    
    try {
      // Delete the blocked date
      await prisma.blockedDate.delete({
        where: { id }
      });
      
      log.info('Blocked date deleted successfully', { 
        requestId, 
        id 
      });
      
      return success({ 
        message: 'Blocked date deleted successfully',
        id
      }, { requestId });
    } catch (error) {
      log.error('Failed to delete blocked date', { 
        requestId, 
        error,
        id 
      });
      
      return badRequest('Failed to delete blocked date. The date may not exist.');
    }
  }
); 