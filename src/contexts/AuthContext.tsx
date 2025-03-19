'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AuthContextType, AuthService, AuthError } from '@/types/auth';
import { authLogger } from '@/lib/authLogger';
import { MIN_REFRESH_INTERVAL_MS } from '@/lib/authUtils';
import { ErrorType, logError } from '@/lib/errorHandling';

// Default context values
const defaultContextValue: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  refreshAuth: async () => false,
  hasTokenExpired: false,
  user: null,
  error: null,
  clearError: () => {},
};

// Create context with default values
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  autoRefreshInterval?: number; // in milliseconds
}

// Create a function to get auth service without directly importing useAdminAuth
// This breaks the circular dependency
function getAuthService(): AuthService {
  // Use the Clerk hook directly for basic auth state
  const { isSignedIn, isLoaded } = useAuth();
  
  // We'll implement a simplified version of the refreshToken function
  // that will be replaced by useAdminAuth's implementation when it's used
  const refreshToken = async () => {
    authLogger.info('AuthContext: Placeholder refreshToken called - will be replaced by actual implementation', {
      context: 'auth-context'
    });
    return false;
  };
  
  return {
    isSignedIn: !!isSignedIn,
    isLoading: !isLoaded,
    isAuthError: false, // Default to false
    refreshToken
  };
}

export function AuthProvider({ 
  children, 
  autoRefreshInterval = 15 * 60 * 1000 // Default: 15 minutes
}: AuthProviderProps) {
  // Get auth service (breaking the circular dependency)
  const authService = getAuthService();
  
  // When this is used with useAdminAuth, the actual implementation
  // will be provided after the context is used
  const { 
    isSignedIn, 
    isLoading, 
    isAuthError, 
    refreshToken: authRefreshToken 
  } = authService;
  
  const [error, setError] = useState<AuthError | null>(null);
  const [hasTokenExpired, setHasTokenExpired] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const lastRefreshTimeRef = useRef<number>(0);
  
  // Setup auto refresh timer with rate limiting
  useEffect(() => {
    if (!isSignedIn) return;
    
    let isMounted = true; // Track if component is still mounted
    
    const refreshTimer = setInterval(() => {
      if (!isMounted) return; // Skip if component unmounted
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      
      // Only trigger auto-refresh if we haven't refreshed recently
      if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
        authLogger.info('Auto refreshing auth token...', { context: 'auth-context' });
        setRefreshCounter(prev => prev + 1);
      } else {
        authLogger.debug(`Skipping auto-refresh, last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`, { 
          context: 'auth-context'
        });
      }
    }, autoRefreshInterval);
    
    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
    };
  }, [isSignedIn, autoRefreshInterval]);

  // Handle token refresh when triggered
  useEffect(() => {
    if (refreshCounter === 0) return; // Skip initial render
    if (!isSignedIn) return; // Don't refresh if not signed in
    
    let isMounted = true;
    
    const doRefresh = async () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      
      // Skip refresh if we just refreshed
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
        authLogger.debug(`Skipping auto-refresh - last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`, { 
          context: 'auth-context'
        });
        return;
      }
      
      authLogger.info(`AuthContext: Performing refresh #${refreshCounter}`, { context: 'auth-context' });
      lastRefreshTimeRef.current = now;
      
      try {
        const success = await authRefreshToken();
        
        if (isMounted) {
          if (success) {
            setHasTokenExpired(false);
            setError(null);
            authLogger.info('AuthContext: Token refresh successful', { context: 'auth-context' });
          } else {
            setHasTokenExpired(true);
            if (!error) {
              setError({
                message: 'Failed to refresh authentication token',
                type: ErrorType.AUTHENTICATION
              });
            }
            authLogger.warn('AuthContext: Token refresh failed', { context: 'auth-context' });
          }
        }
      } catch (err) {
        if (isMounted) {
          setHasTokenExpired(true);
          setError({
            message: err instanceof Error ? err.message : 'Unknown error refreshing token',
            type: ErrorType.AUTHENTICATION
          });
          authLogger.error('AuthContext: Error refreshing token', { 
            context: 'auth-context',
            data: err
          });
        }
      }
    };
    
    doRefresh();
    
    return () => {
      isMounted = false;
    };
  }, [refreshCounter, isSignedIn, authRefreshToken, error]);

  // Public method to refresh auth
  const refreshAuth = async () => {
    authLogger.info('Manual auth refresh requested', { context: 'auth-context' });
    try {
      // Increment counter to trigger the refresh effect
      setRefreshCounter(prev => prev + 1);
      return await authRefreshToken();
    } catch (error) {
      logError(error, 'Manual auth refresh');
      return false;
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Create context value
  const value: AuthContextType = {
    isAuthenticated: isSignedIn, 
    isLoading,
    refreshAuth,
    hasTokenExpired,
    user: null, // Will be implemented in a future update
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 