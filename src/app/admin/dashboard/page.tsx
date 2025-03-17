'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Add an interface for the booking type at the top of the file
interface Booking {
  id: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
}

// API response interface
interface BookingsResponse {
  bookings: Booking[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [bookingCount, setBookingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use our custom auth hook for authenticated API calls
  const { authGet, isAuthError, isSignedIn, isLoading: isAuthLoading } = useAdminAuth();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isSignedIn) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the authGet helper instead of direct fetch
        const data = await authGet('/api/admin/bookings');
        
        // The API now returns an object with a bookings property
        const bookings = data.bookings || [];
        
        console.log('Dashboard received bookings:', bookings ? bookings.length : 0);
        
        if (bookings.length > 0) {
          // Log first booking to debug
          console.log('First booking:', JSON.stringify(bookings[0]));
        }
        
        // Only count confirmed bookings, exact match
        const confirmedBookings = bookings.filter(
          (booking: Booking) => booking.status === 'confirmed'
        );
        
        console.log('Confirmed bookings count:', confirmedBookings.length);
        setBookingCount(confirmedBookings.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load bookings');
        setBookingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      fetchDashboardData();
    }
  }, [isSignedIn, authGet]);

  // Show loading state while Clerk is initializing
  if (isAuthLoading) {
    return <SkeletonLoader type="dashboard" />;
  }
  
  // Show auth error if not signed in
  if (isAuthError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6 text-yellow-800">
          <p className="font-medium">Authentication Required</p>
          <p className="text-sm mt-1">Please sign in to access the dashboard</p>
          <Button 
            onClick={() => router.push('/admin/sign-in')}
            className="mt-3"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  // Show skeleton loader while loading data
  if (isLoading) {
    return <SkeletonLoader type="dashboard" />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Admin'}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <p className="font-medium">Error loading dashboard data</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{bookingCount}</p>
            <p className="text-sm text-muted-foreground">Upcoming confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/admin/bookings')}
            >
              View All Bookings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/admin/availability')}
            >
              Manage Availability
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 