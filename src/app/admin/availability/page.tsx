'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';

// Lazy load heavy components
const WeeklySchedule = lazy(() => import('@/components/admin/availability/WeeklySchedule'));
const BlockedDates = lazy(() => import('@/components/admin/availability/BlockedDates'));

// Simple loading component
const ComponentLoader = () => (
  <div className="p-4 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-24 bg-gray-200 rounded mb-2"></div>
    <div className="h-24 bg-gray-200 rounded"></div>
  </div>
);

// Interface for blocked dates
interface BlockedDate {
  id: string;
  date: Date;
  reason: string;
}

// Interface for booking
interface Booking {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: string;
}

export default function AvailabilityPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use the custom hook instead of useAuth directly
  const { authGet, isAuthError, isLoading: isAuthLoading } = useAdminAuth();

  // Fetch blocked dates
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        // Skip if auth error
        if (isAuthError) return;
        
        const data = await authGet('/api/admin/availability/blocked');
        // Convert string dates to Date objects
        setBlockedDates(data.map((item: any) => new Date(item.date)));
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
        if (!String(error).includes('Authentication') && !String(error).includes('Unauthorized')) {
          setError('Failed to load blocked dates. Some features may not work correctly.');
        }
      }
    };
    
    fetchBlockedDates();
  }, [authGet, isAuthError]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Skip if auth error
        if (isAuthError) return;
        
        const data = await authGet('/api/admin/bookings');
        
        // Check the structure of the data to make sure bookings exists
        if (data && data.bookings) {
          // Only use confirmed bookings and convert to Date objects
          const confirmedBookings = data.bookings
            .filter((booking: any) => booking.status === 'confirmed')
            .map((booking: any) => new Date(booking.date));
          
          setBookedDates(confirmedBookings);
        } else {
          console.log('Unexpected booking data structure:', data);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Don't set error state for bookings, not critical
      }
    };
    
    fetchBookings();
  }, [authGet, isAuthError]);

  // Simulate loading the availability data - shorter timeout for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Show skeleton for shorter time
    
    return () => clearTimeout(timer);
  }, []);

  // Function to modify calendar day rendering
  const modifyCalendarDay = (date: Date) => {
    const isBlocked = blockedDates.some(
      (blockedDate) => blockedDate.toDateString() === date.toDateString()
    );
    
    const isBooked = bookedDates.some(
      (bookedDate) => bookedDate.toDateString() === date.toDateString()
    );
    
    // Return classes for the calendar day
    if (isBlocked) {
      return "bg-red-100 text-red-800 hover:bg-red-200";
    }
    
    if (isBooked) {
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
    
    return "";
  };

  // If auth error, display login prompt at the top but still show the UI
  if (isAuthError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Availability Management</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6 text-yellow-800">
          <p className="font-medium">Authentication Required</p>
          <p className="text-sm mt-1">Please sign in to manage availability</p>
          <Button 
            onClick={() => window.location.href = '/admin/sign-in'}
            className="mt-3"
          >
            Sign In
          </Button>
        </div>
        
        {/* Still show the UI in read-only mode */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar with Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={{
                  blocked: blockedDates,
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  blocked: "bg-red-100 text-red-800 hover:bg-red-200",
                  booked: "bg-blue-100 text-blue-800 hover:bg-blue-200",
                }}
              />
              
              <div className="mt-4 flex flex-col space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">Blocked</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">Booked</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Main content with Tabs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="weekly" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
                  <TabsTrigger value="blocked">Blocked Dates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="weekly" className="mt-4">
                  <Suspense fallback={<ComponentLoader />}>
                    {activeTab === "weekly" && <WeeklySchedule />}
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="blocked" className="mt-4">
                  <Suspense fallback={<ComponentLoader />}>
                    {activeTab === "blocked" && <BlockedDates selectedDate={date} onDateChange={setDate} />}
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || isAuthLoading) {
    return <SkeletonLoader type="availability" />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Availability Management</h1>
      
      {error && (
        <div className="mb-6 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar with Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                blocked: blockedDates,
                booked: bookedDates,
              }}
              modifiersClassNames={{
                blocked: "bg-red-100 text-red-800 hover:bg-red-200",
                booked: "bg-blue-100 text-blue-800 hover:bg-blue-200",
              }}
            />
            
            <div className="mt-4 flex flex-col space-y-1">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Blocked</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Booked</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main content with Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Availability Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
                <TabsTrigger value="blocked">Blocked Dates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="mt-4">
                <Suspense fallback={<ComponentLoader />}>
                  {activeTab === "weekly" && <WeeklySchedule />}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="blocked" className="mt-4">
                <Suspense fallback={<ComponentLoader />}>
                  {activeTab === "blocked" && <BlockedDates selectedDate={date} onDateChange={setDate} />}
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 