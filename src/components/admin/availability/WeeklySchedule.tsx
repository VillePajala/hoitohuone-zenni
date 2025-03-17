'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { Plus, Trash2 } from 'lucide-react';

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

  // Add message state for feedback
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'pending' } | null>(null);

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

  // Save all settings
  const saveSettings = async () => {
    try {
      // Show loading state
      setMessage({ text: 'Saving settings...', type: 'pending' });
      
      // Make API call to save the weekly schedule
      const response = await fetch('/api/admin/availability/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save weekly schedule');
      }
      
      // Show success message
      setMessage({ text: 'Weekly schedule saved successfully!', type: 'success' });
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving weekly schedule:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An unexpected error occurred', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-neutral-600 mb-4">
        Configure your regular weekly availability. For exceptions like holidays, use the Blocked Dates tab.
      </div>

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
        <Button onClick={saveSettings}>Save Settings</Button>
      </div>
    </div>
  );
} 