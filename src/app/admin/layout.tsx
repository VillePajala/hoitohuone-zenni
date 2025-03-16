'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Menu, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, SignOutButton } from '@clerk/nextjs';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use Clerk's useAuth hook to check if the user is authenticated
  const { isLoaded, userId, isSignedIn } = useAuth();
  const { user } = useUser();

  // Skip authentication check on the login, sign-in and sign-up pages
  const isAuthPage = pathname === '/admin/login' || 
                     pathname === '/admin/sign-in' || 
                     pathname === '/admin/sign-up';

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;
    
    // Redirect to sign-in if not authenticated and not on an auth page
    if (!isSignedIn && !isAuthPage) {
      router.push('/admin/sign-in');
    }
  }, [isSignedIn, isAuthPage, router, isLoaded]);

  // Don't show admin layout on auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // Show loading or children based on auth state
  if (!isLoaded || !isSignedIn) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

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
        <nav className={`flex-1 space-y-1 p-4 ${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="mb-6 px-3 py-2">
            <p className="text-sm text-gray-500">Signed in as:</p>
            <p className="font-medium truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <Link
            href="/admin/dashboard"
            className={`flex items-center rounded-md px-3 py-2 ${
              pathname === '/admin/dashboard' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/admin/bookings"
            className={`flex items-center rounded-md px-3 py-2 ${
              pathname === '/admin/bookings' || pathname.startsWith('/admin/bookings/') 
                ? 'bg-gray-100 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CalendarDays className="mr-3 h-5 w-5" />
            Bookings
          </Link>
          <Link
            href="/admin/services"
            className={`flex items-center rounded-md px-3 py-2 ${
              pathname === '/admin/services' || pathname.startsWith('/admin/services/') 
                ? 'bg-gray-100 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Services
          </Link>
          <Link
            href="/admin/availability"
            className={`flex items-center rounded-md px-3 py-2 ${
              pathname === '/admin/availability' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="mr-3 h-5 w-5" />
            Availability
          </Link>
          <Link
            href="/admin/settings"
            className={`flex items-center rounded-md px-3 py-2 ${
              pathname === '/admin/settings' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
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
        <Link href="/admin/dashboard" 
          className={`p-2 rounded-md ${
            pathname === '/admin/dashboard' 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <LayoutDashboard className="h-6 w-6" />
        </Link>
        <Link href="/admin/bookings" 
          className={`p-2 rounded-md ${
            pathname.startsWith('/admin/bookings') 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <Users className="h-6 w-6" />
        </Link>
        <Link href="/admin/availability" 
          className={`p-2 rounded-md ${
            pathname.startsWith('/admin/availability') 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <CalendarDays className="h-6 w-6" />
        </Link>
        <Link href="/admin/settings" 
          className={`p-2 rounded-md ${
            pathname.startsWith('/admin/settings') 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}
        >
          <Settings className="h-6 w-6" />
        </Link>
        <Link href="/admin/logout" 
          className="p-2 rounded-md text-gray-500"
        >
          <LogOut className="h-6 w-6" />
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
} 