import { NextRequest } from 'next/server';
import { sessionManager } from '@/lib/auth/sessionManager';
import { authLogger } from '@/lib/authLogger';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling, ErrorCode, ApiError } from '@/lib/api/authHandler';
import { z } from 'zod';

// Schema for session deletion
const deleteSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required")
});

// Validator for DELETE request
const validateDeleteRequest = (data: unknown) => {
  return deleteSessionSchema.parse(data);
};

/**
 * GET - Fetch all sessions for the authenticated user
 */
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { userId } = context.auth;
    
    // Get sessions for the current user
    const sessions = sessionManager.getUserSessions(userId);
    
    // Return the sessions
    return Response.json({
      success: true,
      data: sessions
    });
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      requiredRoles: ['admin', 'user'],
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
);

/**
 * DELETE - Terminate a user session
 */
export const DELETE = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { userId } = context.auth;
    const { sessionId } = context.validatedData;
    
    // Get the session first to check ownership
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      throw new ApiError(
        ErrorCode.NOT_FOUND,
        'Session not found'
      );
    }
    
    // Only allow terminating own sessions unless admin
    if (session.userId !== userId) {
      authLogger.warn('Unauthorized session termination attempt', {
        context: 'api-sessions',
        data: {
          userId,
          targetUserId: session.userId,
          sessionId
        }
      });
      
      throw new ApiError(
        ErrorCode.FORBIDDEN,
        'You can only terminate your own sessions'
      );
    }
    
    // Terminate the session
    const success = sessionManager.terminateSession(sessionId);
    
    // Return success status
    return Response.json({ 
      success, 
      message: success ? 'Session terminated successfully' : 'Failed to terminate session'
    });
  },
  {
    allowedMethods: ['DELETE'],
    authOptions: {
      requiredRoles: ['admin', 'user'],
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()],
    validator: validateDeleteRequest
  }
); 