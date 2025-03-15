'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

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

  // This would typically be fetched from the backend
  useEffect(() => {
    // Simulate fetching blocked dates
    const fetchBlockedDates = async () => {
      // In a real app, fetch from API:
      // const response = await fetch('/api/admin/blocked-dates');
      // const data = await response.json();
      // setBlockedDates(data);

      // For demo, use sample data
      setBlockedDates([
        {
          id: '1',
          date: new Date(2025, 0, 1), // New Year's Day
          reason: 'New Year\'s Day'
        },
        {
          id: '2',
          date: new Date(2025, 11, 24), // Christmas Eve
          reason: 'Christmas Eve'
        },
        {
          id: '3',
          date: new Date(2025, 11, 25), // Christmas
          reason: 'Christmas Day'
        }
      ]);
    };

    fetchBlockedDates();
  }, []);

  // Add a new blocked date
  const addBlockedDate = async () => {
    if (!selectedDate) {
      setMessage({
        text: 'Please select a date first',
        type: 'error'
      });
      return;
    }

    // Check if date is already blocked
    const dateAlreadyBlocked = blockedDates.some(
      (blockedDate) => blockedDate.date.toDateString() === selectedDate.toDateString()
    );

    if (dateAlreadyBlocked) {
      setMessage({
        text: 'This date is already blocked',
        type: 'error'
      });
      return;
    }

    const newBlockedDate: BlockedDate = {
      id: Date.now().toString(),
      date: selectedDate,
      reason: newReason || 'Unavailable'
    };

    // In a real app, save to API:
    // await fetch('/api/admin/blocked-dates', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newBlockedDate),
    // });

    setBlockedDates([...blockedDates, newBlockedDate]);
    setNewReason('');
    setMessage({
      text: 'Date blocked successfully',
      type: 'success'
    });

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  // Remove a blocked date
  const removeBlockedDate = async (id: string) => {
    // In a real app, delete from API:
    // await fetch(`/api/admin/blocked-dates/${id}`, {
    //   method: 'DELETE',
    // });

    setBlockedDates(blockedDates.filter((date) => date.id !== id));
    setMessage({
      text: 'Date unblocked successfully',
      type: 'success'
    });

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

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

        <Button onClick={addBlockedDate} disabled={!selectedDate}>
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