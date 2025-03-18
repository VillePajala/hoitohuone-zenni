'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { withErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorType, createError } from '@/lib/errorHandling';
import { useAuthContext } from '@/contexts/AuthContext';

function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<Error | null>(null);
  const { refreshAuth } = useAuthContext();
  
  // Check for error message in URL parameters
  const errorMessage = searchParams.get('error');
  const redirectUrl = searchParams.get('redirect_url') || '/admin/dashboard';
  
  useEffect(() => {
    if (errorMessage) {
      setError(createError(
        ErrorType.AUTHENTICATION,
        decodeURIComponent(errorMessage)
      ));
    }
  }, [errorMessage]);
  
  useEffect(() => {
    // If the user is already signed in, redirect to dashboard
    if (isLoaded && isSignedIn) {
      refreshAuth().then(() => {
        router.replace(redirectUrl);
      });
    }
  }, [isLoaded, isSignedIn, router, redirectUrl, refreshAuth]);

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
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          
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
            redirectUrl={redirectUrl}
          />
          {isLoaded && isSignedIn && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Already signed in</p>
              <Button 
                onClick={() => router.replace(redirectUrl)}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withErrorBoundary(SignInPage); 