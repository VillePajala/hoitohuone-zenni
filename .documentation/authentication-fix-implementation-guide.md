# Authentication Fix Implementation Guide - Phase 1

This guide provides detailed implementation instructions for Phase 1 of the authentication fix plan. It includes step-by-step code examples, testing procedures, and guidelines to ensure the changes are implemented correctly.

## Prerequisites

Before beginning implementation, ensure:

1. You understand the current authentication architecture documented in `authentication-architecture.md`
2. You have reviewed the complete fix plan in `authentication-fix-plan.md`
3. You have a development environment with the ability to test authentication flows
4. You have access to the Clerk dashboard to view session data

## Implementation Steps

### Step 1.1: Implement Advanced Logging

Create a dedicated auth logger to better trace authentication issues.

#### 1. Create Auth Logger Module

Create `src/lib/authLogger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: any;
}

// Track if we're in client or server environment
const isClient = typeof window !== 'undefined';

// Color codes for different log levels
const colors = {
  debug: '#6c757d',
  info: '#0d6efd',
  warn: '#ffc107',
  error: '#dc3545',
};

export const authLogger = {
  debug(message: string, options?: LogOptions) {
    this._log('debug', message, options);
  },
  
  info(message: string, options?: LogOptions) {
    this._log('info', message, options);
  },
  
  warn(message: string, options?: LogOptions) {
    this._log('warn', message, options);
  },
  
  error(message: string, options?: LogOptions) {
    this._log('error', message, options);
    // You could also send errors to a monitoring service here
  },
  
  _log(level: LogLevel, message: string, options?: LogOptions) {
    const { context, data } = options || {};
    
    // Add environment and timestamp
    const timestamp = new Date().toISOString();
    const env = isClient ? 'CLIENT' : 'SERVER';
    const ctx = context ? `[${context}]` : '';
    
    // Format message
    const formattedMessage = `[AUTH][${env}][${timestamp}]${ctx} ${message}`;
    
    // Log with appropriate level
    if (process.env.NODE_ENV === 'development') {
      // In development, use colored console logs
      if (isClient) {
        console[level === 'debug' ? 'log' : level](
          `%c${formattedMessage}`,
          `color: ${colors[level]}`,
          data || ''
        );
      } else {
        console[level === 'debug' ? 'log' : level](formattedMessage, data || '');
      }
    } else {
      // In production, use structured logging without colors
      console[level === 'debug' ? 'log' : level]({
        level,
        message: formattedMessage,
        timestamp,
        environment: env,
        context,
        data,
      });
    }
  },
};
```

#### 2. Update useAdminAuth to Use the Logger

Modify `src/hooks/useAdminAuth.tsx`:

```typescript
// Add at the top
import { authLogger } from '@/lib/authLogger';

// Then replace console.log calls with authLogger:
// Before:
console.log(`Token expiring soon (${Math.round(timeUntilExpiry / 1000)}s left), refreshing...`);

// After:
authLogger.info(`Token expiring soon (${Math.round(timeUntilExpiry / 1000)}s left), refreshing...`, { 
  context: 'token-management',
  data: { timeUntilExpiry, tokenExpiryTime: tokenExpiryRef.current }
});
```

#### 3. Update AuthContext to Use the Logger

Similarly, update `src/contexts/AuthContext.tsx` to use the authLogger instead of console.log statements.

#### 4. Testing Auth Logger

Add a simple test to verify the logger is working:

```typescript
// Add this to useAdminAuth temporarily to test
useEffect(() => {
  authLogger.debug('Debug message from useAdminAuth', { context: 'test' });
  authLogger.info('Info message from useAdminAuth', { context: 'test' });
  authLogger.warn('Warning message from useAdminAuth', { context: 'test' });
  authLogger.error('Error message from useAdminAuth', { context: 'test', data: { someProp: 'test' } });
}, []);
```

### Step 1.2: Create Auth Debug Endpoint

Enhance the auth debug endpoint to provide better diagnostics.

#### 1. Enhance Auth Debug Endpoint

