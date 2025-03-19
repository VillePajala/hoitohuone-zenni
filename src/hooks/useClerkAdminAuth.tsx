'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Simple hook for admin authentication based purely on Clerk
 * @param redirectToLogin Whether to redirect to login if not authenticated
 */
export function useClerkAdminAuth(redirectToLogin = false) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn && redirectToLogin) {
      const pathname = window.location.pathname;
      // Prevent redirect loops
      if (!pathname.includes('/admin/sign-in') && !pathname.includes('/admin/logout')) {
        // Add redirect_url to return to the current page
        const redirectUrl = `/admin/sign-in?redirect_url=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
      }
    }
  }, [isLoaded, isSignedIn, redirectToLogin, router]);

  /**
   * Make an authenticated fetch request - Clerk will handle auth headers automatically
   */
  const authFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        // Handle unauthorized
        if (redirectToLogin) {
          router.push('/admin/sign-in');
        }
        throw new Error('Unauthorized');
      }
      
      return response;
    } catch (error) {
      console.error('Auth fetch error:', error);
      throw error;
    }
  };

  return {
    isLoaded,
    isSignedIn,
    user,
    authFetch,
  };
} 