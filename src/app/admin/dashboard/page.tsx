'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@clerk/nextjs';

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
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [bookingCount, setBookingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isSignedIn) return;
      
      try {
        setIsLoading(true);
        // Fetch upcoming bookings count
        const response = await fetch('/api/admin/bookings');
        const bookings = await response.json() as Booking[];
        
        console.log('Dashboard received bookings:', bookings.length);
        
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
        setBookingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn]);

  // Show loading state while Clerk is initializing
  if (!isLoaded || !isSignedIn) {
    return null; // Don't render anything, the admin layout will handle the redirect
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
            {isLoading ? (
              <p className="text-4xl font-bold">...</p>
            ) : (
              <>
                <p className="text-4xl font-bold">{bookingCount}</p>
                <p className="text-sm text-muted-foreground">Upcoming confirmed bookings</p>
              </>
            )}
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