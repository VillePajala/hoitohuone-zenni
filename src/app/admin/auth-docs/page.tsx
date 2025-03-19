'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function AuthDocsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Authentication Documentation</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="flows">Authentication Flows</TabsTrigger>
          <TabsTrigger value="errors">Error Handling</TabsTrigger>
          <TabsTrigger value="debugging">Debugging</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication System Overview</CardTitle>
              <CardDescription>How authentication works in this application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Authentication Architecture</h3>
                <p className="mb-4">
                  This application uses a combination of Clerk for user authentication and a custom token management 
                  system for API calls. The system is designed to manage token refreshes, handle authentication errors,
                  and provide a consistent auth context across the application.
                </p>
                
                <h4 className="font-medium mb-2">Core Components</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>AuthContext</strong> - Provides authentication state throughout the application</li>
                  <li><strong>useAdminAuth hook</strong> - Handles token management and API calls</li>
                  <li><strong>authLogger</strong> - Logs authentication events with different severity levels</li>
                  <li><strong>Auth Utils</strong> - Shared utilities for token parsing and formatting</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Authentication Flow</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>User signs in through Clerk authentication</li>
                  <li>AuthContext captures the authentication state</li>
                  <li>JWT tokens are stored securely and managed by the auth hooks</li>
                  <li>Tokens are automatically refreshed before they expire</li>
                  <li>Protected routes and API endpoints verify authentication</li>
                </ol>
              </div>
              
              <Alert>
                <AlertTitle>Security Note</AlertTitle>
                <AlertDescription>
                  Never expose sensitive authentication tokens in client-side code. 
                  The system redacts token values in logs and debug output.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Components</CardTitle>
              <CardDescription>Key components in the authentication system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">AuthContext</h3>
                <p className="mb-2">
                  The AuthContext provides authentication state throughout the application, 
                  making it available to all components via the useAuthContext hook.
                </p>
                <pre className="bg-gray-50 p-4 rounded text-xs mb-2">
                  {`// Using the auth context
import { useAuthContext } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, isLoading, error } = useAuthContext();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;
  
  return <div>Protected content</div>;
}`}
                </pre>
                <p className="text-sm text-muted-foreground">
                  Provides: isAuthenticated, isLoading, refreshAuth, hasTokenExpired, error, clearError
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">useAdminAuth Hook</h3>
                <p className="mb-2">
                  This custom hook handles authentication for admin routes, API requests, 
                  and token management. It integrates with Clerk for authentication.
                </p>
                <pre className="bg-gray-50 p-4 rounded text-xs mb-2">
                  {`// Using the admin auth hook
import { useAdminAuth } from '@/hooks/useAdminAuth';

function AdminComponent() {
  const { 
    isSignedIn, 
    isLoading, 
    authGet, 
    authPost 
  } = useAdminAuth(true); // Auto-redirect to login
  
  async function fetchData() {
    const data = await authGet('/api/admin/data');
    // Process data...
  }
  
  return <div>Admin component</div>;
}`}
                </pre>
                <p className="text-sm text-muted-foreground">
                  Provides: isSignedIn, isLoading, isAuthError, refreshToken, authFetch, authGet, authPost, authPatch, authDelete
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">authLogger</h3>
                <p className="mb-2">
                  A specialized logger for authentication events with different severity levels and context tracking.
                </p>
                <pre className="bg-gray-50 p-4 rounded text-xs mb-2">
                  {`// Using the auth logger
import { authLogger } from '@/lib/authLogger';

// Different log levels
authLogger.debug('Starting auth process', { context: 'login-page' });
authLogger.info('User authenticated', { context: 'auth-flow', data: { userId } });
authLogger.warn('Token expires soon', { context: 'token-mgmt' });
authLogger.error('Failed to refresh token', { context: 'api-call', data: error });`}
                </pre>
                <p className="text-sm text-muted-foreground">
                  Log levels: DEBUG, INFO, WARN, ERROR, NONE (for disabling logging)
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Auth Utils</h3>
                <p className="mb-2">
                  Shared utility functions for handling authentication tokens and formats.
                </p>
                <pre className="bg-gray-50 p-4 rounded text-xs mb-2">
                  {`// Auth utils
import { parseJwtToken, formatTokenForDisplay } from '@/lib/authUtils';

// Parse a JWT token
const token = '...'; // JWT token
const parsed = parseJwtToken(token);
console.log(parsed.exp); // Expiration timestamp

// Format token for display (redacts most of the content)
const displayToken = formatTokenForDisplay(token);
// Output: eyJh...XYZ (first and last 3 chars)`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Flows</CardTitle>
              <CardDescription>How authentication works in different scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">User Sign-In Flow</h3>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>User visits login page and enters credentials</li>
                  <li>Clerk handles authentication and creates a session</li>
                  <li>JWT token is stored securely</li>
                  <li>AuthContext is updated with authenticated state</li>
                  <li>User is redirected to the requested protected page</li>
                </ol>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Token Refresh Flow</h3>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Application regularly checks token expiry time</li>
                  <li>When token is close to expiring, a refresh is triggered</li>
                  <li>Refresh can happen automatically or manually via refreshAuth()</li>
                  <li>New token replaces the old one if successful</li>
                  <li>If refresh fails, user may need to re-authenticate</li>
                </ol>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Protected API Calls</h3>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Component makes a request using authFetch, authGet, etc.</li>
                  <li>Auth hook automatically adds the authentication token</li>
                  <li>If token is expired, a refresh is attempted first</li>
                  <li>API call proceeds with valid token</li>
                  <li>If authentication fails, error is handled appropriately</li>
                </ol>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Sign-Out Flow</h3>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>User triggers sign-out action</li>
                  <li>Clerk sign-out function is called</li>
                  <li>Tokens are invalidated and cookies cleared</li>
                  <li>AuthContext state is updated</li>
                  <li>User is redirected to public area</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Error Handling</CardTitle>
              <CardDescription>Common errors and how to handle them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Common Authentication Errors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">Token Expired</h4>
                    <p className="text-sm mb-2">Authentication token has expired and needs refresh</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs">
                      {`// Check for expired token
const { hasTokenExpired } = useAuthContext();
if (hasTokenExpired) {
  await refreshAuth();
}`}
                    </pre>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">Unauthorized Access</h4>
                    <p className="text-sm mb-2">User doesn't have permissions for a resource</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs">
                      {`// API returns 401/403
try {
  await authGet('/api/admin/resource');
} catch (error) {
  if (error.status === 401) {
    // Redirect to login
  }
}`}
                    </pre>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">Token Refresh Failed</h4>
                    <p className="text-sm mb-2">Unable to refresh the authentication token</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs">
                      {`// Handle refresh failure
const success = await refreshAuth();
if (!success) {
  // Clear state and redirect to login
}`}
                    </pre>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">Invalid Session</h4>
                    <p className="text-sm mb-2">Session has been invalidated server-side</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs">
                      {`// Check session validity
const { isAuthError } = useAdminAuth();
if (isAuthError) {
  // Handle session error
}`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Error Recovery Strategies</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Automatic Token Refresh</strong>
                    <p className="text-sm">The auth system attempts to refresh tokens automatically before they expire.</p>
                  </li>
                  <li>
                    <strong>Error State in Context</strong>
                    <p className="text-sm">AuthContext tracks error state so components can react accordingly.</p>
                  </li>
                  <li>
                    <strong>Failed Request Retry</strong>
                    <p className="text-sm">Auth hooks can automatically retry failed requests after refreshing tokens.</p>
                  </li>
                  <li>
                    <strong>Fallback Content</strong>
                    <p className="text-sm">Components should display appropriate fallback content during auth errors.</p>
                  </li>
                  <li>
                    <strong>Redirect to Login</strong>
                    <p className="text-sm">For unrecoverable errors, redirect the user to login page.</p>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="debugging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debugging Authentication Issues</CardTitle>
              <CardDescription>Tools and techniques for troubleshooting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Authentication Debugging Tools</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Auth Dashboard</strong>
                    <p className="text-sm">
                      Visit <a href="/admin/auth-dashboard" className="text-blue-600 hover:underline">/admin/auth-dashboard</a> to see current auth state, token information, and user details.
                    </p>
                  </li>
                  <li>
                    <strong>Auth Test Page</strong>
                    <p className="text-sm">
                      Visit <a href="/admin/auth-test" className="text-blue-600 hover:underline">/admin/auth-test</a> to test auth functionality and token refreshes.
                    </p>
                  </li>
                  <li>
                    <strong>Auth Debug API</strong>
                    <p className="text-sm">
                      Call <code className="bg-gray-100 px-1">/api/admin/auth-debug</code> to get detailed information about the current auth state.
                    </p>
                  </li>
                  <li>
                    <strong>Auth Logger</strong>
                    <p className="text-sm">
                      Check browser console for auth logs. You can adjust the log level in the Auth Dashboard.
                    </p>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Common Debugging Scenarios</h3>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">Unexpected Logouts</h4>
                    <ol className="list-decimal pl-6 text-sm">
                      <li>Check if token is expiring prematurely (view token expiry in Auth Dashboard)</li>
                      <li>Verify automatic token refresh is working (check console logs)</li>
                      <li>Look for auth errors in network requests (401/403 responses)</li>
                      <li>Ensure token is being properly passed in API requests</li>
                    </ol>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">API Authorization Failures</h4>
                    <ol className="list-decimal pl-6 text-sm">
                      <li>Confirm token is valid and not expired</li>
                      <li>Verify correct authentication headers in requests</li>
                      <li>Check if user has necessary permissions</li>
                      <li>Test the endpoint directly with a valid token</li>
                    </ol>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-1">Redirect Loops</h4>
                    <ol className="list-decimal pl-6 text-sm">
                      <li>Check authentication state consistency</li>
                      <li>Verify redirect conditions in protected routes</li>
                      <li>Ensure auth state is properly initialized before redirects</li>
                      <li>Look for conflicting auth checks in middleware and components</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Debugging Best Practices</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Use the Auth Dashboard to view current authentication state</li>
                  <li>Enable DEBUG log level during troubleshooting</li>
                  <li>Check network requests for authentication headers</li>
                  <li>Verify token expiration times when sessions end unexpectedly</li>
                  <li>Use browser developer tools to inspect auth cookies</li>
                  <li>Test with different browsers to identify client-specific issues</li>
                  <li>Compare client and server auth states when they seem inconsistent</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 