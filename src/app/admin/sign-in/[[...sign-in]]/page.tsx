'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/admin/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50'
              }
            }}
            redirectUrl="/admin/dashboard"
            afterSignInUrl="/admin/dashboard"
          />
          {isLoaded && isSignedIn && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Already signed in</p>
              <Button 
                onClick={() => router.replace('/admin/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 