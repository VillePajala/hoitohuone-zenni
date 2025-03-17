'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CalendarRange, Clock } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "@/components/admin/SkeletonLoader";

interface Service {
  id: string;
  name: string;
  nameEn: string;
  nameFi: string;
}

interface DatabaseBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  service: Service;
  date: string; 
  startTime: string;
  endTime: string;
  status: string;
}

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  service: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | string;
}

// Mock booking data for initial development
const mockBookings = [
  {
    id: '1',
    customerName: 'Matti Meikäläinen',
    customerEmail: 'matti@example.com',
    service: 'Energiahoito',
    date: '2025-03-20',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed'
  },
  {
    id: '2',
    customerName: 'Liisa Virtanen',
    customerEmail: 'liisa@example.com',
    service: 'Chakra-tasapaino',
    date: '2025-03-21',
    startTime: '14:00',
    endTime: '15:30',
    status: 'confirmed'
  },
  {
    id: '3',
    customerName: 'Antti Korhonen',
    customerEmail: 'antti@example.com',
    service: 'Energiahoito',
    date: '2025-03-22',
    startTime: '09:00',
    endTime: '10:00',
    status: 'cancelled'
  }
];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => 
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching bookings from API...');
        
        const response = await fetch('/api/admin/bookings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Raw booking data:', responseData);
        
        // Use mock data if no bookings returned or if array is empty
        if (!Array.isArray(responseData) || responseData.length === 0) {
          console.log('No bookings returned from API, using mock data');
          setBookings(mockBookings);
          setIsLoading(false);
          return;
        }
        
        // Transform the data to match our frontend structure
        const transformedBookings: Booking[] = [];
        
        for (const booking of responseData) {
          try {
            transformedBookings.push({
              id: booking.id || 'unknown',
              customerName: booking.customerName || 'Unknown',
              customerEmail: booking.customerEmail || 'unknown@example.com',
              service: booking.service?.nameFi || booking.service?.name || 'Unknown Service',
              date: booking.date ? new Date(booking.date).toLocaleDateString('fi-FI') : 'Invalid Date',
              startTime: booking.startTime || 'Invalid Time',
              endTime: booking.endTime || 'Invalid Time',
              status: booking.status || 'unknown'
            });
          } catch (err) {
            console.error('Error transforming booking:', err, booking);
          }
        }
        
        console.log('Transformed bookings:', transformedBookings);
        
        if (transformedBookings.length > 0) {
          setBookings(transformedBookings);
        } else {
          // Fallback to mock data if transformation failed for all bookings
          console.log('Transformation failed, using mock data');
          setBookings(mockBookings);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        // Fallback to mock data in case of error
        console.log('Using mock data due to error');
        setBookings(mockBookings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleViewBooking = (id: string) => {
    router.push(`/admin/bookings/${id}`);
  };

  // Show skeleton loader while loading data
  if (isLoading) {
    return <SkeletonLoader type="bookings" />;
  }

  // Show error state if there was an error
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-lg text-red-600">Error loading bookings: {error}</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bookings..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className={`${booking.status === 'cancelled' ? 'bg-gray-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{booking.customerName}</h3>
                    <p className="text-sm text-muted-foreground">{booking.customerEmail}</p>
                    <p className="mt-1">{booking.service}</p>
                    
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <CalendarRange className="mr-2 h-4 w-4" />
                      <span>{booking.date}</span>
                      <Clock className="ml-4 mr-2 h-4 w-4" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    
                    <div className="mt-2">
                      {booking.status === 'confirmed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      ) : booking.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {booking.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewBooking(booking.id)}
                    >
                      View Details
                    </Button>
                    {booking.status === 'confirmed' && (
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          // In a real app, would send API request to cancel
                          const updatedBookings = bookings.map(b => 
                            b.id === booking.id ? { ...b, status: 'cancelled' } : b
                          );
                          setBookings(updatedBookings);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 