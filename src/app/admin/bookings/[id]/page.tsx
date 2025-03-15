'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Clock, Mail, User, Bookmark } from 'lucide-react';

// This would be replaced with an actual API call in production
const fetchBookingById = async (id: string) => {
  // Mock data for development
  const mockBookings = {
    '1': {
      id: '1',
      customerName: 'Matti Meikäläinen',
      customerEmail: 'matti@example.com',
      customerPhone: '+358 40 123 4567',
      service: 'Energiahoito',
      date: '2025-03-20',
      startTime: '10:00',
      endTime: '11:00',
      notes: 'Ensimmäinen käynti. Asiakas kertoi kärsivänsä stressistä ja univaikeuksista.',
      status: 'confirmed',
      createdAt: '2025-02-15T12:30:00Z'
    },
    '2': {
      id: '2',
      customerName: 'Liisa Virtanen',
      customerEmail: 'liisa@example.com',
      customerPhone: '+358 50 987 6543',
      service: 'Chakra-tasapaino',
      date: '2025-03-21',
      startTime: '14:00',
      endTime: '15:30',
      notes: 'Kolmas hoitokerta. Edellisellä kerralla keskityttiin kurkku- ja sydänchakraan.',
      status: 'confirmed',
      createdAt: '2025-02-20T09:15:00Z'
    },
    '3': {
      id: '3',
      customerName: 'Antti Korhonen',
      customerEmail: 'antti@example.com',
      customerPhone: '+358 45 765 4321',
      service: 'Energiahoito',
      date: '2025-03-22',
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      status: 'cancelled',
      createdAt: '2025-02-22T14:45:00Z',
      cancelledAt: '2025-03-01T10:20:00Z'
    }
  };
  
  return mockBookings[id as keyof typeof mockBookings] || null;
};

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const getBooking = async () => {
      try {
        setLoading(true);
        const data = await fetchBookingById(params.id);
        
        if (data) {
          setBooking(data);
        } else {
          setError('Booking not found');
        }
      } catch (error) {
        setError('Failed to load booking details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getBooking();
  }, [params.id]);

  const handleCancel = async () => {
    try {
      setIsSubmitting(true);
      
      // In production, send an API request to cancel the booking
      // await fetch(`/api/admin/bookings/${booking.id}/cancel`, { method: 'POST' });
      
      // For now, just update the local state
      setBooking({
        ...booking,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      
      setSuccessMessage('Booking has been cancelled successfully');
    } catch (error) {
      setError('Failed to cancel booking');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fi-FI', {
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('fi-FI', {
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/bookings')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
            <p>Loading booking details...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      ) : booking ? (
        <>
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <p>{successMessage}</p>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{booking.service}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Booking #{booking.id}
                  </p>
                </div>
                <div>
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
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <User className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div>
                        <p>{booking.customerEmail}</p>
                      </div>
                    </div>
                    {booking.customerPhone && (
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <p>{booking.customerPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Bookmark className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Service</p>
                        <p className="text-muted-foreground">{booking.service}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-muted-foreground">{formatDate(booking.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-muted-foreground">{booking.startTime} - {booking.endTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p>{booking.notes}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium mb-2">Booking History</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-32 text-sm text-muted-foreground">Created:</div>
                    <div>{formatDateTime(booking.createdAt)}</div>
                  </div>
                  {booking.status === 'cancelled' && booking.cancelledAt && (
                    <div className="flex items-center">
                      <div className="w-32 text-sm text-muted-foreground">Cancelled:</div>
                      <div>{formatDateTime(booking.cancelledAt)}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 py-4 flex justify-between border-t">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/bookings')}
              >
                Back
              </Button>
              <div className="space-x-2">
                {booking.status === 'confirmed' && (
                  <Button 
                    variant="destructive"
                    disabled={isSubmitting}
                    onClick={handleCancel}
                  >
                    {isSubmitting ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                )}
                <Button>
                  Send Email
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      ) : null}
    </div>
  );
} 