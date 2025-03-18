'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ErrorType, logError } from '@/lib/errorHandling';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<boolean>;
  hasTokenExpired: boolean;
  error: Error | null;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  refreshAuth: async () => false,
  hasTokenExpired: false,
  error: null,
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  autoRefreshInterval?: number; // in milliseconds
}

export function AuthProvider({ 
  children, 
  autoRefreshInterval = 15 * 60 * 1000 // Default: 15 minutes
}: AuthProviderProps) {
  const { 
    isSignedIn, 
    isLoading, 
    isAuthError, 
    refreshToken 
  } = useAdminAuth(false); // Don't auto-redirect here
  
  const [error, setError] = useState<Error | null>(null);
  const [hasTokenExpired, setHasTokenExpired] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const lastRefreshTimeRef = useRef<number>(0);
  
  // Minimum refresh interval to prevent refresh storms
  const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds
  
  // Setup auto refresh timer with rate limiting
  useEffect(() => {
    if (!isSignedIn) return;
    
    const refreshTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      
      // Only trigger auto-refresh if we haven't refreshed recently
      if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
        console.log('Auto refreshing auth token...');
        setRefreshCounter(prev => prev + 1);
      } else {
        console.log(`Skipping auto-refresh, last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`);
      }
    }, autoRefreshInterval);
    
    return () => clearInterval(refreshTimer);
  }, [isSignedIn, autoRefreshInterval]);

  // Handle token refresh when triggered
  useEffect(() => {
    if (refreshCounter > 0 && isSignedIn) {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      
      // Skip refresh if we just refreshed
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
        console.log(`Skipping managed refresh, last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`);
        return;
      }
      
      refreshToken()
        .then(success => {
          if (success) {
            lastRefreshTimeRef.current = Date.now();
            setHasTokenExpired(false);
            setError(null);
          } else {
            setHasTokenExpired(true);
            setError(new Error('Failed to refresh authentication token'));
          }
        })
        .catch(err => {
          logError(err, 'Auth refresh failed');
          setHasTokenExpired(true);
          setError(err instanceof Error ? err : new Error('Unknown error refreshing token'));
        });
    }
  }, [refreshCounter, isSignedIn, refreshToken]);

  // Reset token expiry state if user signs in
  useEffect(() => {
    if (isSignedIn) {
      setHasTokenExpired(false);
    }
  }, [isSignedIn]);

  // Update error state based on auth hook
  useEffect(() => {
    if (isAuthError) {
      setError(new Error('Authentication required'));
      setHasTokenExpired(true);
    }
  }, [isAuthError]);

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Trigger a manual refresh
  const refreshAuth = async () => {
    try {
      setError(null);
      
      // Prevent refreshing too frequently
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
        console.log(`Skipping manual refresh, last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`);
        return !hasTokenExpired; // Return current auth state
      }
      
      const success = await refreshToken();
      if (success) {
        lastRefreshTimeRef.current = now;
        setHasTokenExpired(false);
      } else {
        setHasTokenExpired(true);
      }
      return success;
    } catch (err) {
      logError(err, 'Manual auth refresh failed');
      setError(err instanceof Error ? err : new Error('Unknown error refreshing token'));
      setHasTokenExpired(true);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!isSignedIn,
        isLoading,
        refreshAuth,
        hasTokenExpired,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 