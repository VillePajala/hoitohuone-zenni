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
      }
    }
  }, [isLoaded, isSignedIn, redirectToLogin, router]);

  /**
   * Make an authenticated fetch request
   */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      if (!token) {
        setIsAuthError(true);
        throw new Error('Authentication required');
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
        setIsAuthError(true);
        throw new Error('Unauthorized - Please sign in to access this resource');
      }

      return response;
    } catch (error) {
      console.error('Auth fetch error:', error);
      throw error;
    }
  }, [getToken]);

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

  return {
    isLoading: !isLoaded,
    isAuthError,
    isSignedIn,
    authFetch,
    authGet,
    authPost,
    authDelete,
    redirectToLoginPage,
  };
} 