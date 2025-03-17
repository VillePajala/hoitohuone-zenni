'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './booking.module.css';

// Import the BookingContainer component without SSR to prevent hydration issues
const BookingContainer = dynamic(
  () => import('@/components/booking/BookingContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto pt-8 pb-16">
          <div className="max-w-4xl mx-auto py-12 px-4 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-64 mx-auto mb-8"></div>
              <div className="h-80 bg-white border border-neutral-200 rounded-lg shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
);

export default function BookingPageClient() {
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted client-side before rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto pt-8 pb-16">
          <div className="max-w-4xl mx-auto py-12 px-4 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-64 mx-auto mb-8"></div>
              <div className="h-80 bg-white border border-neutral-200 rounded-lg shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className={`bg-neutral-50 min-h-screen ${styles.fadeInFixGlobal}`}>
      <div className={`container mx-auto pt-8 pb-16 booking-component-wrapper ${styles.bookingComponent}`} style={{opacity: 1, visibility: 'visible'}}>
        <BookingContainer />
      </div>
    </main>
  );
} 