'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { withErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorType, createError, logError } from '@/lib/errorHandling';
import { useAuthContext } from '@/contexts/AuthContext';

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

function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [bookingCount, setBookingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our admin auth hook for authenticated API calls
  const { authFetch } = useAdminAuth();
  
  // Use our auth context to check auth state
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthContext();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the authFetch helper instead of direct fetch
        const response = await authFetch('/api/admin/bookings');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message && typeof errorData.message === 'string'
            ? errorData.message
            : 'Failed to load bookings';
          
          throw createError(
            ErrorType.VALIDATION,
            errorMessage
          );
        }
        
        const data = await response.json();
        
        // The API now returns an object with a bookings property
        const bookings = data.bookings || [];
        
        // Only count confirmed bookings, exact match
        const confirmedBookings = bookings.filter(
          (booking: Booking) => booking.status === 'confirmed'
        );
        
        setBookingCount(confirmedBookings.length);
      } catch (err) {
        logError('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load bookings'));
        setBookingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authFetch]);

  // Show loading state while auth is initializing
  if (isAuthLoading) {
    return <SkeletonLoader type="dashboard" />;
  }
  
  // Show skeleton loader while loading data
  if (isLoading) {
    return <SkeletonLoader type="dashboard" />;
  }

  // Show error state if there was an error
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorDisplay 
          message={error.message}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Admin'}</p>
      </div>

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

export default withErrorBoundary(AdminDashboardPage); 