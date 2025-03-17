'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, CalendarRange, Clock, MoreVertical, RefreshCcw } from 'lucide-react';
import { SkeletonLoader } from "@/components/admin/SkeletonLoader";
import { format, parseISO } from 'date-fns';

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
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show' | string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Filter bookings based on all filters
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      booking.status === statusFilter;
    
    // Service filter
    const matchesService = 
      serviceFilter === 'all' || 
      booking.serviceId === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  // Fetch services for the filter dropdown
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/admin/services');
        if (!response.ok) {
          console.error('Failed to fetch services');
          return;
        }
        
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    
    fetchServices();
  }, []);

  // Fetch bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log('Fetching bookings from API...');
      
      // Try the regular endpoint first
      let response = await fetch('/api/admin/bookings');
      
      // If the regular endpoint fails, try the debug endpoint
      if (!response.ok) {
        console.log('Regular bookings endpoint failed, trying debug endpoint...');
        response = await fetch('/api/admin/bookings/debug-data');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bookings from both endpoints: ${response.status} ${response.statusText}`);
        }
      }

      const responseData = await response.json();
      console.log('Raw booking data received:', responseData);
      
      // Check if the response is an array
      if (!Array.isArray(responseData)) {
        console.error('API did not return an array:', responseData);
        if (responseData.error) {
          throw new Error(`API error: ${responseData.error}`);
        }
        throw new Error('API did not return a valid bookings array');
      }
      
      if (responseData.length === 0) {
        console.log('No bookings found in API response');
        setBookings([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Transform the data to match our frontend structure
      const transformedBookings: Booking[] = [];
      
      for (const booking of responseData) {
        try {
          // Log each booking data for debugging
          console.log('Processing booking:', JSON.stringify(booking));
          
          const transformedBooking = {
            id: booking.id || 'unknown',
            customerName: booking.customerName || 'Unknown',
            customerEmail: booking.customerEmail || 'unknown@example.com',
            service: booking.service?.nameFi || booking.service?.name || 'Unknown Service',
            serviceId: booking.service?.id || 'unknown',
            date: booking.date ? formatDateString(booking.date) : 'Invalid Date',
            startTime: booking.startTime ? formatTimeString(booking.startTime) : 'Invalid Time',
            endTime: booking.endTime ? formatTimeString(booking.endTime) : 'Invalid Time',
            status: booking.status || 'unknown'
          };
          
          console.log('Transformed booking:', transformedBooking);
          transformedBookings.push(transformedBooking);
        } catch (err) {
          console.error('Error transforming booking:', err, booking);
        }
      }
      
      console.log(`Successfully transformed ${transformedBookings.length} bookings`);
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleViewBooking = (id: string) => {
    router.push(`/admin/bookings/${id}`);
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/bookings/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      
      // Update booking in list
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === id 
            ? { ...booking, status: 'cancelled' } 
            : booking
        )
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const formatDate = (date: Date): string => {
    try {
      return format(date, 'dd.MM.yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (date: Date): string => {
    try {
      return format(date, 'HH:mm');
    } catch (e) {
      return 'Invalid time';
    }
  };

  // More flexible date formatting that handles both string and Date objects
  const formatDateString = (dateInput: string | Date): string => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'dd.MM.yyyy');
    } catch (e) {
      console.error('Error formatting date:', e, dateInput);
      return 'Invalid date';
    }
  };

  // More flexible time formatting that handles both string and Date objects
  const formatTimeString = (timeInput: string | Date): string => {
    try {
      const time = typeof timeInput === 'string' ? new Date(timeInput) : timeInput;
      // Check if time is valid
      if (isNaN(time.getTime())) {
        return 'Invalid time';
      }
      return format(time, 'HH:mm');
    } catch (e) {
      console.error('Error formatting time:', e, timeInput);
      return 'Invalid time';
    }
  };

  // Get counts for the tabs
  const getStatusCount = (status: string): number => {
    if (status === 'all') {
      return bookings.length;
    }
    return bookings.filter(booking => booking.status === status).length;
  };

  // Show skeleton loader while loading data
  if (isLoading) {
    return <SkeletonLoader type="bookings" />;
  }

  // Show error state if there was an error
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-red-600 mb-4">Error loading bookings: {error}</p>
            <Button 
              onClick={() => {
                setIsLoading(true);
                fetchBookings();
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-gray-500 my-8">No bookings found in the database</p>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsLoading(true);
                  fetchBookings();
                }}
              >
                Refresh Bookings
              </Button>
              
              <p className="text-sm text-gray-500 my-2">If refreshing doesn't work, try creating test data:</p>
              
              <Button 
                variant="default"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const response = await fetch('/api/debug/seed');
                    if (!response.ok) {
                      throw new Error('Failed to seed database');
                    }
                    
                    const data = await response.json();
                    console.log('Seed result:', data);
                    
                    if (data.success) {
                      alert(`Seed successful! Created ${data.bookingCount} bookings.`);
                      fetchBookings();
                    } else {
                      alert('Seed failed. Check console for details.');
                    }
                  } catch (error) {
                    console.error('Error seeding database:', error);
                    alert('Error seeding database. Check console for details.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Create Test Bookings
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/admin/bookings/debug'}
              >
                Go to Debug Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bookings..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setIsRefreshing(true);
              fetchBookings();
            }}
            disabled={isRefreshing}
            className="shrink-0"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-1 block text-gray-700">Status</label>
          <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">
                All ({getStatusCount('all')})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Active ({getStatusCount('confirmed')})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Done ({getStatusCount('completed')})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({getStatusCount('cancelled')})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {services.length > 0 && (
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium mb-1 block text-gray-700">Service</label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.nameFi || service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
                    
                    <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <CalendarRange className="mr-2 h-4 w-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
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
                      ) : booking.status === 'completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Completed
                        </span>
                      ) : booking.status === 'no-show' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          No Show
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewBooking(booking.id)}>
                          View Details
                        </DropdownMenuItem>
                        {booking.status === 'confirmed' && (
                          <DropdownMenuItem 
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600"
                          >
                            Cancel Booking
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-gray-500 my-8">No bookings found matching your filters</p>
            {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all') && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setServiceFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 