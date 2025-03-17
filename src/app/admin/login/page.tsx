'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // If the user is already signed in, redirect them to the dashboard
    if (isLoaded && isSignedIn) {
      console.log("User is signed in, redirecting to dashboard");
      router.push('/admin/dashboard');
    } else {
      // Otherwise redirect to the sign-in page
      console.log("User is not signed in, redirecting to sign-in");
      router.push('/admin/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p className="text-gray-600">Please wait while we redirect you to the appropriate page.</p>
    </div>
  );
} 