'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatISO } from 'date-fns';
import styles from './booking.module.css';

interface Service {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  duration: number;
  price: number;
}

interface BookingDetails {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
  serviceId: string;
  serviceName?: string;
  appointmentDate: Date;
  appointmentTime: string;
  createdAt?: Date;
}

interface BookingConfirmationProps {
  bookingDetails: BookingDetails;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export default function BookingConfirmation({
  bookingDetails,
  isSuccess = true,
  isError = false,
  errorMessage = '',
}: BookingConfirmationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Translation helper function
  const t = useCallback((en: string, fi: string): string => isEnglish ? en : fi, [isEnglish]);
  
  // Format date according to locale
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(isEnglish ? 'en-US' : 'fi-FI', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  // Fetch service details
  useEffect(() => {
    if (!bookingDetails.serviceId) return;
    
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/${bookingDetails.serviceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch service details');
        }
        
        const data = await response.json();
        setService(data);
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [bookingDetails.serviceId]);

  useEffect(() => {
    // Fix fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      el.classList.add('animate-fade-in');
    });
  }, []);

  // Handle back to home navigation
  const handleBackToHome = () => {
    router.push(isEnglish ? '/en' : '/');
  };

  // Display error state
  if (isError) {
    return (
      <div className={`max-w-2xl mx-auto py-8 text-center fade-in animate-fade-in ${styles.bookingComponent}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-serif text-red-800 mb-4">
            {t('Booking Failed', 'Varaus epäonnistui')}
          </h2>
          <p className="text-red-700 mb-6">
            {errorMessage || t(
              'There was an error processing your booking. Please try again later.',
              'Varauksesi käsittelyssä tapahtui virhe. Yritä myöhemmin uudelleen.'
            )}
          </p>
          <button
            onClick={handleBackToHome}
            className="bg-neutral-900 text-white font-medium py-3 px-6 rounded-md
              transition-colors duration-200 hover:bg-neutral-800"
          >
            {t('Back to Home', 'Takaisin etusivulle')}
          </button>
        </div>
      </div>
    );
  }

  // Display loading state when fetching service
  if (loading) {
    return (
      <div className={`max-w-2xl mx-auto py-8 text-center fade-in animate-fade-in ${styles.bookingComponent}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="h-4 bg-neutral-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Display success confirmation
  return (
    <div className={`max-w-2xl mx-auto py-8 fade-in animate-fade-in ${styles.bookingComponent}`}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-green-600" 
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
        </div>
        
        <h2 className="text-2xl font-serif mb-2">
          {t('Booking Confirmed!', 'Varaus vahvistettu!')}
        </h2>
        
        <p className="text-neutral-600">
          {t(
            'Your appointment has been successfully booked. A confirmation email has been sent to your email address.',
            'Varauksesi on onnistuneesti tehty. Vahvistusviesti on lähetetty sähköpostiisi.'
          )}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">
          {t('Booking Details', 'Varauksen tiedot')}
        </h3>
        
        <div className="space-y-4">
          {/* Service */}
          <div className="flex border-b border-neutral-100 pb-3">
            <div className="w-1/3 text-neutral-600">
              {t('Service', 'Palvelu')}
            </div>
            <div className="w-2/3 font-medium">
              {service ? (isEnglish ? service.name_en : service.name) : bookingDetails.serviceName}
            </div>
          </div>
          
          {/* Date */}
          <div className="flex border-b border-neutral-100 pb-3">
            <div className="w-1/3 text-neutral-600">
              {t('Date', 'Päivämäärä')}
            </div>
            <div className="w-2/3 font-medium">
              {formatDate(bookingDetails.appointmentDate)}
            </div>
          </div>
          
          {/* Time */}
          <div className="flex border-b border-neutral-100 pb-3">
            <div className="w-1/3 text-neutral-600">
              {t('Time', 'Aika')}
            </div>
            <div className="w-2/3 font-medium">
              {formatTime(bookingDetails.appointmentTime)}
            </div>
          </div>
          
          {/* Customer */}
          <div className="flex border-b border-neutral-100 pb-3">
            <div className="w-1/3 text-neutral-600">
              {t('Name', 'Nimi')}
            </div>
            <div className="w-2/3 font-medium">
              {bookingDetails.customerName}
            </div>
          </div>
          
          {/* Email */}
          <div className="flex border-b border-neutral-100 pb-3">
            <div className="w-1/3 text-neutral-600">
              {t('Email', 'Sähköposti')}
            </div>
            <div className="w-2/3 font-medium">
              {bookingDetails.customerEmail}
            </div>
          </div>
          
          {/* Phone */}
          {bookingDetails.customerPhone && (
            <div className="flex border-b border-neutral-100 pb-3">
              <div className="w-1/3 text-neutral-600">
                {t('Phone', 'Puhelinnumero')}
              </div>
              <div className="w-2/3 font-medium">
                {bookingDetails.customerPhone}
              </div>
            </div>
          )}
          
          {/* Notes */}
          {bookingDetails.customerNotes && (
            <div className="flex">
              <div className="w-1/3 text-neutral-600">
                {t('Notes', 'Lisätiedot')}
              </div>
              <div className="w-2/3 font-medium">
                {bookingDetails.customerNotes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-neutral-600 mb-6">
          {t(
            'If you need to make changes to your booking, please contact us.',
            'Jos haluat tehdä muutoksia varaukseen, ole yhteydessä meihin.'
          )}
        </p>
        
        <button
          onClick={handleBackToHome}
          className="bg-neutral-900 text-white font-medium py-3 px-6 rounded-md
            transition-colors duration-200 hover:bg-neutral-800"
        >
          {t('Back to Home', 'Takaisin etusivulle')}
        </button>
      </div>
    </div>
  );
}
