'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { withErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorType, createError } from '@/lib/errorHandling';

function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Check for error and success messages in URL parameters
  const errorMessage = searchParams.get('error');
  const logoutSuccess = searchParams.get('logout') === 'success';
  const redirectUrl = searchParams.get('redirect_url') || '/admin/dashboard';
  
  useEffect(() => {
    // Set error message if present in URL
    if (errorMessage) {
      setError(createError(
        ErrorType.AUTHENTICATION,
        decodeURIComponent(errorMessage)
      ));
    }
    
    // Set success message for logout
    if (logoutSuccess) {
      setSuccessMessage('You have been successfully logged out.');
    }
  }, [errorMessage, logoutSuccess]);
  
  useEffect(() => {
    // Only redirect if user is signed in AND we're not coming from a logout
    if (isLoaded && isSignedIn && !logoutSuccess) {
      // Redirect immediately to dashboard
      window.location.href = redirectUrl;
    }
  }, [isLoaded, isSignedIn, redirectUrl, logoutSuccess]);

  // Don't show the "Already Signed In" screen at all
  // Instead, show loading until redirect happens
  if (isLoaded && isSignedIn && !logoutSuccess) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Redirecting to Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          
          {successMessage && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>
                {successMessage}
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
            afterSignInUrl={redirectUrl}
          />
          
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