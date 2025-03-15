import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

// Import the BookingContainer component dynamically to prevent SSR issues
const BookingContainer = dynamic(
  () => import('@/components/booking/BookingContainer'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Book an Appointment | Hoitohuone Zenni',
  description: 'Easily book an appointment for services at Hoitohuone Zenni.',
};

export default function BookingRedirect() {
  redirect('/en/booking');
  return null;
}
