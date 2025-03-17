import { redirect } from 'next/navigation';

export default function BookingRedirect() {
  redirect('/en/booking');
  return null;
} 