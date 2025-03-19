import { NextRequest } from 'next/server';
import { createAuthenticatedHandler } from '@/lib/api/authHandler';
import { withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';
import { authLogger } from '@/lib/authLogger';

/**
 * Example of a protected API route using standardized authentication
 * This demonstrates how to use the auth handler with role-based access control
 */
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context: any) => {
    // The auth object is available in context
    const { auth } = context;
    
    // Log that the protected resource was accessed
    authLogger.info('Protected resource accessed', {
      context: 'protected-resource',
      data: {
        userId: auth.userId,
        type: auth.type
      }
    });
    
    // Return the protected resource data
    return Response.json({
      success: true,
      message: 'This is a protected resource',
      user: auth.userId,
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    });
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      // Only users with 'admin' role can access this resource
      requiredRoles: ['admin'],
      // Allow API key auth for this endpoint
      allowApiKey: true,
      // Custom error message
      unauthorizedMessage: 'You must be authenticated to access this resource'
    },
    // Add additional middleware
    middleware: [withRequestLogging(), withErrorHandling()]
  }
); 