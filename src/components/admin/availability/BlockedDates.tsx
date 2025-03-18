'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { 
  Trash2, 
  Loader2, 
  Calendar as CalendarIcon, 
  Ban, 
  Info 
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BlockedDate {
  id: string;
  date: Date;
  reason: string;
}

interface BlockedDatesProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function BlockedDates({ selectedDate, onDateChange }: BlockedDatesProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newReason, setNewReason] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the custom hook instead of useAuth directly
  const { 
    authGet, 
    authPost, 
    authDelete, 
    isAuthError, 
    isLoading: isAuthLoading 
  } = useAdminAuth();

  // Fetch blocked dates from the API
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        setIsLoading(true);
        
        // Skip if auth error
        if (isAuthError) {
          return;
        }
        
        // Use authGet instead of fetch with token
        const data = await authGet('/api/admin/availability/blocked');
        
        // Convert date strings to Date objects
        const processedData = data.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        }));
        
        setBlockedDates(processedData);
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
        if (!String(error).includes('Authentication') && 
            !String(error).includes('Unauthorized')) {
          setMessage({ 
            text: error instanceof Error ? error.message : 'Failed to fetch blocked dates', 
            type: 'error' 
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockedDates();
  }, [authGet, isAuthError]);

  // Add a new blocked date
  const addBlockedDate = async () => {
    try {
      if (!selectedDate) {
        setMessage({ text: 'Please select a date', type: 'error' });
        return;
      }

      if (!newReason.trim()) {
        setMessage({ text: 'Please enter a reason', type: 'error' });
        return;
      }

      setIsLoading(true);
      
      // Check if the date is already blocked
      const existingDate = blockedDates.find(
        (date) => date.date.toDateString() === selectedDate.toDateString()
      );
      
      if (existingDate) {
        setMessage({ text: 'This date is already blocked', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Use authPost instead of fetch with token
      const newBlockedDate = await authPost('/api/admin/availability/blocked', {
        date: selectedDate.toISOString(),
        reason: newReason,
      });
      
      // Update the local state with converted date
      setBlockedDates([...blockedDates, {
        ...newBlockedDate,
        date: new Date(newBlockedDate.date)
      }]);
      setNewReason('');
      setMessage({ text: 'Date blocked successfully!', type: 'success' });
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error blocking date:', error);
      if (!String(error).includes('Authentication') && 
          !String(error).includes('Unauthorized')) {
        setMessage({ 
          text: error instanceof Error ? error.message : 'An unexpected error occurred', 
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a blocked date
  const removeBlockedDate = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Use authDelete instead of fetch with token
      await authDelete(`/api/admin/availability/blocked/${id}`);
      
      // Update local state
      setBlockedDates(blockedDates.filter(date => date.id !== id));
      setMessage({ text: 'Date unblocked successfully!', type: 'success' });
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error unblocking date:', error);
      if (!String(error).includes('Authentication') && 
          !String(error).includes('Unauthorized')) {
        setMessage({ 
          text: error instanceof Error ? error.message : 'An unexpected error occurred', 
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  // Get month and year for grouping
  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Group blocked dates by month
  const groupedBlockedDates = blockedDates.reduce((groups, date) => {
    const monthYear = getMonthYear(date.date);
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(date);
    return groups;
  }, {} as Record<string, BlockedDate[]>);

  // If there's an auth error, display login prompt
  if (isAuthError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4 text-yellow-800">
          <p className="font-medium">Authentication Required</p>
          <p className="text-sm mt-1">Please sign in to manage blocked dates</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/admin/sign-in'}
          className="mt-2"
        >
          Sign In
        </Button>
      </div>
    );
  }

  // If still loading, show loading state
  if ((isLoading || isAuthLoading) && blockedDates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        <span className="ml-2 text-slate-500">Loading blocked dates...</span>
      </div>
    );
  }

  // Calendar day modifier to highlight blocked dates
  const getDateModifier = (date: Date) => {
    const isBlocked = blockedDates.some(
      blockedDate => blockedDate.date.toDateString() === date.toDateString()
    );
    
    return isBlocked ? "bg-red-100 text-red-800 font-medium rounded-md hover:bg-red-200" : "";
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-neutral-600 mb-4">
        Block out specific dates when you are unavailable, such as holidays or personal time off.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Calendar and form */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="mr-2 h-5 w-5 text-slate-500" />
                  <h3 className="font-medium">Select Date to Block</h3>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => onDateChange && date && onDateChange(date)}
                  className="rounded-md border"
                  classNames={{
                    day_today: "bg-slate-100 text-slate-900 font-bold",
                    day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white",
                  }}
                  modifiers={{
                    blocked: blockedDates.map(bd => bd.date)
                  }}
                  modifiersClassNames={{
                    blocked: "bg-red-100 text-red-800 font-medium hover:bg-red-200"
                  }}
                />

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="date-input" className="block mb-1">Selected Date</Label>
                    <Input
                      id="date-input"
                      type="date"
                      value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value && onDateChange) {
                          const newDate = new Date(e.target.value);
                          onDateChange(newDate);
                        }
                      }}
                      className="block w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason" className="block mb-1">Reason for Blocking</Label>
                    <Input
                      id="reason"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      placeholder="e.g., Holiday, Vacation, etc."
                    />
                  </div>

                  <Button 
                    onClick={addBlockedDate} 
                    disabled={!selectedDate || isLoading || !newReason.trim()}
                    className="w-full"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Block This Date
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {message && (
            <div
              className={`p-3 rounded text-sm ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Right side - Blocked dates list */}
        <div>
          <div className="flex items-center mb-4">
            <Ban className="mr-2 h-5 w-5 text-red-500" />
            <h3 className="font-medium">Currently Blocked Dates</h3>
            <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
              {blockedDates.length}
            </Badge>
          </div>
          
          {blockedDates.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedBlockedDates)
                .sort(([a], [b]) => {
                  const dateA = new Date(a);
                  const dateB = new Date(b);
                  return dateA.getTime() - dateB.getTime();
                })
                .map(([monthYear, dates]) => (
                  <div key={monthYear} className="space-y-2">
                    <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wider">
                      {monthYear}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dates
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map((blockedDate) => (
                          <div
                            key={blockedDate.id}
                            className="flex justify-between items-center p-3 border rounded-md bg-white hover:bg-red-50 transition-colors"
                          >
                            <div className="flex items-start space-x-2">
                              <Ban className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{formatDate(blockedDate.date)}</div>
                                {blockedDate.reason && (
                                  <div className="text-sm text-slate-500 line-clamp-1">{blockedDate.reason}</div>
                                )}
                              </div>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeBlockedDate(blockedDate.id)}
                                    disabled={isLoading}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unblock this date</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-md text-center flex flex-col items-center justify-center text-slate-500">
              <Ban className="h-12 w-12 text-slate-300 mb-2" />
              <p className="font-medium">No Blocked Dates</p>
              <p className="text-sm mt-1">Select a date and add it to the blocked list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 