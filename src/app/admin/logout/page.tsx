'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton, useClerk } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { withErrorBoundary } from '@/components/ErrorBoundary';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { logError } from '@/lib/errorHandling';

function LogoutPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { refreshToken } = useAdminAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle full logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Clear Clerk session
      await signOut();
      
      // Attempt to clear tokens from local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expiry');
      
      // Redirect to sign-in page
      router.push('/admin/sign-in');
    } catch (err) {
      logError(err, 'Error during logout');
      setError('There was an error logging out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    // Set a timeout to redirect automatically after 3 seconds
    const timer = setTimeout(() => {
      if (!isLoggingOut && !error) {
        handleLogout();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Logging Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {error ? (
            <>
              <p className="text-red-500">{error}</p>
              <Button 
                onClick={handleLogout}
                className="w-full"
              >
                Try Again
              </Button>
            </>
          ) : isLoggingOut ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Signing you out...</p>
            </div>
          ) : (
            <>
              <p>You are being signed out. Redirecting in a moment...</p>
              <Button 
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out Now
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full mt-2"
              >
                Cancel
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withErrorBoundary(LogoutPage); 