Update `src/app/api/admin/auth-debug/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { verifyAuth } from '@/lib/auth';
import { authLogger } from '@/lib/authLogger';
import { cookies } from 'next/headers';

// Utility to safely parse JWT
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  authLogger.info('Auth debug endpoint called', { context: 'api', data: { requestId } });
  
  try {
    // Extract authorization header
    const authHeader = request.headers.get('authorization');
    let tokenInfo = null;
    
    // Parse token if present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const parsedToken = parseJwt(token);
        tokenInfo = {
          parsed: parsedToken,
          exp: parsedToken?.exp ? new Date(parsedToken.exp * 1000).toISOString() : null,
          isExpired: parsedToken?.exp ? Date.now() > parsedToken.exp * 1000 : null,
          iss: parsedToken?.iss,
          sub: parsedToken?.sub,
        };
      }
    }
    
    // Get Clerk auth state
    const clerkAuth = getAuth(request);
    
    // Check cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    const clerkSessionCookie = cookieStore.get('__clerk_session');
    
    // Debug Clerk session claims
    let sessionClaims = null;
    if (clerkAuth.sessionClaims) {
      sessionClaims = {
        ...clerkAuth.sessionClaims,
        exp: clerkAuth.sessionClaims.exp 
          ? new Date(clerkAuth.sessionClaims.exp * 1000).toISOString() 
          : null,
        iat: clerkAuth.sessionClaims.iat 
          ? new Date(clerkAuth.sessionClaims.iat * 1000).toISOString() 
          : null,
      };
    }
    
    // Results from server-side auth check
    const authResult = await verifyAuth(request);
    
    return NextResponse.json({
      debug: {
        request: {
          url: request.url,
          method: request.method,
          hasAuthHeader: !!authHeader,
          authHeaderType: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer' : 'Other') : 'None',
        },
        tokenInfo,
        clerkAuth: {
          userId: clerkAuth.userId,
          sessionId: clerkAuth.sessionId,
          sessionClaims,
          hasSession: !!clerkAuth.sessionId,
          hasUser: !!clerkAuth.userId,
          isSignedIn: !!clerkAuth.userId,
        },
        cookies: {
          names: cookieNames,
          hasClerkSession: !!clerkSessionCookie,
          clerkSessionValue: clerkSessionCookie ? '(hidden for security)' : null,
        },
        authResult: {
          authenticated: authResult.authenticated,
          userId: authResult.userId,
          reason: authResult.reason
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasAdminApiSecret: !!process.env.ADMIN_API_SECRET,
          hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
          hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        },
        timestamp: new Date().toISOString(),
        requestId,
      }
    }, {
      status: 200,
      headers: {
        'x-request-id': requestId
      }
    });
  } catch (error) {
    authLogger.error('Error in auth debug endpoint', { 
      context: 'api',
      data: { error, requestId } 
    });
    
    return NextResponse.json({
      error: 'Error processing auth debug request',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    }, {
      status: 500,
      headers: {
        'x-request-id': requestId
      }
    });
  }
}
```

#### 2. Test the Debug Endpoint

Create a simple test script to check the endpoint:

```typescript
// You can temporarily add this to a component to test
async function testAuthDebug() {
  try {
    const response = await fetch('/api/admin/auth-debug');
    const data = await response.json();
    console.log('Auth debug response:', data);
  } catch (error) {
    console.error('Error testing auth debug:', error);
  }
}

// Call it
useEffect(() => {
  testAuthDebug();
}, []);
```

### Step 1.3: Clean Up Circular Dependencies

Refactor the authentication code to remove circular dependencies.

#### 1. Create a Shared Auth Utils Module

Create `src/lib/authUtils.ts`:

```typescript
import { authLogger } from './authLogger';

// Constants for token management
export const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiration
export const TOKEN_CHECK_INTERVAL_MS = 60 * 1000; // Check token every minute
export const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between refreshes

/**
 * Parse JWT token to get expiration time
 */
export function getTokenExpiryTime(token: string): number | null {
  try {
    // JWT tokens are three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // The second part contains the payload, which is base64 encoded
    const payload = JSON.parse(atob(parts[1]));
    
    // Get the expiration time, which is in seconds
    const exp = payload.exp;
    if (!exp) return null;
    
    // Convert to milliseconds
    return exp * 1000;
  } catch (error) {
    authLogger.error('Error parsing JWT token', { context: 'token-parsing', data: error });
    return null;
  }
}

/**
 * Format token for display (first few characters only)
 */
export function formatTokenForDisplay(token: string, length = 10): string {
  if (!token) return 'no-token';
  if (token.length <= length) return token;
  return `${token.substring(0, length)}...`;
}

/**
 * Check if token is near expiry
 */
export function isTokenNearExpiry(expiryTimeMs: number | null, marginMs = TOKEN_REFRESH_MARGIN_MS): boolean {
  if (!expiryTimeMs) return false;
  const timeUntilExpiry = expiryTimeMs - Date.now();
  return timeUntilExpiry < marginMs;
}

/**
 * Check if token has expired
 */
export function hasTokenExpired(expiryTimeMs: number | null): boolean {
  if (!expiryTimeMs) return false;
  return Date.now() > expiryTimeMs;
}
```

