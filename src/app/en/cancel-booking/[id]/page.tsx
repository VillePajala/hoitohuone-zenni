'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as React from 'react';

// Define booking type
interface Booking {
  id: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  service: {
    id: string;
    nameEn: string;
    duration: number;
  };
}

// For the page props with params
interface PageParams {
  id: string;
  [key: string]: string;
}

export default function CancelBookingPage({ params }: { params: Promise<PageParams> }) {
  // Properly unwrap params Promise
  const resolvedParams = React.use(params);
  const cancellationId = resolvedParams.id;
  
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/cancel?id=${cancellationId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch booking details');
        }
        
        const data = await response.json();
        setBooking(data.booking);
        
        // Check if booking is already cancelled
        if (data.booking.status === 'cancelled') {
          setIsCancelled(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (cancellationId) {
      fetchBooking();
    }
  }, [cancellationId]);

  // Handle cancellation
  const handleCancelBooking = async () => {
    if (!booking || isCancelled) return;
    
    setIsCancelling(true);
    
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancellationId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      
      setIsCancelled(true);
      setCancelSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle return to home
  const handleReturnHome = () => {
    router.push('/en');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: enUS });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button onClick={handleReturnHome}>Return to Homepage</Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Booking Not Found</AlertTitle>
          <AlertDescription>
            We couldn't find a booking with the provided cancellation ID.
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button onClick={handleReturnHome}>Return to Homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Cancel Booking</h1>
      
      {cancelSuccess ? (
        <div className="mb-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Booking Cancelled</AlertTitle>
            <AlertDescription className="text-green-700">
              Your booking has been successfully cancelled. A confirmation email has been sent to your email address.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
          <CardDescription>
            {isCancelled ? 'This booking has been cancelled.' : 'Review your booking details before cancelling.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{booking.service.nameEn}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(booking.date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">
                {isCancelled ? (
                  <span className="text-red-600">Cancelled</span>
                ) : (
                  <span className="text-green-600">Confirmed</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReturnHome}>
            Return to Homepage
          </Button>
          {!isCancelled && (
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 