'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

/**
 * Hook for handling admin authentication
 * Provides functions to make authenticated API requests and tracks auth state
 */
export function useAdminAuth(redirectToLogin = false) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [isAuthError, setIsAuthError] = useState(false);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
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
        getToken().then(token => {
          if (token) {
            setCachedToken(token);
            console.log('Auth token cached successfully');
          }
        }).catch(err => {
          console.error('Failed to cache auth token:', err);
        });
      }
    }
  }, [isLoaded, isSignedIn, redirectToLogin, router, getToken]);

  /**
   * Make an authenticated fetch request
   */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      // Try to use cached token first for better performance
      let token = cachedToken;
      
      // If no cached token or we want to ensure fresh token, get a new one
      if (!token) {
        console.log(`No cached token found, fetching new token for ${url}`);
        token = await getToken();
        if (token) {
          setCachedToken(token);
        }
      }
      
      if (!token) {
        console.error('No auth token available for request to:', url);
        setIsAuthError(true);
        throw new Error('Authentication required');
      }

      console.log(`Making authenticated request to ${url}`);
      
      const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.error('Unauthorized response received, token may be invalid');
        // Clear cached token and try to get a fresh one
        setCachedToken(null);
        
        // Only throw if we can't immediately refresh the token
        setIsAuthError(true);
        throw new Error('Unauthorized - Please sign in to access this resource');
      }

      return response;
    } catch (error) {
      console.error('Auth fetch error:', error);
      throw error;
    }
  }, [getToken, cachedToken]);

  /**
   * Helper for GET requests
   */
  const authGet = useCallback(async (url: string) => {
    const response = await authFetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(errorData.error || `Failed to fetch from ${url}: ${response.status}`);
    }
    
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(errorData.error || `Failed to post to ${url}: ${response.status}`);
    }
    
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(errorData.error || `Failed to delete from ${url}: ${response.status}`);
    }
    
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

  /**
   * Force token refresh 
   */
  const refreshToken = useCallback(async () => {
    try {
      setCachedToken(null);
      const newToken = await getToken({ skipCache: true });
      if (newToken) {
        setCachedToken(newToken);
        console.log('Auth token refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }, [getToken]);

  return {
    isLoading: !isLoaded,
    isAuthError,
    isSignedIn,
    authFetch,
    authGet,
    authPost,
    authDelete,
    redirectToLoginPage,
    refreshToken,
  };
} 