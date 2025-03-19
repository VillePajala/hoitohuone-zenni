'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@clerk/nextjs';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { ErrorType, createError } from '@/lib/errorHandling';

// Add an interface for the booking type at the top of the file
interface Booking {
  id: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Simple effect to fetch bookings data
  useEffect(() => {
    // Don't fetch until auth is loaded and user is signed in
    if (!authLoaded || !userLoaded || !isSignedIn) return;

    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        
        // Simple fetch with standard auth - Clerk will handle the auth headers
        const response = await fetch('/api/admin/bookings');
        
        if (!response.ok) {
          throw createError(ErrorType.VALIDATION, 'Failed to load bookings');
        }
        
        const data = await response.json();
        const bookings = data.bookings || [];
        
        // Only count confirmed bookings
        const confirmedBookings = bookings.filter(
          (booking: Booking) => booking.status === 'confirmed'
        );
        
        setBookingCount(confirmedBookings.length);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err instanceof Error ? err : new Error('Failed to load bookings'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [authLoaded, userLoaded, isSignedIn]);

  // Show loading state while auth is loading
  if (!authLoaded || !userLoaded) {
    return <SkeletonLoader type="dashboard" />;
  }
  
  // Show loading state while fetching data
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
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Show the dashboard
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Admin'}
        </p>
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