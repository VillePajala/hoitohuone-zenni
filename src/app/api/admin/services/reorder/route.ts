import { NextRequest, NextResponse } from 'next/server';
import { 
  createPostHandler, 
  success,
  badRequest,
  unauthorized,
  log,
  createObjectValidator,
  array,
  string,
  number
} from '@/lib/api';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Define the request body type and validator
interface ReorderServicesRequestBody {
  services: Array<{
    id: string;
    order: number;
  }>;
}

const reorderServicesSchema = createObjectValidator<ReorderServicesRequestBody>({
  services: array(
    createObjectValidator({
      id: string({ required: true }),
      order: number({ required: true })
    }),
    { required: true }
  )
});

// POST /api/admin/services/reorder - Forward to PATCH /api/admin/services
export const POST = createPostHandler<ReorderServicesRequestBody>(
  async ({ body, requestId, request }) => {
    log.info('Service reorder endpoint called', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for service reordering', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated for service reordering', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Validate services array
    if (!body.services || body.services.length === 0) {
      log.warn('Empty services array provided', { requestId });
      return badRequest('Services array cannot be empty');
    }
    
    log.info('Forwarding request to services PATCH endpoint', { 
      requestId, 
      serviceCount: body.services.length 
    });
    
    try {
      // Forward to the PATCH endpoint by making an internal API call
      const apiUrl = new URL('/api/admin/services', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      
      // Create headers with auth info
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      
      // Forward authorization header if present
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        headers.set('authorization', authHeader);
      }
      
      // Forward clerk-auth cookies if present
      const cookie = request.headers.get('cookie');
      if (cookie) {
        headers.set('cookie', cookie);
      }
      
      // Make the request to the PATCH endpoint
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      });
      
      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        log.error('Error from services PATCH endpoint', { 
          requestId, 
          status: response.status,
          error: errorData
        });
        
        // Return the error with the same status
        return NextResponse.json(errorData, { status: response.status });
      }
      
      // Return the successful response
      const result = await response.json();
      log.info('Services reordered successfully', { requestId });
      
      return success({
        success: true,
        message: 'Service order updated successfully'
      }, { requestId });
    } catch (error) {
      log.error('Error during service reordering', { requestId, error });
      throw error; // Let the handler middleware catch and format this error
    }
  },
  {
    bodyValidator: reorderServicesSchema
  }
); 