import { redirect } from 'next/navigation';

export default function BookingRedirect() {
  redirect('/fi/ajanvaraus');
  return null;
} 