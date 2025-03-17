'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Type for time slot
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

// Type for day setting
interface DaySetting {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

// Type for API availability
interface ApiAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Default time slots for when a day is enabled
const defaultTimeSlot = {
  id: '1',
  startTime: '09:00',
  endTime: '17:00',
};

// Days of the week
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Map day of week to day name
const dayOfWeekToName: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export default function WeeklySchedule() {
  // State for each day's availability
  const [days, setDays] = useState<Record<string, DaySetting>>({
    Monday: { enabled: true, timeSlots: [{ ...defaultTimeSlot }] },
    Tuesday: { enabled: true, timeSlots: [{ ...defaultTimeSlot }] },
    Wednesday: { enabled: true, timeSlots: [{ ...defaultTimeSlot }] },
    Thursday: { enabled: true, timeSlots: [{ ...defaultTimeSlot }] },
    Friday: { enabled: true, timeSlots: [{ ...defaultTimeSlot }] },
    Saturday: { enabled: false, timeSlots: [] },
    Sunday: { enabled: false, timeSlots: [] },
  });

  // Add loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add message state for feedback
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'pending' } | null>(null);
  
  // Replace useAuth with useAdminAuth
  const { authGet, authPost, isAuthError, isLoading: isAuthLoading } = useAdminAuth();

  // Fetch existing availability settings
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Skip if there's an auth error
        if (isAuthError) {
          setError('Authentication required to manage availability');
          setIsLoading(false);
          return;
        }
        
        // Use authGet instead of fetch with token
        const availabilityData = await authGet('/api/admin/availability/weekly');
        
