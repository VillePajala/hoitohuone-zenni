'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Copy, 
  ArrowRight, 
  RotateCcw, 
  Eraser,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type for time slot
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  hasConflict?: boolean;
  isInvalid?: boolean;
  conflictMessage?: string;
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

// Default business hours schedule
const defaultBusinessSchedule = {
  Monday: { enabled: true, timeSlots: [{ id: 'mon-1', startTime: '09:00', endTime: '17:00' }] },
  Tuesday: { enabled: true, timeSlots: [{ id: 'tue-1', startTime: '09:00', endTime: '17:00' }] },
  Wednesday: { enabled: true, timeSlots: [{ id: 'wed-1', startTime: '09:00', endTime: '17:00' }] },
  Thursday: { enabled: true, timeSlots: [{ id: 'thu-1', startTime: '09:00', endTime: '17:00' }] },
  Friday: { enabled: true, timeSlots: [{ id: 'fri-1', startTime: '09:00', endTime: '17:00' }] },
  Saturday: { enabled: false, timeSlots: [] },
  Sunday: { enabled: false, timeSlots: [] },
};

// Extended business hours schedule
const extendedBusinessSchedule = {
  Monday: { 
    enabled: true, 
    timeSlots: [
      { id: 'mon-1', startTime: '08:00', endTime: '12:00' },
      { id: 'mon-2', startTime: '13:00', endTime: '19:00' }
    ] 
  },
  Tuesday: { 
    enabled: true, 
    timeSlots: [
      { id: 'tue-1', startTime: '08:00', endTime: '12:00' },
      { id: 'tue-2', startTime: '13:00', endTime: '19:00' }
    ] 
  },
  Wednesday: { 
    enabled: true, 
    timeSlots: [
      { id: 'wed-1', startTime: '08:00', endTime: '12:00' },
      { id: 'wed-2', startTime: '13:00', endTime: '19:00' }
    ] 
  },
  Thursday: { 
    enabled: true, 
    timeSlots: [
      { id: 'thu-1', startTime: '08:00', endTime: '12:00' },
      { id: 'thu-2', startTime: '13:00', endTime: '19:00' }
    ] 
  },
  Friday: { 
    enabled: true, 
    timeSlots: [
      { id: 'fri-1', startTime: '08:00', endTime: '16:00' }
    ] 
  },
  Saturday: { enabled: false, timeSlots: [] },
  Sunday: { enabled: false, timeSlots: [] },
};

