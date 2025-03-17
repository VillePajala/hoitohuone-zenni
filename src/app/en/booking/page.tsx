import { Metadata } from 'next';
import BookingPageClient from '@/components/booking/BookingPageClient';

export const metadata: Metadata = {
  title: 'Book an Appointment | Hoitohuone Zenni',
  description: 'Easily book an appointment for services at Hoitohuone Zenni.',
};

export default function BookingPage() {
  return <BookingPageClient />;
} 