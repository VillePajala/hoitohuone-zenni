'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import styles from './booking.module.css';

interface DatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  serviceId?: string;
}

export default function DatePicker({ 
  selectedDate, 
  onDateSelect,
  minDate = new Date(),
  maxDate,
  serviceId
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');
  
  // Format date to YYYY-MM-DD for comparisons
  const formatDateToString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get current month's days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a date is the currently selected date
  const isSelectedDate = (date: Date): boolean => {
    return selectedDate !== null && 
           formatDateToString(date) === formatDateToString(selectedDate);
  };

  // Check if a date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is available (based on data from API)
  const isDateAvailable = (date: Date): boolean => {
    // Make sure we're working with a Set and use the formatted date string
    return availableDates.has(formatDateToString(date));
  };

  // Check if date is within min and max bounds
  const isDateInRange = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  // Fetch available dates for the current month
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        setLoading(true);
        
        // Format current month and year for the API request
        const monthStr = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const yearStr = String(currentMonth.getFullYear());
        
        // Make API request to get available dates
        const response = await fetch(
          `/api/available-dates?month=${monthStr}&year=${yearStr}&serviceId=${serviceId || ''}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch available dates');
        }
        
        const data = await response.json();
        
        // Check if data is valid and ensure we always use a Set
        if (data && Array.isArray(data.availableDates)) {
          // Convert array to Set
          setAvailableDates(new Set(data.availableDates));
        } else {
          console.warn('Using mock available dates due to invalid API response');
          // Generate mock available dates (weekdays in the current month)
          const mockDates = [];
          const daysInMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
          ).getDate();
          
          for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            // Skip weekends (Saturday and Sunday)
            if (date.getDay() !== 0 && date.getDay() !== 6) {
              // Add 70% of weekdays as available
              if (Math.random() > 0.3) {
                mockDates.push(formatDateToString(date));
              }
            }
          }
          
          setAvailableDates(new Set(mockDates));
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
        
        // Generate fallback mock available dates
        const mockDates = [];
        const daysInMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0
        ).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
          // Skip weekends (Saturday and Sunday)
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            // Add 70% of weekdays as available
            if (Math.random() > 0.3) {
              mockDates.push(formatDateToString(date));
            }
          }
        }
        
        setAvailableDates(new Set(mockDates));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableDates();
  }, [currentMonth, serviceId]);

  useEffect(() => {
    // Fix fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      el.classList.add('animate-fade-in');
    });
  }, []);

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format month name based on language
  const formatMonth = (date: Date): string => {
    if (isEnglish) {
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return date.toLocaleString('fi-FI', { month: 'long', year: 'numeric' });
    }
  };

  // Generate the days for the calendar
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Adjust for weeks starting on Monday (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeekStart = 1; // Monday
    const adjustedFirstDay = (firstDayOfMonth - dayOfWeekStart + 7) % 7;
    
    const days = [];
    
    // Add day name headers (Monday to Sunday)
    const dayNames = isEnglish 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
      
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="text-center text-sm font-medium py-2">
          {dayNames[i]}
        </div>
      );
    }
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Add cells for days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateToString(date);
      const isSelected = isSelectedDate(date);
      const isPast = isPastDate(date);
      const isAvailable = isDateAvailable(date);
      const isInRange = isDateInRange(date);
      
      days.push(
        <div key={`day-${day}`} className="p-1">
          <button
            type="button"
            disabled={isPast || !isInRange || !isAvailable}
            onClick={() => onDateSelect(date)}
            className={`
              w-full aspect-square flex items-center justify-center rounded-full text-sm
              transition-colors duration-200
              ${isSelected 
                ? 'bg-neutral-900 text-white' 
                : isPast || !isInRange || !isAvailable
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                  : 'hover:bg-neutral-200 text-neutral-800'
              }
            `}
            aria-selected={isSelected}
            data-date={dateString}
          >
            {day}
          </button>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className={`max-w-md mx-auto py-8 fade-in animate-fade-in ${styles.bookingComponent}`}>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={previousMonth}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            aria-label={isEnglish ? "Previous month" : "Edellinen kuukausi"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-medium capitalize">
            {formatMonth(currentMonth)}
          </h2>
          
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            aria-label={isEnglish ? "Next month" : "Seuraava kuukausi"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full bg-neutral-900"></div>
            <span>{isEnglish ? 'Selected' : 'Valittu'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full bg-neutral-100"></div>
            <span>{isEnglish ? 'Not available' : 'Ei saatavilla'}</span>
          </div>
        </div>
        
        {loading && (
          <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-neutral-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <span className="ml-2 text-sm text-neutral-600">
              {isEnglish ? 'Checking availability...' : 'Tarkistetaan saatavuutta...'}
            </span>
          </div>
        )}
        
        {!serviceId && (
          <div className="mt-4 pt-4 border-t border-neutral-200 text-center text-sm text-neutral-600">
            {isEnglish 
              ? 'Please select a service first to see available dates' 
              : 'Valitse ensin palvelu nähdäksesi saatavilla olevat päivät'}
          </div>
        )}
      </div>
    </div>
  );
} 