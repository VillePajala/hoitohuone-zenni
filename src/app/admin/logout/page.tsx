'use client';

import { useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear browser storage to be safe
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear all cookies by setting expiry in the past
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        
        // Sign out of Clerk with a timeout
        await Promise.race([
          signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 3000))
        ]);
        
        // Force redirect to sign-in with cache-busting parameter
        const timestamp = Date.now();
        window.location.href = `/admin/sign-in?logout=success&t=${timestamp}`;
      } catch (err) {
        console.error('Logout failed:', err);
        setError('Sign out failed. Please try again.');
        
        // Force redirect anyway after a delay
        setTimeout(() => {
          window.location.href = '/admin/sign-in?error=Logout failed. Please try again.';
        }, 2000);
      }
    };
    
    performLogout();
  }, [signOut]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-4">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
        <h1 className="text-2xl font-bold mb-2">Signing Out</h1>
        <p className="text-gray-500">Please wait while we sign you out...</p>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
} 