// Weekend schedule
const weekendSchedule = {
  Monday: { enabled: false, timeSlots: [] },
  Tuesday: { enabled: false, timeSlots: [] },
  Wednesday: { enabled: false, timeSlots: [] },
  Thursday: { enabled: false, timeSlots: [] },
  Friday: { enabled: false, timeSlots: [] },
  Saturday: { enabled: true, timeSlots: [{ id: 'sat-1', startTime: '10:00', endTime: '16:00' }] },
  Sunday: { enabled: true, timeSlots: [{ id: 'sun-1', startTime: '10:00', endTime: '16:00' }] },
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

  // State for copy day dialog
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [sourceDayToCopy, setSourceDayToCopy] = useState<string>('Monday');
  const [targetDayToCopy, setTargetDayToCopy] = useState<string>('Tuesday');

  // Add state to track when validation is needed
  const [shouldValidate, setShouldValidate] = useState(false);

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
          // Trigger validation after loading data
          setShouldValidate(true);
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
    setShouldValidate(true);
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
    setShouldValidate(true);
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
    setShouldValidate(true);
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Validate all time slots in each day and mark conflicts
  const validateAllTimeSlots = () => {
    setDays((prev) => {
      const newDays = { ...prev };
      
      // For each day
      for (const day of daysOfWeek) {
        if (!newDays[day].enabled || newDays[day].timeSlots.length <= 1) {
          // If day is disabled or has 0-1 slots, clear any validation flags
          newDays[day].timeSlots = newDays[day].timeSlots.map(slot => ({
            ...slot,
            hasConflict: false,
            isInvalid: false,
            conflictMessage: undefined
          }));
          continue;
        }
        
        // Sort time slots by start time
        const sortedSlots = [...newDays[day].timeSlots].sort((a, b) => 
          timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );
        
        // Map of slot IDs to their validation status
        const slotValidation: Record<string, { 
          hasConflict: boolean; 
          isInvalid: boolean; 
          conflictMessage?: string 
        }> = {};
        
        // Initialize all slots as valid
        sortedSlots.forEach(slot => {
          slotValidation[slot.id] = { hasConflict: false, isInvalid: false };
        });
        
        // Check each slot for internal time validity (end > start)
        sortedSlots.forEach(slot => {
          const startMinutes = timeToMinutes(slot.startTime);
          const endMinutes = timeToMinutes(slot.endTime);
          
          if (endMinutes <= startMinutes) {
            slotValidation[slot.id].isInvalid = true;
            slotValidation[slot.id].conflictMessage = 
              `End time (${slot.endTime}) must be after start time (${slot.startTime})`;
          }
        });
        
        // Check for overlaps between slots
        for (let i = 0; i < sortedSlots.length - 1; i++) {
          const currentSlot = sortedSlots[i];
          const nextSlot = sortedSlots[i + 1];
          
          const currentEnd = timeToMinutes(currentSlot.endTime);
          const nextStart = timeToMinutes(nextSlot.startTime);
          
          if (currentEnd > nextStart) {
            // Mark both slots as having conflicts
            slotValidation[currentSlot.id].hasConflict = true;
            slotValidation[nextSlot.id].hasConflict = true;
            
            slotValidation[currentSlot.id].conflictMessage = 
              `Overlaps with ${nextSlot.startTime}-${nextSlot.endTime}`;
            slotValidation[nextSlot.id].conflictMessage = 
              `Overlaps with ${currentSlot.startTime}-${currentSlot.endTime}`;
          }
        }
        
        // Apply validation to all time slots
        newDays[day].timeSlots = newDays[day].timeSlots.map(slot => ({
          ...slot,
          hasConflict: slotValidation[slot.id]?.hasConflict || false,
          isInvalid: slotValidation[slot.id]?.isInvalid || false,
          conflictMessage: slotValidation[slot.id]?.conflictMessage
        }));
      }
      
      return newDays;
    });
  };

  // Run validation only when shouldValidate flag is true
  useEffect(() => {
    if (shouldValidate) {
      validateAllTimeSlots();
      setShouldValidate(false);
    }
  }, [shouldValidate]);

  // Update time slot with validation
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
          slot.id === id ? { 
            ...slot, 
            [field]: value,
            // Clear previous validation since we're updating
            hasConflict: undefined,
            isInvalid: undefined,
            conflictMessage: undefined
          } : slot
        ),
      },
    }));
    setShouldValidate(true);
  };

  // Check if there are any validation issues
  const hasValidationIssues = (): boolean => {
    for (const day of daysOfWeek) {
      if (!days[day].enabled) continue;
      
      const hasIssues = days[day].timeSlots.some(
        slot => slot.hasConflict || slot.isInvalid
      );
      
      if (hasIssues) return true;
    }
    
    return false;
  };

  // Check if time slots overlap - modified to use the validation flags
  const checkOverlappingTimeSlots = (): { day: string; message: string } | null => {
    for (const day of daysOfWeek) {
      if (!days[day].enabled) continue;
      
      const invalidSlot = days[day].timeSlots.find(slot => slot.isInvalid);
      if (invalidSlot) {
        return {
          day,
          message: `Invalid time range on ${day}: ${invalidSlot.startTime}-${invalidSlot.endTime}.` +
                  ` End time must be after start time.`
        };
      }
      
      const conflictingSlot = days[day].timeSlots.find(slot => slot.hasConflict);
      if (conflictingSlot) {
        return {
          day,
          message: `Time slots overlap on ${day}. Please fix the highlighted conflicts.`
        };
      }
    }
    
    return null;
  };

  // Save all settings - with validation check
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

  // Copy day settings from one day to another
  const copyDaySettings = (sourceDay: string, targetDay: string) => {
    setDays((prev) => {
      // Create deep copy of source day time slots to prevent reference issues
      const timeSlotsCopy = prev[sourceDay].timeSlots.map(slot => ({
        id: `${targetDay.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
      
      return {
        ...prev,
        [targetDay]: {
          enabled: prev[sourceDay].enabled,
          timeSlots: timeSlotsCopy,
        },
      };
    });
    
    setMessage({ 
      text: `Successfully copied ${sourceDay}'s schedule to ${targetDay}`, 
      type: 'success' 
    });
    
    // Clear message after a few seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
    
    setShouldValidate(true);
  };
  
  // Clear a day's settings
  const clearDaySettings = (day: string) => {
    if (confirm(`Are you sure you want to clear all time slots for ${day}?`)) {
      setDays((prev) => ({
        ...prev,
        [day]: {
          enabled: prev[day].enabled,
          timeSlots: [], // Remove all time slots
        },
      }));
      
      setMessage({ 
        text: `Cleared all time slots for ${day}`, 
        type: 'success' 
      });
      
      // Clear message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      setShouldValidate(true);
    }
  };
  
  // Apply a predefined schedule template
  const applyScheduleTemplate = (template: 'default' | 'extended' | 'weekend') => {
    if (confirm(`Are you sure you want to apply the ${template} schedule? This will overwrite your current schedule.`)) {
      let scheduleTemplate;
      
      switch (template) {
        case 'default':
          scheduleTemplate = defaultBusinessSchedule;
          break;
        case 'extended':
          scheduleTemplate = extendedBusinessSchedule;
          break;
        case 'weekend':
          scheduleTemplate = weekendSchedule;
          break;
        default:
          scheduleTemplate = defaultBusinessSchedule;
      }
      
      setDays(scheduleTemplate);
      
      setMessage({ 
        text: `Applied ${template} schedule template`, 
        type: 'success' 
      });
      
      // Clear message after a few seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      setShouldValidate(true);
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

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Weekly Schedule</h3>
        
        <div className="flex space-x-2">
          {/* Dialog for copying days */}
          <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Copy className="h-4 w-4 mr-1" /> Copy Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copy Day Schedule</DialogTitle>
                <DialogDescription>
                  Copy availability settings from one day to another.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-5 items-center gap-4 py-4">
                <div className="col-span-2">
                  <Label htmlFor="source-day">From</Label>
                  <Select value={sourceDayToCopy} onValueChange={setSourceDayToCopy}>
                    <SelectTrigger id="source-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={`source-${day}`} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4" />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="target-day">To</Label>
                  <Select value={targetDayToCopy} onValueChange={setTargetDayToCopy}>
                    <SelectTrigger id="target-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={`target-${day}`} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => copyDaySettings(sourceDayToCopy, targetDayToCopy)}>
                    Copy Schedule
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Templates dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-1" /> Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Apply Template</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => applyScheduleTemplate('default')}>
                Standard Business Hours (9-5)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyScheduleTemplate('extended')}>
                Extended Business Hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyScheduleTemplate('weekend')}>
                Weekend Only Schedule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            
            <div className="flex space-x-2">
              {days[day].enabled && (
                <>
                  {days[day].timeSlots.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearDaySettings(day)}
                      className="flex items-center text-gray-500"
                    >
                      <Eraser className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(day)}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Time Slot
                  </Button>
                </>
              )}
            </div>
          </div>

          {days[day].enabled && days[day].timeSlots.length > 0 && (
            <div className="space-y-3">
              {days[day].timeSlots.map((slot) => (
                <div 
                  key={slot.id} 
                  className={`flex items-center space-x-2 p-3 rounded-md ${
                    slot.hasConflict || slot.isInvalid
                      ? 'bg-red-50 border border-red-200'
                      : ''
                  }`}
                >
                  {(slot.hasConflict || slot.isInvalid) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-red-50 border border-red-200 text-red-700 p-2 max-w-xs">
                          <p>{slot.conflictMessage || 'Time conflict detected'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label 
                        htmlFor={`${day}-${slot.id}-start`} 
                        className={`text-xs mb-1 block ${
                          slot.hasConflict || slot.isInvalid ? 'text-red-700 font-medium' : ''
                        }`}
                      >
                        Start Time
                      </Label>
                      <TimePicker
                        id={`${day}-${slot.id}-start`}
                        value={slot.startTime}
                        onChange={(value) => updateTimeSlot(day, slot.id, 'startTime', value)}
                        className={slot.hasConflict || slot.isInvalid 
                          ? 'border-red-300 focus-visible:ring-red-500' 
                          : ''}
                      />
                    </div>
                    <div>
                      <Label 
                        htmlFor={`${day}-${slot.id}-end`} 
                        className={`text-xs mb-1 block ${
                          slot.hasConflict || slot.isInvalid ? 'text-red-700 font-medium' : ''
                        }`}
                      >
                        End Time
                      </Label>
                      <TimePicker
                        id={`${day}-${slot.id}-end`}
                        value={slot.endTime}
                        onChange={(value) => updateTimeSlot(day, slot.id, 'endTime', value)}
                        className={slot.hasConflict || slot.isInvalid 
                          ? 'border-red-300 focus-visible:ring-red-500' 
                          : ''}
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
          disabled={isSaving || hasValidationIssues()}
          className="relative"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
      
      {hasValidationIssues() && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-md mt-2">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Please fix the following issues before saving:</p>
              <ul className="list-disc list-inside mt-1 text-sm">
                {daysOfWeek.map(day => {
                  if (!days[day].enabled) return null;
                  
                  const invalidSlots = days[day].timeSlots.filter(slot => slot.isInvalid);
                  const conflictSlots = days[day].timeSlots.filter(slot => slot.hasConflict);
                  
                  return (
                    <Fragment key={day}>
                      {invalidSlots.length > 0 && (
                        <li>
                          <span className="font-medium">{day}</span>: 
                          {invalidSlots.length} time {invalidSlots.length === 1 ? 'slot has' : 'slots have'} invalid time ranges
                        </li>
                      )}
                      {conflictSlots.length > 0 && invalidSlots.length === 0 && (
                        <li>
                          <span className="font-medium">{day}</span>: 
                          Overlapping time slots detected
                        </li>
                      )}
                    </Fragment>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 