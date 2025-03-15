'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true); // This should be checked via real auth

  // In a real app, you would verify authentication status here
  useEffect(() => {
    // Example check - in a real app this would check for an auth token/session
    // For now, we're simulating authentication
    const checkAuth = () => {
      // In a real implementation, check for a session/token
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    // In a real app, clear the auth token/session
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
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