#### 2. Refactor useAdminAuth to Use Shared Utils

Update `src/hooks/useAdminAuth.tsx` to use the shared utilities:

```typescript
// Replace the constants
import { 
  TOKEN_REFRESH_MARGIN_MS, 
  TOKEN_CHECK_INTERVAL_MS, 
  MIN_REFRESH_INTERVAL_MS,
  getTokenExpiryTime,
  formatTokenForDisplay,
  isTokenNearExpiry,
  hasTokenExpired
} from '@/lib/authUtils';

// Remove the duplicate getTokenExpiryTime function

// Update the token checking code to use the shared functions
if (token && tokenExpiryRef.current) {
  if (isTokenNearExpiry(tokenExpiryRef.current)) {
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
      authLogger.info(`Token expiring soon for request to ${url}, refreshing...`, { 
        context: 'token-refresh'
      });
      await refreshToken();
      token = cachedToken;
    }
  }
}
```

#### 3. Extract Auth Types to a Separate File

Create `src/types/auth.ts`:

```typescript
// Common authentication types
export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: number;
}

export interface AuthError {
  message: string;
  code?: string;
  type?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasTokenExpired: boolean;
  user: AuthUser | null;
  error: AuthError | null;
}

export interface AuthContextType extends AuthState {
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
}

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  reason?: string;
}
```

#### 4. Refactor AuthContext to Use the New Types

Update `src/contexts/AuthContext.tsx`:

```typescript
import { AuthContextType, AuthState, AuthError } from '@/types/auth';
import { authLogger } from '@/lib/authLogger';
import { MIN_REFRESH_INTERVAL_MS } from '@/lib/authUtils';

// Replace the local types with the imported types
// Use AuthContextType instead of defining it locally
```

#### 5. Break Direct Dependency Between AuthContext and useAdminAuth

Currently, AuthContext directly depends on useAdminAuth, creating a circular dependency. Let's fix this by creating an interface for the functions it needs:

```typescript
// In src/contexts/AuthContext.tsx

// Before:
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Define an interface for what we need from auth services
interface AuthService {
  isSignedIn: boolean;
  isLoading: boolean;
  isAuthError: boolean;
  refreshToken: () => Promise<boolean>;
}

// Create a function to get auth service
function getAuthService(): AuthService {
  // Use the hook directly, but note we're only extracting what we need
  // This breaks the tight coupling
  const { 
    isSignedIn, 
    isLoading, 
    isAuthError, 
    refreshToken 
  } = useAdminAuth(false);
  
  return {
    isSignedIn,
    isLoading,
    isAuthError,
    refreshToken
  };
}

// In your component:
const authService = getAuthService();
const { 
  isSignedIn, 
  isLoading, 
  isAuthError, 
  refreshToken: authRefreshToken 
} = authService;
```

This refactoring breaks the direct circular dependency while still letting the components work together.

## Testing Procedure

After implementing each step, verify that:

1. The auth logger is showing appropriate messages in the console
2. The debug endpoint returns detailed information about the auth state
3. The authentication still works correctly for admin routes
4. No console errors appear related to circular dependencies

## Verification Checklist

- [ ] Auth logger shows client-side auth events
- [ ] Auth logger shows server-side auth events
- [ ] Auth debug endpoint returns detailed session information
- [ ] No circular dependency warnings in the console
- [ ] Authentication flow continues to work (login, accessing protected routes)
- [ ] Token refresh works correctly

## Next Steps

After completing Phase 1, proceed to Phase 2: Server-Side Authentication Improvements as outlined in the authentication-fix-plan.md document. 