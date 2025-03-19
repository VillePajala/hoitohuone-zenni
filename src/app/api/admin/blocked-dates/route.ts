import { 
  createGetHandler, 
  createPostHandler,
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

// Validation schema for creating a blocked date
const createBlockedDateSchema = createObjectValidator<BlockedDateData>({
  date: string({ required: true }),
  reason: string({ required: true })
});

// GET /api/admin/blocked-dates - Get all blocked dates
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Fetching all blocked dates', { requestId });
    
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

// POST /api/admin/blocked-dates - Create a new blocked date
export const POST = createPostHandler<BlockedDateData>(
  async ({ body, requestId, request }) => {
    log.info('Creating new blocked date', { 
      requestId,
      date: body.date,
      reason: body.reason 
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
    
    // Parse the date string to a Date object
    const dateObj = new Date(body.date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      log.warn('Invalid date format provided', { 
        requestId, 
        date: body.date 
      });
      return badRequest('Invalid date format');
    }
    
    try {
      // Check if date is already blocked
      const startOfDay = new Date(new Date(body.date).setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(body.date).setHours(23, 59, 59, 999));
      
      const existingBlockedDate = await prisma.blockedDate.findFirst({
        where: {
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });
      
      if (existingBlockedDate) {
        log.warn('Date already blocked', { 
          requestId, 
          date: body.date,
          existingBlockedDateId: existingBlockedDate.id 
        });
        return badRequest('This date is already blocked');
      }
      
      // Create a new blocked date
      const blockedDate = await prisma.blockedDate.create({
        data: {
          date: dateObj,
          reason: body.reason || 'Unavailable'
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
      
      return badRequest('Failed to create blocked date');
    }
  },
  {
    bodyValidator: createBlockedDateSchema
  }
); 