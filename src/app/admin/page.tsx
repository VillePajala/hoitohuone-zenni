'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function AdminIndexPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
} 