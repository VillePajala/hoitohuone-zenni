'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ErrorType, createError, parseApiError, logError } from '@/lib/errorHandling';

// Constants for token management
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiration
const TOKEN_CHECK_INTERVAL_MS = 60 * 1000; // Check token every minute
const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between refreshes

/**
 * Parse JWT token to get expiration time
 */
function getTokenExpiryTime(token: string): number | null {
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
    logError(error, 'Error parsing JWT token');
    return null;
  }
}

/**
 * Hook for handling admin authentication
 * Provides functions to make authenticated API requests and tracks auth state
 */
export function useAdminAuth(redirectToLogin = false) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [isAuthError, setIsAuthError] = useState(false);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const tokenExpiryRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const router = useRouter();

  // Check if user is authenticated when the component mounts
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        setIsAuthError(true);
        if (redirectToLogin) {
          router.push('/admin/sign-in');
        }
      } else {
        setIsAuthError(false);
        // Pre-fetch and cache the token when user is signed in
        refreshToken(true);
      }
    }
    
    // Clean up timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isLoaded, isSignedIn, redirectToLogin, router]);

  // Setup token refresh timer
  useEffect(() => {
    if (isSignedIn && !refreshTimerRef.current) {
      refreshTimerRef.current = setInterval(() => {
        checkAndRefreshToken();
      }, TOKEN_CHECK_INTERVAL_MS);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isSignedIn]);

  /**
   * Check if token needs refreshing and refresh if necessary
   */
  const checkAndRefreshToken = useCallback(async () => {
    // Don't check if there's no expiry time
    if (!tokenExpiryRef.current) return;
    
    const now = Date.now();
    const timeUntilExpiry = tokenExpiryRef.current - now;
    
    // Prevent refreshing too frequently
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      console.log(`Skipping refresh - last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`);
      return;
    }
    
    // If token is close to expiring or already expired, refresh it
    if (timeUntilExpiry < TOKEN_REFRESH_MARGIN_MS && timeUntilExpiry > -60000) {
      // Only refresh if expiry is between the margin and -60 seconds
      // This prevents endless refresh cycles for very old tokens
      console.log(`Token expiring soon (${Math.round(timeUntilExpiry / 1000)}s left), refreshing...`);
      await refreshToken();
    } else if (timeUntilExpiry <= -60000) {
      // If token is expired by more than a minute, invalidate it
      console.log(`Token expired ${Math.abs(Math.round(timeUntilExpiry / 1000))}s ago, invalidating...`);
      setCachedToken(null);
      tokenExpiryRef.current = null;
      setIsAuthError(true);
    } else {
      console.log(`Token valid for ${Math.round(timeUntilExpiry / 1000)}s, no refresh needed`);
    }
  }, []);

  /**
   * Update token expiry time based on current token
   */
  const updateTokenExpiry = useCallback((token: string | null) => {
    if (!token) {
      tokenExpiryRef.current = null;
      return;
    }
    
    const expiryTime = getTokenExpiryTime(token);
    tokenExpiryRef.current = expiryTime;
    
    if (expiryTime) {
      const timeUntilExpiry = expiryTime - Date.now();
      console.log(`Token will expire in ${Math.round(timeUntilExpiry / 1000)}s`);
    }
  }, []);

  /**
   * Force token refresh 
   */
  const refreshToken = useCallback(async (silent = false) => {
    try {
      const now = Date.now();
      
      // Prevent refreshing too frequently (except for silent initial refresh)
      if (!silent) {
        const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
        if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
          console.log(`Skipping refresh - last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`);
          return cachedToken !== null;
        }
        
        console.log('Refreshing auth token...');
      }
      
      lastRefreshTimeRef.current = now;
      setCachedToken(null);
      const newToken = await getToken({ skipCache: true });
      
      if (newToken) {
        setCachedToken(newToken);
        updateTokenExpiry(newToken);
        
        if (!silent) {
          console.log('Auth token refreshed successfully');
        }
        return true;
      }
      
      return false;
    } catch (error) {
      if (!silent) {
        logError(error, 'refreshToken');
      }
      return false;
    }
  }, [getToken, updateTokenExpiry]);

  /**
   * Make an authenticated fetch request
   */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      // Try to use cached token first instead of checking expiry every time
      let token = cachedToken;
      
      // Only check expiry if we have a token and an expiry time
      if (token && tokenExpiryRef.current) {
        const now = Date.now();
        const timeUntilExpiry = tokenExpiryRef.current - now;
        
        // If close to expiring, refresh (but not if we just refreshed)
        if (timeUntilExpiry < TOKEN_REFRESH_MARGIN_MS) {
          const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
          if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
            console.log(`Token expiring soon for request to ${url}, refreshing...`);
            await refreshToken();
            token = cachedToken; // Get the refreshed token
          }
        }
      }
      
      // If no cached token, get a new one
      if (!token) {
        console.log(`No cached token found, fetching new token for ${url}`);
        token = await getToken();
        if (token) {
          setCachedToken(token);
          updateTokenExpiry(token);
          lastRefreshTimeRef.current = Date.now();
        }
      }
      
      if (!token) {
        logError('No auth token available for request', url);
        setIsAuthError(true);
        throw createError(
          ErrorType.AUTHENTICATION,
          'Authentication required. Please sign in to continue.'
        );
      }
      
      const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        logError('Unauthorized response received, token may be invalid', url);
        // Clear cached token and try to get a fresh one
        setCachedToken(null);
        tokenExpiryRef.current = null;
        
        // Try to refresh the token on auth error, but prevent infinite loops
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
        
        if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry the request with new token
            return authFetch(url, options);
          }
        } else {
          console.log(`Skipping token refresh after 401 - refreshed ${Math.round(timeSinceLastRefresh / 1000)}s ago`);
        }
        
        // If refresh failed or was skipped, throw auth error
        setIsAuthError(true);
        throw await parseApiError(response);
      }

      if (!response.ok) {
        throw await parseApiError(response);
      }

      return response;
    } catch (error: unknown) {
      // Handle non-API errors
      if (error instanceof Error) {
        // Check if this is not one of our ApplicationErrors
        if (error.name !== 'ApplicationError') {
          logError(error, `authFetch to ${url}`);
          throw createError(
            ErrorType.NETWORK,
            'Failed to connect to the server. Please check your connection.'
          );
        }
      } else {
        // For non-Error objects, create a generic error
        logError(error, `authFetch to ${url} (unknown error type)`);
        throw createError(
          ErrorType.UNKNOWN,
          'An unexpected error occurred. Please try again.'
        );
      }
      throw error;
    }
  }, [getToken, cachedToken, refreshToken, updateTokenExpiry]);

  /**
   * Helper for GET requests
   */
  const authGet = useCallback(async (url: string) => {
    const response = await authFetch(url);
    return response.json();
  }, [authFetch]);

  /**
   * Helper for POST requests
   */
  const authPost = useCallback(async (url: string, data: any) => {
    const response = await authFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response.json();
  }, [authFetch]);

  /**
   * Helper for PATCH requests
   */
  const authPatch = useCallback(async (url: string, data: any) => {
    const response = await authFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response.json();
  }, [authFetch]);

  /**
   * Helper for DELETE requests
   */
  const authDelete = useCallback(async (url: string) => {
    const response = await authFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // For DELETE operations, many endpoints return 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    return response.json().catch(() => null); // Handle empty responses
  }, [authFetch]);

  /**
   * Redirect to login page
   */
  const redirectToLoginPage = useCallback(() => {
    router.push('/admin/sign-in');
  }, [router]);

  return {
    isLoading: !isLoaded,
    isAuthError,
    isSignedIn,
    authFetch,
    authGet,
    authPost,
    authPatch,
    authDelete,
    redirectToLoginPage,
    refreshToken: () => refreshToken(false),
  };
} 