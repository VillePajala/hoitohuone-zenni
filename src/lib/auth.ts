import { getAuth as getClerkAuth } from '@clerk/nextjs/server';
import { log } from '@/lib/api';
import { NextRequest } from 'next/server';

interface AuthResult {
  authenticated: boolean;
  userId?: string;
  reason?: string;
}

/**
 * Validates an API key against the ADMIN_API_SECRET
 * This can be used in both development and production
 */
function validateApiKey(token: string): boolean {
  if (!token) return false;
  
  const validApiKey = process.env.ADMIN_API_SECRET;
  return !!validApiKey && token === validApiKey;
}

/**
 * Extracts the API key from an authorization header
 */
function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7).trim();
  return token || null;
}

/**
 * Verifies authentication for any request
 * Supports both Clerk authentication and API key authentication
 */
export async function verifyAuth(request: Request | NextRequest): Promise<AuthResult> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    log.info('Auth header received', { 
      hasAuthHeader: !!authHeader,
      headerPrefix: authHeader ? authHeader.substring(0, 10) + '...' : 'none'
    });
    
    // Check for API key authentication first
    const apiKey = extractApiKey(authHeader);
    if (apiKey && validateApiKey(apiKey)) {
      log.info('User authenticated via API key');
      return {
        authenticated: true,
        userId: 'api-user'
      };
    }
    
    // If no valid API key, try Clerk authentication
    let userId: string | null = null;
    
    // Handle Clerk auth differently depending on request type
    if (request instanceof NextRequest) {
      // If it's a NextRequest, use it directly with Clerk
      const auth = getClerkAuth(request);
      userId = auth.userId;
      
      // Check if Clerk authenticated the user
      if (userId) {
        log.info('User authenticated via Clerk session', { userId });
        return {
          authenticated: true,
          userId
        };
      }
      
      log.info('NextRequest Clerk auth failed', { 
        hasUserId: false,
        authHeaderType: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer' : 'Other') : 'None'
      });
    } else {
      // For standard Request, Clerk auth would be handled by middleware
      // We've already checked for API key above
      log.info('Standard Request with no valid API key');
    }
    
    // If we've reached here, no authentication succeeded
    log.warn('No valid authentication found in request');
    return {
      authenticated: false,
      reason: 'No valid authentication credentials provided'
    };
  } catch (error) {
    log.error('Error in auth check', { error });
    return {
      authenticated: false,
      reason: 'Authentication verification failed'
    };
  }
} 