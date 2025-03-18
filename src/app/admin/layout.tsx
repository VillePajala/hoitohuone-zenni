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

  // Don't show admin layout on auth pages
  const isAuthPage = pathname === '/admin/login' || 
                    pathname === '/admin/sign-in' || 
                    pathname === '/admin/sign-up' ||
                    pathname === '/admin/logout';

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Handle redirection to sign-in page with error message when auth fails
  const redirectToSignIn = (errorMessage: string) => {
    const encodedError = encodeURIComponent(errorMessage);
    const encodedRedirect = encodeURIComponent(pathname);
    router.push(`/admin/sign-in?error=${encodedError}&redirect_url=${encodedRedirect}`);
  };

  // Show authentication error message if there's an issue with auth
  if (!isAuthenticated || hasTokenExpired || authError) {
    // Don't try to refresh more than once every 10 seconds to avoid refresh loops
    const now = Date.now();
    const canAttemptRefresh = now - lastRefreshAttemptRef.current > 10000;
    
    // Try to refresh authentication once before redirecting
    if (canAttemptRefresh) {
      lastRefreshAttemptRef.current = now;
      
      // Use a timeout to prevent blocking the UI
      setTimeout(() => {
        refreshAuth().then(success => {
          if (!success) {
            const message = authError?.message || 'Your session has expired. Please sign in again.';
            redirectToSignIn(message);
          }
        });
      }, 0);
    } else if (!isAuthPage) {
      // If we recently tried to refresh and still have issues, redirect
      const message = authError?.message || 'Your session has expired. Please sign in again.';
      redirectToSignIn(message);
      return null; // Don't render anything during the transition
    }
    
    // Show loading state while attempting to refresh
    return <SkeletonLoader type="dashboard" />;
  }
  
  // Function to handle navigation with loading state
  const handleNavigation = (path: string) => {
    // Skip if already on this page or already navigating
    if (pathname === path || isNavigating) return;
    
    // Navigate immediately and show loading state only if needed
    router.push(path);
    
    // Only set loading if the navigation takes time
    const loadingTimer = setTimeout(() => {
      setIsNavigating(true);
      setTargetPath(path);
    }, 100); // Only show loading if navigation takes longer than 100ms
    
    return () => clearTimeout(loadingTimer);
  };
  
  // Reset navigation state when pathname changes
  useEffect(() => {
    if (isNavigating && pathname === targetPath) {
      // Reset immediately
      setIsNavigating(false);
      setTargetPath(null);
    }
  }, [pathname, isNavigating, targetPath]);
  
  // Show appropriate skeleton loader based on the target path
  const getSkeletonType = () => {
    if (!targetPath) return 'dashboard';
    
    if (targetPath.includes('/admin/dashboard')) return 'dashboard';
    if (targetPath.includes('/admin/bookings')) return 'bookings';
    if (targetPath.includes('/admin/services')) return 'services';
    if (targetPath.includes('/admin/availability')) return 'availability';
    if (targetPath.includes('/admin/settings')) return 'settings';
    
    return 'dashboard';
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // Close mobile menu after navigation
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  // Handle error in the error boundary
  const handleError = (error: Error) => {
    console.error('Admin layout error boundary caught an error:', error);
    // You could send this to an error tracking service
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white shadow-md">
        <div className="flex items-center border-b px-6 py-3">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-auto rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <div className="mb-6 px-3 py-2">
            <p className="text-sm text-gray-500">Signed in as:</p>
            <p className="font-medium truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            <div className="mt-2">
              <AuthStatus compact />
            </div>
          </div>
          <button
            onClick={() => handleNavigation('/admin/dashboard')}
            className={`flex w-full items-center rounded-md px-3 py-2 ${
              pathname === '/admin/dashboard' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => handleNavigation('/admin/bookings')}
            className={`flex w-full items-center rounded-md px-3 py-2 ${
              pathname === '/admin/bookings' || pathname.startsWith('/admin/bookings/') 
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
              pathname === '/admin/services' || pathname.startsWith('/admin/services/') 
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
            pathname.startsWith('/admin/bookings') 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <CalendarDays className="h-6 w-6" />
        </button>
        <button
          onClick={() => handleNavigation('/admin/services')}
          className={`p-2 rounded-md ${
            pathname.startsWith('/admin/services') 
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