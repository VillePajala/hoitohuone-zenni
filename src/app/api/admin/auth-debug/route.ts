import { NextRequest } from 'next/server';
import { authLogger } from '@/lib/authLogger';
import { parseJwtToken, formatTokenForDisplay } from '@/lib/authUtils';
import { v4 as uuidv4 } from 'uuid';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

interface CookieInfo {
  name: string;
  value: string;
}

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Get debug info from request and context
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId, userId, sessionId } = context;
    const startTime = Date.now();
    
    try {
      // Get cookies from request
      const allCookies: CookieInfo[] = [];
      
      // Extract cookie information safely using request cookies
      request.cookies.getAll().forEach(cookie => {
        allCookies.push({
          name: cookie.name,
          value: cookie.name.includes('token') || 
                 cookie.name.includes('session') || 
                 cookie.name.includes('csrf') ? 
                 '***REDACTED***' : cookie.value,
        });
      });
      
      // Get JWT token details if available
      let tokenInfo = null;
      try {
        // Try to parse any __session cookie
        const sessionCookie = request.cookies.get('__session');
        if (sessionCookie?.value) {
          const parsedToken = parseJwtToken(sessionCookie.value);
          if (parsedToken) {
            tokenInfo = {
              token: formatTokenForDisplay(sessionCookie.value),
              expiresAt: parsedToken.exp ? new Date(parsedToken.exp * 1000).toISOString() : null,
              issuedAt: parsedToken.iat ? new Date(parsedToken.iat * 1000).toISOString() : null,
              claims: parsedToken,
            };
          }
        }
      } catch (tokenError) {
        authLogger.error('Error parsing auth token', {
          context: 'auth-debug-api',
          data: tokenError
        });
        tokenInfo = { error: 'Failed to parse token' };
      }
      
      // Get headers info (safely)
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        // Skip sensitive headers
        if (key.toLowerCase().includes('authorization') ||
            key.toLowerCase().includes('cookie')) {
          headers[key] = '***REDACTED***';
        } else {
          headers[key] = value;
        }
      });
      
      // Construct the response
      const response = {
        debug: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: `${Date.now() - startTime}ms`,
          environment: process.env.NODE_ENV,
        },
        auth: {
          authenticated: !!userId,
          userId: userId || null,
          hasSession: !!sessionId,
          sessionId: sessionId || null,
        },
        request: {
          url: request.url,
          method: request.method,
          headers,
          cookies: allCookies,
        },
        token: tokenInfo,
      };
      
      return Response.json(response);
    } catch (error) {
      authLogger.error('Error generating auth debug information', {
        context: 'auth-debug-api',
        data: {
          requestId,
          error,
        }
      });
      
      return Response.json({
        error: {
          message: 'Failed to generate auth debug information',
        },
        debug: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: `${Date.now() - startTime}ms`,
        }
      }, { status: 500 });
    }
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      requiredRoles: ['admin'],
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
); 