        if (availabilityData.length > 0) {
          // Convert API data to component state format
          const newDays: Record<string, DaySetting> = {
            Monday: { enabled: false, timeSlots: [] },
            Tuesday: { enabled: false, timeSlots: [] },
            Wednesday: { enabled: false, timeSlots: [] },
            Thursday: { enabled: false, timeSlots: [] },
            Friday: { enabled: false, timeSlots: [] },
            Saturday: { enabled: false, timeSlots: [] },
            Sunday: { enabled: false, timeSlots: [] },
          };
          
          // Process API data
          availabilityData.forEach((slot: ApiAvailability) => {
            const dayName = dayOfWeekToName[slot.dayOfWeek];
            if (dayName) {
              // If we find a slot for this day, mark it as enabled
              newDays[dayName].enabled = true;
              
              // Add the time slot
              newDays[dayName].timeSlots.push({
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
              });
            }
          });
          
          // Sort time slots by start time for each day
          Object.keys(newDays).forEach(day => {
            newDays[day].timeSlots.sort((a, b) => 
              a.startTime.localeCompare(b.startTime)
            );
          });
          
          setDays(newDays);
          console.log('Loaded availability settings:', newDays);
        }
      } catch (err) {
        console.error('Error fetching availability settings:', err);
        // Don't show auth errors, only show other errors
        if (!String(err).includes('Authentication') && !String(err).includes('Unauthorized')) {
          setError(err instanceof Error ? err.message : 'Failed to load availability settings');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailability();
  }, [authGet, isAuthError]);

  // Toggle a day on/off
  const toggleDay = (day: string) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        enabled: !prev[day].enabled,
        timeSlots: !prev[day].enabled 
          ? [{ id: Date.now().toString(), startTime: '09:00', endTime: '17:00' }] 
          : [],
      },
    }));
  };

  // Add a new time slot for a day
  const addTimeSlot = (day: string) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [
          ...prev[day].timeSlots,
          { 
            id: Date.now().toString(), 
            startTime: '09:00', 
            endTime: '17:00' 
          },
        ],
      },
    }));
  };

  // Remove a time slot
  const removeTimeSlot = (day: string, id: string) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((slot) => slot.id !== id),
      },
    }));
  };

  // Update a time slot
  const updateTimeSlot = (
    day: string,
    id: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot) =>
          slot.id === id ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if time slots overlap
  const checkOverlappingTimeSlots = (): { day: string; message: string } | null => {
    for (const day of daysOfWeek) {
      if (!days[day].enabled || days[day].timeSlots.length <= 1) continue;
      
      // Sort time slots by start time
      const sortedSlots = [...days[day].timeSlots].sort((a, b) => 
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
      
      // Check for overlaps
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const currentSlot = sortedSlots[i];
        const nextSlot = sortedSlots[i + 1];
        
        const currentEnd = timeToMinutes(currentSlot.endTime);
        const nextStart = timeToMinutes(nextSlot.startTime);
        
        if (currentEnd > nextStart) {
          return {
            day,
            message: `Time slots overlap on ${day}: ${currentSlot.startTime}-${currentSlot.endTime} and ${nextSlot.startTime}-${nextSlot.endTime}`
          };
        }
      }
      
      // Check for invalid time slots (end time before start time)
      for (const slot of sortedSlots) {
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        
        if (endMinutes <= startMinutes) {
          return {
            day,
            message: `Invalid time slot on ${day}: ${slot.startTime}-${slot.endTime}. End time must be after start time.`
          };
        }
      }
    }
    
    return null;
  };

  // Save all settings
  const saveSettings = async () => {
    try {
      // Validate time slots
      const overlapError = checkOverlappingTimeSlots();
      if (overlapError) {
        setMessage({ 
          text: overlapError.message, 
          type: 'error' 
        });
        return;
      }
      
      setIsSaving(true);
      setMessage({ text: 'Saving settings...', type: 'pending' });
      
      // Use authPost instead of fetch with token
      await authPost('/api/admin/availability/weekly', { days });
      
      // Show success message
      setMessage({ text: 'Weekly schedule saved successfully!', type: 'success' });
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving weekly schedule:', error);
      if (!String(error).includes('Authentication') && !String(error).includes('Unauthorized')) {
        setMessage({ 
          text: error instanceof Error ? error.message : 'An unexpected error occurred', 
          type: 'error' 
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // If there's an auth error, display login prompt
  if (isAuthError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4 text-yellow-800">
          <p className="font-medium">Authentication Required</p>
          <p className="text-sm mt-1">Please sign in to manage availability settings</p>
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
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        <span className="ml-2 text-slate-500">Loading availability settings...</span>
      </div>
    );
  }

  // If there was an error loading, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p className="font-medium">Error loading availability settings</p>
        <p className="text-sm mt-1">{error}</p>
        <Button 
          variant="outline" 
          className="mt-3" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-neutral-600 mb-4">
        Configure your regular weekly availability. For exceptions like holidays, use the Blocked Dates tab.
      </div>

      {/* Display message if there is one */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : message.type === 'error'
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {daysOfWeek.map((day) => (
        <div key={day} className="border-b pb-4 last:border-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`${day}-switch`}
                checked={days[day].enabled}
                onCheckedChange={() => toggleDay(day)}
              />
              <Label htmlFor={`${day}-switch`} className="font-medium">
                {day}
              </Label>
            </div>
            
            {days[day].enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTimeSlot(day)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Time Slot
              </Button>
            )}
          </div>

          {days[day].enabled && days[day].timeSlots.length > 0 && (
            <div className="space-y-3">
              {days[day].timeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center space-x-2">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${day}-${slot.id}-start`} className="text-xs mb-1 block">
                        Start Time
                      </Label>
                      <TimePicker
                        id={`${day}-${slot.id}-start`}
                        value={slot.startTime}
                        onChange={(value) => updateTimeSlot(day, slot.id, 'startTime', value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${day}-${slot.id}-end`} className="text-xs mb-1 block">
                        End Time
                      </Label>
                      <TimePicker
                        id={`${day}-${slot.id}-end`}
                        value={slot.endTime}
                        onChange={(value) => updateTimeSlot(day, slot.id, 'endTime', value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTimeSlot(day, slot.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {days[day].enabled && days[day].timeSlots.length === 0 && (
            <div className="text-sm text-neutral-500 italic">
              No time slots configured. Add one to make this day available.
            </div>
          )}

          {!days[day].enabled && (
            <div className="text-sm text-neutral-500 italic">
              This day is set as unavailable.
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="relative"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
} 