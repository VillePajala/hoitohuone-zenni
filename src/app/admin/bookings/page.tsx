'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CalendarRange, Clock } from 'lucide-react';

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
  const [bookings, setBookings] = useState(mockBookings);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => 
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // In a real app, fetch bookings from API
  useEffect(() => {
    // Example API call
    // const fetchBookings = async () => {
    //   try {
    //     const response = await fetch('/api/admin/bookings');
    //     const data = await response.json();
    //     setBookings(data);
    //   } catch (error) {
    //     console.error('Error fetching bookings:', error);
    //   }
    // };
    // fetchBookings();
  }, []);

  const handleViewBooking = (id: string) => {
    router.push(`/admin/bookings/${id}`);
  };

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