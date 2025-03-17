'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/bookings/debug');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch debug data: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Debug data:', responseData);
      setData(responseData);
    } catch (err) {
      console.error('Error fetching debug data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch debug data on load
  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button onClick={fetchDebugData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/bookings'}>
              Go to Bookings
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}
          
          {data && (
            <div>
              <p className="mb-2 font-bold">Total Bookings: {data.count}</p>
              
              {data.bookings.map((booking: any) => (
                <div key={booking.id} className="border p-4 mb-4 rounded">
                  <h3 className="font-medium text-lg mb-2">Booking ID: {booking.id}</h3>
                  <p><span className="font-semibold">Customer:</span> {booking.customerName} ({booking.customerEmail})</p>
                  <p><span className="font-semibold">Service:</span> {booking.serviceNameFi} (ID: {booking.serviceId})</p>
                  <p><span className="font-semibold">Status:</span> {booking.status}</p>
                  
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <p><span className="font-semibold">Date:</span> {booking.dateString}</p>
                    <p><span className="font-semibold">Start Time:</span> {booking.startTimeString}</p>
                    <p><span className="font-semibold">End Time:</span> {booking.endTimeString}</p>
                  </div>
                  
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer font-semibold">Raw Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                        {JSON.stringify(booking, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 