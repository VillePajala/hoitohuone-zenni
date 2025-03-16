'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check environment variables that are exposed to the client
    setEnvVars({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'not set',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'not set',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'not set',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || 'not set',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || 'not set',
    });
  }, []);

  const handleManualRedirect = () => {
    window.location.href = '/admin/dashboard';
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Auth State:</h3>
            <ul className="list-disc pl-5 mt-2">
              <li>isLoaded: {isLoaded ? 'true' : 'false'}</li>
              <li>isSignedIn: {isSignedIn ? 'true' : 'false'}</li>
              <li>userId: {userId || 'none'}</li>
            </ul>
          </div>
          
          {user && (
            <div>
              <h3 className="font-medium">User Info:</h3>
              <ul className="list-disc pl-5 mt-2">
                <li>Email: {user.primaryEmailAddress?.emailAddress || 'none'}</li>
                <li>Name: {user.fullName || 'none'}</li>
                <li>Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'unknown'}</li>
              </ul>
            </div>
          )}
          
          <div>
            <h3 className="font-medium">Environment Variables:</h3>
            <ul className="list-disc pl-5 mt-2">
              {Object.entries(envVars).map(([key, value]) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
          
          <Button onClick={handleManualRedirect}>
            Manually Navigate to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 