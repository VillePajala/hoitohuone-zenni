'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ErrorType, createError, parseApiError, logError } from '@/lib/errorHandling';
import { authLogger } from '@/lib/authLogger';
import { AuthService } from '@/types/auth';
import { 
  getTokenExpiryTime, 
  TOKEN_REFRESH_MARGIN_MS, 
  TOKEN_CHECK_INTERVAL_MS, 
  MIN_REFRESH_INTERVAL_MS,
  formatTokenForDisplay
} from '@/lib/authUtils';

/**
 * Hook for handling admin authentication
 * Provides functions to make authenticated API requests and tracks auth state
 */
export function useAdminAuth(redirectToLogin = false): AuthService {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [isAuthError, setIsAuthError] = useState(false);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const tokenExpiryRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const router = useRouter();

  // Check if user is authenticated when the component mounts
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        setIsAuthError(true);
        
        if (redirectToLogin && !isRedirecting) {
          // Prevent redirect loops by checking URL
          const pathname = window.location.pathname;
          if (!pathname.includes('/admin/sign-in') && !pathname.includes('/admin/logout')) {
            setIsRedirecting(true);
            authLogger.info(`Redirecting unauthenticated user from ${pathname} to sign-in`, {
              context: 'admin-auth-hook'
            });
            
            // Add redirect_url to return to the current page
            const redirectUrl = `/admin/sign-in?redirect_url=${encodeURIComponent(pathname)}`;
            router.push(redirectUrl);
          }
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
  }, [isLoaded, isSignedIn, redirectToLogin, router, isRedirecting]);

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
      authLogger.info(`Skipping refresh - last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`, {
        context: 'token-management'
      });
      return;
    }
    
    // If token is close to expiring or already expired, refresh it
    if (timeUntilExpiry < TOKEN_REFRESH_MARGIN_MS && timeUntilExpiry > -60000) {
      // Only refresh if expiry is between the margin and -60 seconds
      // This prevents endless refresh cycles for very old tokens
      authLogger.info(`Token expiring soon (${Math.round(timeUntilExpiry / 1000)}s left), refreshing...`, {
        context: 'token-management'
      });
      await refreshToken();
    } else if (timeUntilExpiry <= -60000) {
      // If token is expired by more than a minute, invalidate it
      authLogger.info(`Token expired ${Math.abs(Math.round(timeUntilExpiry / 1000))}s ago, invalidating...`, {
        context: 'token-management'
      });
      setCachedToken(null);
      tokenExpiryRef.current = null;
      setIsAuthError(true);
    } else {
      authLogger.info(`Token valid for ${Math.round(timeUntilExpiry / 1000)}s, no refresh needed`, {
        context: 'token-management'
      });
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
      authLogger.info(`Token will expire in ${Math.round(timeUntilExpiry / 1000)}s`, {
        context: 'token-management'
      });
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
          authLogger.info(`Skipping refresh - last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`, {
            context: 'token-management'
          });
          return cachedToken !== null;
        }
        
        authLogger.info('Refreshing auth token...', {
          context: 'token-management'
        });
      }
      
      // Mark last refresh time at the beginning to prevent parallel refreshes
      lastRefreshTimeRef.current = now;
      
      try {
        // First try Clerk token
        const newToken = await getToken({ skipCache: true });
        
        if (newToken) {
          setCachedToken(newToken);
          updateTokenExpiry(newToken);
          setIsAuthError(false);
          
          if (!silent) {
            authLogger.info('Auth token refreshed successfully from Clerk', {
              context: 'token-management'
            });
          }
          return true;
        }
        
        // If Clerk token fails, try API key as fallback
        if (typeof window !== 'undefined') {
          const windowAny = window as any;
          const apiKey = windowAny.ADMIN_API_SECRET;
          
          if (apiKey) {
            authLogger.info('Using API key as fallback after Clerk refresh failed', {
              context: 'token-management'
            });
            setCachedToken(apiKey);
            // No expiry for API keys
            tokenExpiryRef.current = Date.now() + (24 * 60 * 60 * 1000); // 24hr
            setIsAuthError(false);
            return true;
          }
        }
        
        // No token found
        setCachedToken(null);
        if (!silent) {
          // Only set auth error if not a silent refresh
          setIsAuthError(true);
        }
        return false;
      } catch (error) {
        authLogger.error('Error refreshing token', { 
          context: 'token-management',
          data: error
        });
        setCachedToken(null);
        if (!silent) {
          // Only set auth error if not a silent refresh
          setIsAuthError(true);
        }
        return false;
      }
    } catch (error) {
      if (!silent) {
        logError(error, 'refreshToken');
        // Only set auth error if not a silent refresh
        setIsAuthError(true);
      }
      return false;
    }
  }, [getToken, updateTokenExpiry, cachedToken]);

  /**
   * Make an authenticated fetch request
   */
  const authFetch = useCallback(async (url: string, options: RequestInit & { __retried?: boolean } = {}) => {
    try {
      // Try to use cached token first instead of checking expiry every time
      let token = cachedToken;
      let isApiKey = false;
      
      // Only check expiry if we have a token and an expiry time
      if (token && tokenExpiryRef.current) {
        const now = Date.now();
        const timeUntilExpiry = tokenExpiryRef.current - now;
        
        // If close to expiring, refresh (but not if we just refreshed)
        if (timeUntilExpiry < TOKEN_REFRESH_MARGIN_MS) {
          const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
          if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
            authLogger.info(`Token expiring soon for request to ${url}, refreshing...`, {
              context: 'token-management'
            });
            await refreshToken();
            token = cachedToken; // Get the refreshed token
          }
        }
      }
      
      // If no cached token, get a new one
      if (!token) {
        authLogger.info(`No cached token found, fetching new token for ${url}`, {
          context: 'token-management'
        });
        try {
          token = await getToken();
          if (token) {
            setCachedToken(token);
            updateTokenExpiry(token);
            lastRefreshTimeRef.current = Date.now();
          }
        } catch (tokenError) {
          authLogger.error("Error getting token", { 
            context: 'token-management',
            data: tokenError
          });
        }
      }
      
      // If still no token, check for API key as fallback
      if (!token) {
        // First try window global
        if (typeof window !== 'undefined') {
          // Access as any to avoid TypeScript errors
          const windowAny = window as any;
          if (windowAny.ADMIN_API_SECRET) {
            authLogger.info('Using API key from window global', {
              context: 'token-management'
            });
            token = windowAny.ADMIN_API_SECRET;
            isApiKey = true;
          } else {
            // Try meta tag as backup
            try {
              const apiKeyMeta = document.querySelector('meta[name="admin-api-secret"]');
              if (apiKeyMeta) {
                const metaApiKey = apiKeyMeta.getAttribute('content');
                if (metaApiKey) {
                  authLogger.info('Using API key from meta tag', {
                    context: 'token-management'
                  });
                  token = metaApiKey;
                  isApiKey = true;
                  
                  // Cache it on window for future use
                  windowAny.ADMIN_API_SECRET = metaApiKey;
                }
              }
            } catch (e) {
              authLogger.error('Could not get API key from meta tag', { 
                context: 'token-management',
                data: e
              });
            }
          }
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
      
      // Log token details for debugging (first 10 chars only for security)
      authLogger.info(`Using ${isApiKey ? 'API key' : 'auth token'} for ${url}: ${token.substring(0, 10)}...`, {
        context: 'token-management'
      });
      
      const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`,
      };

      authLogger.info(`Sending authenticated request to ${url}`, {
        context: 'token-management'
      });
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',  // Include cookies with the request
      });

      if (!response.ok) {
        const status = response.status;
        authLogger.error(`API request failed with status ${status} for ${url}`, {
          context: 'token-management'
        });
        
        // Try to parse response body for better error details
        try {
          const errorBody = await response.clone().text();
          authLogger.error(`Error response body`, {
            context: 'token-management',
            data: errorBody
          });
        } catch (e) {
          authLogger.error(`Could not read error response body`, {
            context: 'token-management',
            data: e
          });
        }
      }

      if (response.status === 401) {
        logError('Unauthorized response received, token may be invalid', url);
        
        // Only clear token if we've tried to refresh and still got 401
        if (options.__retried) {
          authLogger.info('Still getting 401 after token refresh, clearing token cache', {
            context: 'token-management'
          });
          setCachedToken(null);
          tokenExpiryRef.current = null;
          setIsAuthError(true);
          
          throw createError(
            ErrorType.AUTHENTICATION,
            'Your session has expired or is invalid. Please sign in again.'
          );
        }
        
        // Try to refresh the token on auth error, but prevent infinite loops
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
        
        // Only try to refresh once every 30 seconds to avoid infinite loops
        if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
          authLogger.info('Attempting to refresh token after 401 response', {
            context: 'token-management'
          });
          try {
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry the request with new token
              authLogger.info('Token refreshed successfully, retrying request', {
                context: 'token-management'
              });
              // Limit retry to just once by adding a retry flag to options
              if (!options.__retried) {
                return authFetch(url, { ...options, __retried: true });
              } else {
                authLogger.info('Already retried once, not retrying again to avoid loops', {
                  context: 'token-management'
                });
              }
            } else {
              authLogger.error('Token refresh failed after 401 response', {
                context: 'token-management'
              });
              setIsAuthError(true);
            }
          } catch (refreshError) {
            authLogger.error('Error refreshing token', { 
              context: 'token-management',
              data: refreshError
            });
            setIsAuthError(true);
          }
        } else {
          authLogger.info(`Not refreshing token - last refresh was too recent (${Math.round(timeSinceLastRefresh / 1000)}s ago)`, {
            context: 'token-management'
          });
        }
        
        // Return a more descriptive error
        throw createError(
          ErrorType.AUTHENTICATION,
          'Your session has expired or is invalid. Please sign in again.'
        );
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
   * Make an authenticated GET request
   */
  const authGet = useCallback(async (url: string) => {
    try {
      const response = await authFetch(url);
      
      if (!response.ok) {
        // If token issues and token refreshed, authFetch will have handled it
        if (response.status === 401) {
          setIsAuthError(true);
          throw createError(
            ErrorType.AUTHENTICATION,
            'Authentication failed. Please sign in again.'
          );
        }
        
        throw await parseApiError(response);
      }
      
      // Reset auth error flag on successful request
      setIsAuthError(false);
      return await response.json();
    } catch (error) {
      // Handle errors with proper TypeScript checking
      const appError = error as Error & { type?: ErrorType };
      const isAuthenticationError = appError?.name === 'ApplicationError' && 
                                   appError?.type === ErrorType.AUTHENTICATION;
                                   
      // Only set auth error if it's a new authentication error
      if (isAuthenticationError && !isAuthError) {
        setIsAuthError(true);
        authLogger.error('Authentication error occurred', { 
          context: 'token-management',
          data: error
        });
        
        // Redirect to login page if needed and not already there
        if (redirectToLogin && !isRedirecting) {
          // Check current URL to prevent redirect loops
          const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
          if (!pathname.includes('/admin/sign-in') && !pathname.includes('/admin/logout')) {
            setIsRedirecting(true);
            authLogger.info('Redirecting to login page due to auth error', {
              context: 'token-management',
              data: { currentPath: pathname }
            });
            
            // Add redirect_url to return after login
            const redirectUrl = `/admin/sign-in?redirect_url=${encodeURIComponent(pathname)}`;
            router.push(redirectUrl);
          }
        }
      }
      
      throw error;
    }
  }, [authFetch, isAuthError, redirectToLogin, router, isRedirecting]);

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
      credentials: 'include', // Include cookies with the request
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
      credentials: 'include', // Include cookies with the request
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
      credentials: 'include', // Include cookies with the request
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
    if (isRedirecting) return; // Prevent multiple redirects
    
    // Check current URL to prevent redirect loops
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    if (pathname.includes('/admin/sign-in') || pathname.includes('/admin/logout')) {
      return; // Already at login or logout page
    }
    
    setIsRedirecting(true);
    authLogger.info(`Manual redirect to login page from ${pathname}`, {
      context: 'admin-auth-hook'
    });
    
    const redirectUrl = `/admin/sign-in?redirect_url=${encodeURIComponent(pathname)}`;
    router.push(redirectUrl);
  }, [router, isRedirecting]);

  return {
    isLoading: !isLoaded,
    isAuthError,
    isSignedIn: !!isSignedIn,
    isRedirecting,
    authFetch,
    authGet,
    authPost,
    authPatch,
    authDelete,
    redirectToLoginPage,
    refreshToken: () => refreshToken(false),
  };
} 