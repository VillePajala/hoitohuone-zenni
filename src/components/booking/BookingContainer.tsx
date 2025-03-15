'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { add } from 'date-fns';
import styles from './booking.module.css';

import ServiceSelection from './ServiceSelection';
import DatePicker from './DatePicker';
import TimeSlotSelection from './TimeSlotSelection';
import CustomerForm from './CustomerForm';
import BookingConfirmation from './BookingConfirmation';

// Define the Service interface to match ServiceSelection component
interface Service {
  id: string;
  name: string;
  nameEn: string;
  nameFi: string;
  description: string;
  descriptionEn: string;
  descriptionFi: string;
  duration: number;
  price: number;
  currency: string;
  active: boolean;
}

// Define the TimeSlot interface to match TimeSlotSelection component
interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Define booking steps
enum BookingStep {
  SERVICE_SELECTION = 0,
  DATE_SELECTION = 1,
  TIME_SELECTION = 2,
  CUSTOMER_INFO = 3,
  CONFIRMATION = 4
}

// Type for customer form data
interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  privacyPolicy: boolean;
}

// Interface for the final booking data
interface BookingData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
  serviceId: string;
  serviceName?: string;
  appointmentDate: Date;
  appointmentTime: string;
}

export default function BookingContainer() {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en') || false;
  
  // State for tracking the current step
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SERVICE_SELECTION);
  
  // State for selected service
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);

  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // State for selected time slot
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // State for booking result
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    error?: string;
    bookingDetails?: BookingData;
  } | null>(null);
  
  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Translation helper function
  const t = useCallback((en: string, fi: string): string => isEnglish ? en : fi, [isEnglish]);

  // Handle service selection
  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedService(service.id);
    setSelectedServiceName(isEnglish ? service.nameEn : service.nameFi);
    setCurrentStep(BookingStep.DATE_SELECTION);
  }, [isEnglish]);
  
  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentStep(BookingStep.TIME_SELECTION);
  }, []);
  
  // Handle time slot selection
  const handleTimeSlotSelect = useCallback((timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setCurrentStep(BookingStep.CUSTOMER_INFO);
  }, []);
  
  // Handle customer form submission
  const handleCustomerFormSubmit = useCallback(async (data: CustomerFormData) => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      return;
    }

    setIsSubmitting(true);

    // Prepare booking data
    const bookingData: BookingData = {
      customerName: data.name,
      customerEmail: data.email,
      customerPhone: data.phone,
      customerNotes: data.notes,
      serviceId: selectedService,
      serviceName: selectedServiceName || undefined,
      appointmentDate: selectedDate,
      appointmentTime: selectedTimeSlot.startTime
    };

    try {
      // Make API request to save booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: bookingData.serviceId,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          date: bookingData.appointmentDate.toISOString(),
          startTime: `${bookingData.appointmentDate.toISOString().split('T')[0]}T${bookingData.appointmentTime}:00`,
          endTime: `${bookingData.appointmentDate.toISOString().split('T')[0]}T${selectedTimeSlot.endTime}:00`,
          notes: bookingData.customerNotes,
          language: isEnglish ? 'en' : 'fi'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create booking');
      }

      // Set booking result state for confirmation
      setBookingResult({
        success: true,
        bookingDetails: bookingData
      });

      // Move to confirmation step
      setCurrentStep(BookingStep.CONFIRMATION);
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        bookingDetails: bookingData
      });
      setCurrentStep(BookingStep.CONFIRMATION);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedService, selectedDate, selectedTimeSlot, selectedServiceName, isEnglish]);

  // Handle going back to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  }, [currentStep]);

  // Render step titles
  const renderStepTitle = useCallback(() => {
    switch(currentStep) {
      case BookingStep.SERVICE_SELECTION:
        return t('Select Service', 'Valitse palvelu');
      case BookingStep.DATE_SELECTION:
        return t('Select Date', 'Valitse päivä');
      case BookingStep.TIME_SELECTION:
        return t('Select Time', 'Valitse aika');
      case BookingStep.CUSTOMER_INFO:
        return t('Your Information', 'Yhteystietosi');
      case BookingStep.CONFIRMATION:
        return t('Booking Confirmation', 'Varauksen vahvistus');
      default:
        return '';
    }
  }, [currentStep, t]);

  // Render progress indicator
  const renderProgressIndicator = useCallback(() => {
    if (currentStep === BookingStep.CONFIRMATION) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative">
          {[
            BookingStep.SERVICE_SELECTION,
            BookingStep.DATE_SELECTION,
            BookingStep.TIME_SELECTION,
            BookingStep.CUSTOMER_INFO
          ].map((step) => (
            <div key={step} className="flex flex-col items-center z-10">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${currentStep === step ? 'bg-neutral-900 text-white' : 
                    currentStep > step ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-600'}
                `}
              >
                {currentStep > step ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                ) : (
                  step + 1
                )}
              </div>
              <span className="text-xs mt-2 text-neutral-600">
                {step === BookingStep.SERVICE_SELECTION && t('Service', 'Palvelu')}
                {step === BookingStep.DATE_SELECTION && t('Date', 'Päivä')}
                {step === BookingStep.TIME_SELECTION && t('Time', 'Aika')}
                {step === BookingStep.CUSTOMER_INFO && t('Details', 'Tiedot')}
              </span>
            </div>
          ))}
          
          {/* Progress Line */}
          <div className="absolute h-0.5 bg-neutral-200 w-2/3 max-w-sm left-1/2 transform -translate-x-1/2 z-0">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ 
                width: `${Math.min((currentStep / 3) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }, [currentStep, t]);

  // Render current step
  const renderCurrentStep = useCallback(() => {
    switch(currentStep) {
      case BookingStep.SERVICE_SELECTION:
        // Force immediate rendering of ServiceSelection without animation
        return (
          <div className={`booking-component-wrapper ${styles.bookingComponent}`} style={{opacity: 1, visibility: 'visible', display: 'block'}}>
            <ServiceSelection onServiceSelect={handleServiceSelect} />
          </div>
        );
        
      case BookingStep.DATE_SELECTION:
        if (!selectedService) {
          setCurrentStep(BookingStep.SERVICE_SELECTION);
          return null;
        }
        return (
          <div className={`booking-component-wrapper ${styles.bookingComponent}`} style={{opacity: 1, visibility: 'visible', display: 'block'}}>
            <DatePicker 
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              minDate={new Date()}
              maxDate={add(new Date(), { months: 3 })}
              serviceId={selectedService}
            />
          </div>
        );
        
      case BookingStep.TIME_SELECTION:
        if (!selectedDate || !selectedService) {
          setCurrentStep(BookingStep.DATE_SELECTION);
          return null;
        }
        return (
          <div className={`booking-component-wrapper ${styles.bookingComponent}`} style={{opacity: 1, visibility: 'visible', display: 'block'}}>
            <TimeSlotSelection 
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotSelect={handleTimeSlotSelect}
              serviceId={selectedService}
            />
          </div>
        );
        
      case BookingStep.CUSTOMER_INFO:
        if (!selectedTimeSlot || !selectedDate || !selectedService) {
          setCurrentStep(BookingStep.TIME_SELECTION);
          return null;
        }
        return (
          <div className={`booking-component-wrapper ${styles.bookingComponent}`} style={{opacity: 1, visibility: 'visible', display: 'block'}}>
            <CustomerForm 
              onSubmit={handleCustomerFormSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        );
        
      case BookingStep.CONFIRMATION:
        if (!bookingResult) {
          setCurrentStep(BookingStep.CUSTOMER_INFO);
          return null;
        }
        return (
          <div className={`booking-component-wrapper ${styles.bookingComponent}`} style={{opacity: 1, visibility: 'visible', display: 'block'}}>
            <BookingConfirmation 
              bookingDetails={bookingResult.bookingDetails!}
              isSuccess={bookingResult.success}
              isError={!bookingResult.success}
              errorMessage={bookingResult.error}
            />
          </div>
        );
        
      default:
        return null;
    }
  }, [
    currentStep, 
    selectedService, 
    selectedDate, 
    selectedTimeSlot, 
    bookingResult, 
    handleServiceSelect, 
    handleDateSelect, 
    handleTimeSlotSelect, 
    handleCustomerFormSubmit, 
    isSubmitting
  ]);

  // Render back button
  const renderBackButton = useCallback(() => {
    if (currentStep === BookingStep.SERVICE_SELECTION || currentStep === BookingStep.CONFIRMATION) {
      return null;
    }

    return (
      <button
        onClick={handleBack}
        className="absolute left-4 top-4 p-2 text-neutral-500 hover:text-neutral-700"
        aria-label={t('Back', 'Takaisin')}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
      </button>
    );
  }, [currentStep, handleBack, t]);

  return (
    <div className={`relative max-w-4xl mx-auto py-12 px-4 ${styles.fadeInFixGlobal}`}>
      {renderBackButton()}
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif">
          {renderStepTitle()}
        </h1>
      </div>
      
      {renderProgressIndicator()}
      {renderCurrentStep()}
    </div>
  );
}
