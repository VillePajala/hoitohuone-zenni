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
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { withErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { ErrorType, logError } from '@/lib/errorHandling';

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

function BookingsPage() {
  const router = useRouter();
  const { authGet, isAuthError, refreshToken } = useAdminAuth(true); // Redirect to login if not authenticated
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [authRetryCount, setAuthRetryCount] = useState(0);

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
        // Try to use authGet for authenticated requests
        const data = await authGet('/api/admin/services');
        setServices(data);
        setError(null);
      } catch (error) {
        logError(error, 'Fetching services');
        
        // If auth error and we haven't retried too many times, try refreshing token
        if (isAuthError && authRetryCount < 2) {
          console.log('Auth error detected, attempting to refresh token...');
          const refreshed = await refreshToken();
          if (refreshed) {
            setAuthRetryCount(prev => prev + 1);
            // Retry fetch after successful refresh
            fetchServices();
          }
        } else {
          setError(error as Error);
        }
      }
    };
    
    fetchServices();
  }, [authGet, isAuthError, refreshToken, authRetryCount]);

  // Fetch bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log('Fetching bookings from API...');
      
      // Try to use authGet for authenticated requests
      try {
        const bookingData = await authGet('/api/admin/bookings');
        if (bookingData && bookingData.bookings) {
          processBookingData(bookingData.bookings);
          return;
        }
      } catch (authError) {
        logError(authError, 'Error with authenticated bookings request');
        
        // If auth error and we haven't retried too many times, try refreshing token
        if (isAuthError && authRetryCount < 2) {
          console.log('Auth error detected, attempting to refresh token...');
          const refreshed = await refreshToken();
          if (refreshed) {
            setAuthRetryCount(prev => prev + 1);
            // Retry after token refresh without falling back to debug endpoint
            fetchBookings();
            return;
          }
        }
        
        // Only set error if it's not an auth error (which will be handled by useAdminAuth)
        // or if we've already retried
        if (!isAuthError || authRetryCount >= 2) {
          setError(authError as Error);
        }
        
        // If token refresh failed or too many retries, fallback to regular fetch
        console.log('Falling back to standard fetch after auth failure');
      }
      
      // Regular fetch as fallback (will be handled by middleware)
      const response = await fetch('/api/admin/bookings');
      
      // If the regular endpoint fails, try the debug endpoint
      if (!response.ok) {
        console.log('Regular bookings endpoint failed, trying debug endpoint...');
        const debugResponse = await fetch('/api/admin/bookings/debug-data');
        
        if (!debugResponse.ok) {
          setError(new Error(`Failed to fetch bookings from both endpoints: ${response.status} ${response.statusText}`));
          return;
        }
        
        const debugData = await debugResponse.json();
        processBookingData(debugData);
      } else {
        const responseData = await response.json();
        if (responseData && responseData.bookings) {
          processBookingData(responseData.bookings);
        } else {
          processBookingData(responseData);
        }
      }
    } catch (error) {
      logError(error, 'Error fetching bookings');
      setError(error as Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Process booking data from any source
  const processBookingData = (data: any[]) => {
    if (!Array.isArray(data)) {
      logError('API did not return an array', data);
      setBookings([]);
      return;
    }
    
    if (data.length === 0) {
      console.log('No bookings found in API response');
      setBookings([]);
      return;
    }
    
    // Transform the data to match our frontend structure
    const transformedBookings: Booking[] = [];
    
    for (const booking of data) {
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
        logError(err, `Error transforming booking: ${booking?.id || 'unknown'}`);
      }
    }
    
    console.log(`Successfully transformed ${transformedBookings.length} bookings`);
    setBookings(transformedBookings);
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

  // Handle manual refresh with token refresh attempt
  const handleRefresh = async () => {
    // First try to refresh the auth token
    await refreshToken();
    // Then fetch bookings
    fetchBookings();
  };

  // Show error if there's an issue
  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          message={error.message || 'Failed to load bookings'}
          onRetry={handleRefresh}
          type={error.name === 'ApplicationError' 
            ? (error as any).type 
            : ErrorType.UNKNOWN}
        />
      </div>
    );
  }

  // Show skeleton loader while loading data
  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonLoader type="bookings" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search bookings..."
            className="pl-8 w-full md:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No Show</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={serviceFilter}
            onValueChange={setServiceFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Service" />
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
      </div>
      
      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getStatusCount('confirmed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getStatusCount('completed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getStatusCount('cancelled')}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Bookings table */}
      {filteredBookings.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">
                    <CalendarRange className="h-4 w-4 inline-block mr-1" />
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">
                    <Clock className="h-4 w-4 inline-block mr-1" />
                    Time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-gray-500 text-xs">{booking.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{booking.service}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          booking.status === 'no-show' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleViewBooking(booking.id)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Edit Status
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No bookings found matching your filters.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setServiceFilter('all');
            }}
            className="mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Wrap the page with an error boundary
export default withErrorBoundary(BookingsPage); 