import { redirect } from 'next/navigation';

export default function AjanvarausRedirect() {
  redirect('/fi/booking');
  return null;
} 