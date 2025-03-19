'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Menu, X, Clock, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthenticationError } from '@/components/ui/ErrorDisplay';
import { ErrorType, createError } from '@/lib/errorHandling';
import AuthStatus from '@/components/admin/AuthStatus';
import { useAuthContext } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const { isAuthenticated, hasTokenExpired, error: authError, refreshAuth } = useAuthContext();
  const lastRefreshAttemptRef = useRef<number>(0);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');

  // Don't show admin layout on auth pages
  const isAuthPage = pathname === '/admin/login' || 
                    pathname === '/admin/sign-in' || 
                    pathname === '/admin/sign-up' ||
                    pathname === '/admin/logout';

  // Handle redirection to sign-in page with error message when auth fails
  const redirectToSignIn = (errorMessage: string) => {
    // Only redirect if we're in a browser environment
    if (typeof window !== 'undefined') {
      const encodedError = encodeURIComponent(errorMessage);
      const encodedRedirect = encodeURIComponent(pathname || '');
      router.push(`/admin/sign-in?error=${encodedError}&redirect_url=${encodedRedirect}`);
    }
  };

  // Use an effect for handling auth state and redirects
  useEffect(() => {
    // Skip for auth pages
    if (isAuthPage) return;

    // If we should redirect, do it
    if (shouldRedirect && redirectMessage) {
      redirectToSignIn(redirectMessage);
      return;
    }

    // Check auth status
    if (!isAuthenticated || hasTokenExpired || authError) {
      const now = Date.now();
      const canAttemptRefresh = now - lastRefreshAttemptRef.current > 10000;
      
      if (canAttemptRefresh && typeof window !== 'undefined') {
        // Try to refresh token
        lastRefreshAttemptRef.current = now;
        
        refreshAuth().then(success => {
          if (!success && typeof window !== 'undefined') {
            const message = authError?.message || 'Your session has expired. Please sign in again.';
            setShouldRedirect(true);
            setRedirectMessage(message);
          }
        }).catch(() => {
          if (typeof window !== 'undefined') {
            setShouldRedirect(true);
            setRedirectMessage('Authentication failed. Please sign in again.');
          }
        });
      } else {
        // Can't refresh, prepare for redirect
        const message = authError?.message || 'Your session has expired. Please sign in again.';
        setShouldRedirect(true);
        setRedirectMessage(message);
      }
    } else {
      // Auth is fine, clear any pending redirects
      setShouldRedirect(false);
      setRedirectMessage('');
    }
  }, [isAuthenticated, hasTokenExpired, authError, isAuthPage, pathname, refreshAuth, redirectMessage, shouldRedirect]);

  // Navigation effect
  useEffect(() => {
    if (targetPath === pathname) {
      setIsNavigating(false);
      setTargetPath(null);
    }
  }, [pathname, targetPath]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  // If there's an auth issue and we're trying to refresh or redirect
  if (!isAuthenticated || hasTokenExpired || authError || shouldRedirect) {
    return <SkeletonLoader type="dashboard" />;
  }
  
  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    if (path === pathname) return;
    
    setIsNavigating(true);
    setTargetPath(path);
    
    // For client-side navigation
    if (typeof window !== 'undefined') {
      router.push(path);
    }
  };
  
  // Get skeleton type based on current path
  const getSkeletonType = () => {
    if (pathname?.startsWith('/admin/bookings')) {
      return 'bookings';
    } else if (pathname?.startsWith('/admin/services')) {
      return 'services';
    } else if (pathname === '/admin/settings') {
      return 'settings';
    } else {
      return 'dashboard';
    }
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Handle error in ErrorBoundary
  const handleError = (error: Error) => {
    console.error('Error in admin layout:', error);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <AuthenticationError 
          message={error.message || 'An unknown error occurred.'} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r bg-white pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link href="/admin/dashboard" className="flex items-center text-blue-600">
              <Sparkles className="h-6 w-6 mr-2" />
              <span className="text-xl font-semibold">Admin Portal</span>
            </Link>
          </div>
          
          <div className="px-4 mb-6">
            <AuthStatus />
          </div>
          
          <nav className="flex-1 px-2 pb-4 space-y-1">
            <button
              onClick={() => handleNavigation('/admin/dashboard')}
              className={`flex w-full items-center rounded-md px-3 py-2 ${
                pathname === '/admin/dashboard' 
                  ? 'bg-gray-100 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation('/admin/bookings')}
              className={`flex w-full items-center rounded-md px-3 py-2 ${
                pathname?.startsWith('/admin/bookings') 
                  ? 'bg-gray-100 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarDays className="mr-3 h-5 w-5" />
              Bookings
            </button>
            <button
              onClick={() => handleNavigation('/admin/services')}
              className={`flex w-full items-center rounded-md px-3 py-2 ${
                pathname === '/admin/services' || pathname?.startsWith('/admin/services/') 
                  ? 'bg-gray-100 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Services
            </button>
            <button
              onClick={() => handleNavigation('/admin/availability')}
              className={`flex w-full items-center rounded-md px-3 py-2 ${
                pathname === '/admin/availability' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className="mr-3 h-5 w-5" />
              Availability
            </button>
            <button
              onClick={() => handleNavigation('/admin/settings')}
              className={`flex w-full items-center rounded-md px-3 py-2 ${
                pathname === '/admin/settings' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </button>
            <Link
              href="/admin/logout"
              className="flex w-full items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around">
        <button
          onClick={() => handleNavigation('/admin/dashboard')}
          className={`p-2 rounded-md ${
            pathname === '/admin/dashboard' 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <LayoutDashboard className="h-6 w-6" />
        </button>
        <button
          onClick={() => handleNavigation('/admin/bookings')}
          className={`p-2 rounded-md ${
            pathname?.startsWith('/admin/bookings') 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <CalendarDays className="h-6 w-6" />
        </button>
        <button
          onClick={() => handleNavigation('/admin/services')}
          className={`p-2 rounded-md ${
            pathname?.startsWith('/admin/services') 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <Users className="h-6 w-6" />
        </button>
        <button
          onClick={() => handleNavigation('/admin/settings')}
          className={`p-2 rounded-md ${
            pathname === '/admin/settings' 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {isNavigating ? (
          <div className="p-6">
            <SkeletonLoader type={getSkeletonType()} />
          </div>
        ) : (
          <ErrorBoundary onError={handleError}>
            {children}
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}