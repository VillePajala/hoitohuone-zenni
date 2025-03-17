'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BookingsDebugPage() {
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching bookings from debug endpoint...');
      const response = await fetch('/api/admin/bookings/debug-data');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch debug data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw debug data received:', data);
      setRawData(data);
    } catch (error) {
      console.error('Error fetching debug data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading debug data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-red-600 mb-4">Error loading debug data: {error}</p>
            <Button onClick={fetchDebugData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bookings Debug Data</h1>
      
      <div className="grid gap-4 mb-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Debug Controls</h2>
            <Button onClick={fetchDebugData} className="mr-2">Refresh Data</Button>
            <Button onClick={() => window.location.href = '/admin/bookings'} variant="outline">Go to Bookings Page</Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Raw Data</h2>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
              <pre>{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
        
        {Array.isArray(rawData) && rawData.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Simplified View</h2>
              <div className="grid gap-4">
                {rawData.map((booking: any, index: number) => (
                  <div key={booking.id || index} className="border p-4 rounded-md">
                    <p><strong>ID:</strong> {booking.id || 'N/A'}</p>
                    <p><strong>Customer:</strong> {booking.customerName || 'N/A'}</p>
                    <p><strong>Email:</strong> {booking.customerEmail || 'N/A'}</p>
                    <p><strong>Service:</strong> {booking.service?.name || 'N/A'}</p>
                    <p><strong>Date:</strong> {booking.date || 'N/A'}</p>
                    <p><strong>Status:</strong> {booking.status || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 