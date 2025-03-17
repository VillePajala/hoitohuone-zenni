'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, Mail, User, Bookmark, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define our booking interface
interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: {
    id: string;
    name: string;
    nameEn: string;
    nameFi: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: string;
  createdAt: string;
  cancelledAt?: string;
  updatedAt?: string;
  language: string;
}

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedStatus, setEditedStatus] = useState('');

  useEffect(() => {
    const getBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/bookings/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Booking not found');
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to load booking details');
          }
          return;
        }
        
        const data = await response.json();
        setBooking(data);
        setEditedNotes(data.notes || '');
        setEditedStatus(data.status);
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
    if (!booking) return;
    
    if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/admin/bookings/${booking.id}/cancel`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      
      // Refresh booking data
      const updatedBookingResponse = await fetch(`/api/admin/bookings/${booking.id}`);
      const updatedBooking = await updatedBookingResponse.json();
      
      setBooking(updatedBooking);
      setSuccessMessage('Booking has been cancelled successfully');
      setIsEditing(false); // Exit edit mode if active
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel booking');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!booking) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: editedNotes,
          status: editedStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }
      
      // Refresh booking data
      const updatedBookingResponse = await fetch(`/api/admin/bookings/${booking.id}`);
      const updatedBooking = await updatedBookingResponse.json();
      
      setBooking(updatedBooking);
      setSuccessMessage('Booking has been updated successfully');
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update booking');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fi-FI', {
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('fi-FI', {
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('fi-FI', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/bookings')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        
        {booking && !isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
          >
            Edit Booking
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div>
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : booking ? (
        <>
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{booking.service.nameFi || booking.service.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Booking ID: {booking.id}
                  </p>
                </div>
                <div>
                  {!isEditing ? (
                    <StatusBadge status={booking.status} />
                  ) : (
                    <div className="w-36">
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select
                        value={editedStatus}
                        onValueChange={setEditedStatus}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="no-show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <div>
                        <p>{booking.language === 'fi' ? 'Finnish' : booking.language === 'en' ? 'English' : booking.language}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Bookmark className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Service</p>
                        <p className="text-muted-foreground">
                          {booking.language === 'en' 
                            ? booking.service.nameEn 
                            : booking.service.nameFi || booking.service.name}
                        </p>
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
                        <p className="text-muted-foreground">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                {!isEditing ? (
                  <div className="bg-gray-50 p-4 rounded-md min-h-[80px]">
                    {booking.notes ? (
                      <p>{booking.notes}</p>
                    ) : (
                      <p className="text-muted-foreground">No notes</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Textarea 
                      placeholder="Add notes about this booking..."
                      className="min-h-[100px]"
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Booking History</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm">Created:</p>
                    <p className="text-sm">{formatDateTime(booking.createdAt)}</p>
                  </div>
                  {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                    <div className="flex justify-between">
                      <p className="text-sm">Last Updated:</p>
                      <p className="text-sm">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  )}
                  {booking.cancelledAt && (
                    <div className="flex justify-between">
                      <p className="text-sm">Cancelled:</p>
                      <p className="text-sm">{formatDateTime(booking.cancelledAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 py-4 flex justify-between">
              {!isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/admin/bookings')}
                  >
                    Back
                  </Button>
                  {booking.status === 'confirmed' && (
                    <Button 
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedNotes(booking.notes || '');
                      setEditedStatus(booking.status);
                      setSuccessMessage(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </>
      ) : null}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Confirmed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Cancelled
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Completed
        </span>
      );
    case 'no-show':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          No Show
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
} 