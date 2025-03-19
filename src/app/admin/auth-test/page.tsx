'use client';

import { useEffect, useState } from 'react';
import { authLogger } from '@/lib/authLogger';
import { useAuth } from '@clerk/nextjs';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthTestPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const adminAuth = useAdminAuth();
  const { refreshToken, authGet } = adminAuth;

  // Test the auth logger on component mount
  useEffect(() => {
    authLogger.debug('Auth test page mounted', { context: 'auth-test' });
    authLogger.info('Auth testing initialized', { context: 'auth-test' });
    authLogger.warn('This is a test warning', { context: 'auth-test' });
  }, []);

  // Function to test the auth debug endpoint
  const testAuthDebug = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      authLogger.info('Testing auth debug endpoint', { context: 'auth-test' });
      
      // First, try with authGet from useAdminAuth if available
      if (authGet) {
        try {
          const data = await authGet('/api/admin/auth-debug');
          setDebugData(data);
          authLogger.info('Auth debug test succeeded with authGet', { context: 'auth-test' });
          setIsLoading(false);
          return;
        } catch (authError) {
          authLogger.warn('Auth debug test failed with authGet, falling back to fetch', { 
            context: 'auth-test',
            data: authError
          });
        }
      } else {
        authLogger.info('authGet not available, using direct fetch', { context: 'auth-test' });
      }
      
      // Fall back to direct fetch if authGet fails or is not available
      const response = await fetch('/api/admin/auth-debug');
      if (!response.ok) {
        throw new Error(`Auth debug request failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setError(error as Error);
      authLogger.error('Auth debug test failed', { 
        context: 'auth-test',
        data: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test token refresh
  const testTokenRefresh = async () => {
    try {
      authLogger.info('Testing token refresh', { context: 'auth-test' });
      if (refreshToken) {
        const success = await refreshToken();
        authLogger.info(`Token refresh ${success ? 'succeeded' : 'failed'}`, { context: 'auth-test' });
      } else {
        authLogger.warn('refreshToken function not available', { context: 'auth-test' });
      }
    } catch (error) {
      authLogger.error('Token refresh test error', { 
        context: 'auth-test',
        data: error
      });
    }
  };

  // Get current token
  const getCurrentToken = async () => {
    try {
      const token = await getToken();
      authLogger.info('Retrieved current token', { 
        context: 'auth-test',
        data: token ? { tokenLength: token.length, tokenStart: token.substring(0, 10) + '...' } : 'No token'
      });
    } catch (error) {
      authLogger.error('Get token test error', { 
        context: 'auth-test',
        data: error
      });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>
            Test the authentication system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="mb-2"><strong>Auth State:</strong></p>
            <ul className="list-disc ml-6">
              <li>Is Loaded: {isLoaded ? 'Yes' : 'No'}</li>
              <li>Is Signed In: {isSignedIn ? 'Yes' : 'No'}</li>
              <li>Auth Error: {adminAuth.isAuthError ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={testAuthDebug} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Test Auth Debug'}
            </Button>
            <Button onClick={testTokenRefresh} variant="outline">
              Test Token Refresh
            </Button>
            <Button onClick={getCurrentToken} variant="outline">
              Get Current Token
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded whitespace-pre-wrap">
              {error.message}
            </pre>
          </CardContent>
        </Card>
      )}

      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Auth Debug Results</CardTitle>
            <CardDescription>
              Data retrieved from /api/admin/auth-debug
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[500px] whitespace-pre-wrap">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Request ID: {debugData.debug?.requestId || 'N/A'}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 