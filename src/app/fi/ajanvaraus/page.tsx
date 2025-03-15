import { Metadata } from 'next';
import BookingPageClient from '@/components/booking/BookingPageClient';

export const metadata: Metadata = {
  title: 'Varaa aika | Hoitohuone Zenni',
  description: 'Varaa aika helposti Hoitohuone Zennin palveluihin.',
};

export default function BookingPage() {
  return <BookingPageClient />;
} 