'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';

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

export default function AvailabilityPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading the availability data - shorter timeout for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Show skeleton for shorter time
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonLoader type="availability" />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Availability Management</h1>
      
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
                  {activeTab === "blocked" && <BlockedDates selectedDate={date} />}
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 