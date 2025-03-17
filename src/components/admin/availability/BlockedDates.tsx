'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface BlockedDate {
  id: string;
  date: Date;
  reason: string;
}

interface BlockedDatesProps {
  selectedDate?: Date;
}

export default function BlockedDates({ selectedDate }: BlockedDatesProps) {
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
      await authDelete('/api/admin/availability/blocked', { id });
      
      // Update the local state
      setBlockedDates(blockedDates.filter(date => date.id !== id));
      setMessage({ text: 'Blocked date removed successfully!', type: 'success' });
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error removing blocked date:', error);
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

  return (
    <div className="space-y-6">
      <div className="text-sm text-neutral-600 mb-4">
        Block out specific dates when you are unavailable, such as holidays or personal time off.
      </div>

      <div className="bg-neutral-50 p-4 rounded-md">
        <h3 className="font-medium mb-3">Add New Blocked Date</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="block mb-1">Selected Date</Label>
            <div className="p-2 bg-white border rounded-md">
              {selectedDate ? formatDate(selectedDate) : 'Please select a date from the calendar'}
            </div>
          </div>

          <div>
            <Label htmlFor="reason" className="block mb-1">Reason (Optional)</Label>
            <Input
              id="reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g., Holiday, Vacation, etc."
            />
          </div>
        </div>

        <Button 
          onClick={addBlockedDate} 
          disabled={!selectedDate || isLoading}
          className="relative"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Block This Date
        </Button>

        {message && (
          <div
            className={`mt-3 p-2 rounded text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-medium mb-3">Currently Blocked Dates</h3>
        
        {blockedDates.length > 0 ? (
          <div className="space-y-2">
            {blockedDates
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((blockedDate) => (
                <div
                  key={blockedDate.id}
                  className="flex justify-between items-center p-3 border rounded-md bg-white"
                >
                  <div>
                    <span className="font-medium">{formatDate(blockedDate.date)}</span>
                    {blockedDate.reason && (
                      <span className="text-neutral-500 ml-2">- {blockedDate.reason}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBlockedDate(blockedDate.id)}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-neutral-500 italic p-4 text-center border rounded-md">
            No dates are currently blocked.
          </div>
        )}
      </div>
    </div>
  );
} 