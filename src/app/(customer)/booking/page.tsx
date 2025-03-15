import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

// Import the BookingContainer component dynamically to prevent SSR issues
const BookingContainer = dynamic(
  () => import('@/components/booking/BookingContainer'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Varaa aika | Hoitohuone Zenni',
  description: 'Varaa aika helposti Hoitohuone Zennin palveluihin.',
};

export default function BookingRedirect() {
  redirect('/fi/ajanvaraus');
  return null;
}
