import { prisma } from '@/lib/prisma';
import { 
  createGetHandler,
  success,
  notFound,
  log
} from '@/lib/api';
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

// GET /api/services/:id - Get a specific service by ID
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    const { params } = context;
    const serviceId = params?.id;
    
    if (!serviceId) {
      return Response.json(
        { success: false, error: 'Service ID is required' },
        { status: 404 }
      );
    }
    
    log.info('Fetching service by ID', { requestId, serviceId });
    
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      }
    });
    
    if (!service) {
      log.info('Service not found', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    log.info('Service found', { requestId, serviceId });
    
    // Set cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return Response.json(
      { success: true, data: service },
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