'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

export default function LogoutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut();
        router.push('/admin/sign-in');
      } catch (error) {
        console.error('Error signing out:', error);
        // Force redirect to sign-in even if sign-out fails
        router.push('/admin/sign-in');
      }
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-600">Signing out...</p>
    </div>
  );
} 