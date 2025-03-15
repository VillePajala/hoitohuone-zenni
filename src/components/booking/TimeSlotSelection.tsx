'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import styles from './booking.module.css';

// Define interface for time slots
export interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Props interface
interface TimeSlotSelectionProps {
  selectedDate: Date;
  selectedTimeSlot: TimeSlot | null;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  serviceId?: string;
}

export default function TimeSlotSelection({
  selectedDate,
  selectedTimeSlot,
  onTimeSlotSelect,
  serviceId
}: TimeSlotSelectionProps) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en') || false;
  
  // State for available time slots
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Translation helper function
  const t = useCallback((en: string, fi: string): string => isEnglish ? en : fi, [isEnglish]);
  
  // Format the date based on locale
  const formatDate = useCallback((date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  }, []);
  
  // Format time for display
  const formatTimeForDisplay = useCallback((time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes || '00'}`;
  }, []);
  
  // Generate mock time slots function
  const generateMockTimeSlots = useCallback(() => {
    const mockSlots = [];
    // Start at 9 AM, end at 5 PM
    for (let hour = 9; hour < 17; hour++) {
      // 80% chance that a slot is available
      if (Math.random() > 0.2) {
        mockSlots.push({
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
        });
      }
    }
    setTimeSlots(mockSlots);
  }, []);
  
  // Fetch available time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Format date for API request (YYYY-MM-DD)
        const formattedDate = formatDate(selectedDate);
        
        // Make API request with service ID if available
        const url = serviceId 
          ? `/api/time-slots?date=${formattedDate}&serviceId=${serviceId}`
          : `/api/time-slots?date=${formattedDate}`;
          
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch time slots');
        }
        
        const data = await response.json();
        
        // Check if data is valid
        if (data && Array.isArray(data.timeSlots)) {
          setTimeSlots(data.timeSlots);
        } else {
          console.warn('Using mock time slots due to invalid API response');
          // Generate mock time slots
          generateMockTimeSlots();
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setError(t(
          'Failed to load time slots. Please try again later.',
          'Aikojen lataaminen epäonnistui. Yritä myöhemmin uudelleen.'
        ));
        
        // Generate mock time slots in case of error
        generateMockTimeSlots();
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedDate, serviceId, t, formatDate, generateMockTimeSlots]);
  
  // Group time slots by hour for better display
  const groupedTimeSlots = useCallback(() => {
    const grouped: Record<string, TimeSlot[]> = {};
    
    timeSlots.forEach(slot => {
      const hour = slot.startTime.split(':')[0];
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(slot);
    });
    
    return grouped;
  }, [timeSlots]);
  
  // Check if a time slot is selected
  const isTimeSlotSelected = useCallback((timeSlot: TimeSlot): boolean => {
    if (!selectedTimeSlot) return false;
    return (
      timeSlot.startTime === selectedTimeSlot.startTime && 
      timeSlot.endTime === selectedTimeSlot.endTime
    );
  }, [selectedTimeSlot]);
  
  useEffect(() => {
    // Fix fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      el.classList.add('animate-fade-in');
    });
  }, []);
  
  // If no date is selected, show message
  if (!selectedDate) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">
          {t('Please select a date first.', 'Valitse ensin päivämäärä.')}
        </p>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-neutral-200 rounded w-1/4 mx-auto"></div>
          <div className="h-20 bg-neutral-200 rounded max-w-md mx-auto"></div>
          <div className="h-20 bg-neutral-200 rounded max-w-md mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors"
        >
          {t('Refresh', 'Päivitä')}
        </button>
      </div>
    );
  }
  
  // No time slots available
  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">
          {t(
            'No time slots available for the selected date. Please choose another date.',
            'Valitulle päivälle ei ole vapaita aikoja. Valitse toinen päivä.'
          )}
        </p>
      </div>
    );
  }
  
  // Formatted date string for display
  const formattedDateString = selectedDate.toLocaleDateString(
    isEnglish ? 'en-US' : 'fi-FI',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  
  return (
    <div className={`py-4 fade-in animate-fade-in ${styles.bookingComponent}`}>
      <p className="text-center text-neutral-600 mb-6">
        {t(
          `Available time slots for ${formattedDateString}:`,
          `Vapaat ajat päivälle ${formattedDateString}:`
        )}
      </p>
      
      <div className="max-w-lg mx-auto grid gap-6">
        {Object.entries(groupedTimeSlots()).map(([hour, slots]) => (
          <div key={hour} className="border-b border-neutral-200 pb-4 last:border-0">
            <h3 className="text-lg font-medium mb-3">
              {`${hour}:00 - ${parseInt(hour) + 1}:00`}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => onTimeSlotSelect(slot)}
                  className={`
                    py-2 px-3 rounded-md transition-colors
                    ${isTimeSlotSelected(slot)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-300 hover:border-neutral-400'}
                  `}
                  aria-selected={isTimeSlotSelected(slot)}
                >
                  {formatTimeForDisplay(slot.startTime)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
