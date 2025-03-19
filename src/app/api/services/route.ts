import { prisma } from '@/lib/prisma';
import { 
  createGetHandler,
  success,
  log
} from '@/lib/api';
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

// Force the route to be dynamic and bypass middleware caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/services - Get all active services
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    
    log.info('Fetching active services', { requestId });
    
    const services = await prisma.service.findMany({
      where: {
        active: true
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });
    
    log.info(`Found ${services.length} active services`, { requestId, count: services.length });
    
    // Set cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return Response.json(
      { success: true, data: services },
      { headers }
    );
  },
  {
    allowedMethods: ['GET'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      allowPublicAccess: true // Public endpoint, no authentication required
    }
  }
); 