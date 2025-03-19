'use client';

import { useEffect, useState } from 'react';
import { authLogger } from '@/lib/authLogger';
import { LogLevel } from '@/lib/authLogger';
import { useAuth, useUser } from '@clerk/nextjs';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatTokenForDisplay, parseJwtToken } from '@/lib/authUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuthDashboardPage() {
  // Auth hooks
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const adminAuth = useAdminAuth(false); // Don't auto-redirect
  const authContext = useAuthContext();
  
  // State
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentTab, setCurrentTab] = useState("overview");
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [currentLogLevel, setCurrentLogLevel] = useState<LogLevel>(authLogger.getLevel());
  
  // Fetch initial debug data
  useEffect(() => {
    fetchDebugData();
    
    // Log component mount with current auth state
    authLogger.info('Auth dashboard loaded', { 
      context: 'auth-dashboard',
      data: {
        isSignedIn,
        isLoaded,
        hasAuthContext: !!authContext,
      }
    });
  }, [isSignedIn, isLoaded]);
  
  // Fetch token info when signed in
  useEffect(() => {
    if (isSignedIn) {
      fetchTokenInfo();
    }
  }, [isSignedIn]);
  
  // Fetch auth debug data
  const fetchDebugData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      authLogger.info('Fetching auth debug data', { context: 'auth-dashboard' });
      
      // Conditional approach based on available functions
      if (adminAuth.authGet) {
        try {
          const data = await adminAuth.authGet('/api/admin/auth-debug');
          setDebugData(data);
          authLogger.info('Auth debug data fetched successfully', { context: 'auth-dashboard' });
        } catch (authError) {
          authLogger.warn('Auth debug fetch failed with authGet, falling back to fetch', { 
            context: 'auth-dashboard',
            data: authError
          });
          await fetchWithFallback();
        }
      } else {
        await fetchWithFallback();
      }
    } catch (error) {
      setError(error as Error);
      authLogger.error('Auth debug fetch failed', { 
        context: 'auth-dashboard',
        data: error
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fallback fetch method
  const fetchWithFallback = async () => {
    const response = await fetch('/api/admin/auth-debug');
    if (!response.ok) {
      throw new Error(`Auth debug request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    setDebugData(data);
  };
  
  // Fetch and process the current token
  const fetchTokenInfo = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setTokenInfo({ status: 'No token available' });
        return;
      }
      
      const parsedToken = parseJwtToken(token);
      if (!parsedToken) {
        setTokenInfo({ status: 'Failed to parse token', tokenStart: formatTokenForDisplay(token) });
        return;
      }
      
      // Process token info
      const expiryTime = parsedToken.exp ? new Date(parsedToken.exp * 1000) : null;
      const issuedTime = parsedToken.iat ? new Date(parsedToken.iat * 1000) : null;
      const timeUntilExpiry = expiryTime ? expiryTime.getTime() - Date.now() : null;
      
      setTokenInfo({
        status: 'Valid',
        tokenStart: formatTokenForDisplay(token),
        parsedToken,
        expiryTime: expiryTime?.toISOString(),
        issuedTime: issuedTime?.toISOString(),
        expiresIn: timeUntilExpiry ? `${Math.round(timeUntilExpiry / 1000 / 60)} minutes` : 'Unknown',
        isExpired: timeUntilExpiry ? timeUntilExpiry <= 0 : false,
      });
      
      authLogger.info('Token info fetched and parsed', { 
        context: 'auth-dashboard',
        data: {
          tokenStart: formatTokenForDisplay(token),
          expiresIn: timeUntilExpiry ? `${Math.round(timeUntilExpiry / 1000 / 60)} minutes` : 'Unknown',
        }
      });
    } catch (error) {
      authLogger.error('Error fetching token info', { 
        context: 'auth-dashboard',
        data: error
      });
      setTokenInfo({ status: 'Error', error });
    }
  };
  
  // Force token refresh
  const refreshCurrentToken = async () => {
    try {
      authLogger.info('Manual token refresh requested', { context: 'auth-dashboard' });
      
      if (adminAuth.refreshToken) {
        const success = await adminAuth.refreshToken();
        authLogger.info(`Token refresh ${success ? 'succeeded' : 'failed'}`, { context: 'auth-dashboard' });
        
        if (success) {
          await fetchTokenInfo();
          await fetchDebugData();
        }
      } else if (authContext?.refreshAuth) {
        const success = await authContext.refreshAuth();
        authLogger.info(`Context token refresh ${success ? 'succeeded' : 'failed'}`, { context: 'auth-dashboard' });
        
        if (success) {
          await fetchTokenInfo();
          await fetchDebugData();
        }
      } else {
        authLogger.warn('No refresh method available', { context: 'auth-dashboard' });
      }
    } catch (error) {
      authLogger.error('Token refresh error', { 
        context: 'auth-dashboard',
        data: error
      });
    }
  };
  
  // Change log level
  const handleLogLevelChange = (level: string) => {
    const newLevel = parseInt(level, 10) as LogLevel;
    authLogger.setLevel(newLevel);
    setCurrentLogLevel(newLevel);
    authLogger.info(`Log level changed to ${LogLevel[newLevel]}`, { context: 'auth-dashboard' });
  };
  
  // Get log level name
  const getLogLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };
  
  // Get status badge 
  const getStatusBadge = (isActive: boolean, text: string) => {
    return (
      <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-500" : ""}>
        {text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Authentication Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sign-in Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSignedIn ? 
                <span className="text-green-600">Signed In</span> : 
                <span className="text-red-600">Not Signed In</span>
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auth Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminAuth.isAuthError ? 
                <span className="text-red-600">Error</span> : 
                <span className="text-green-600">None</span>
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokenInfo?.isExpired ? 
                <span className="text-red-600">Expired</span> : 
                isSignedIn ? 
                  <span className="text-green-600">Valid</span> : 
                  <span className="text-gray-600">No Token</span>
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Log Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={currentLogLevel.toString()} onValueChange={handleLogLevelChange}>
              <SelectTrigger>
                <SelectValue>{getLogLevelName(currentLogLevel)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LogLevel.DEBUG.toString()}>DEBUG</SelectItem>
                <SelectItem value={LogLevel.INFO.toString()}>INFO</SelectItem>
                <SelectItem value={LogLevel.WARN.toString()}>WARN</SelectItem>
                <SelectItem value={LogLevel.ERROR.toString()}>ERROR</SelectItem>
                <SelectItem value={LogLevel.NONE.toString()}>NONE</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={fetchDebugData} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
          <Button onClick={refreshCurrentToken} variant="outline">
            Refresh Token
          </Button>
          <Button onClick={fetchTokenInfo} variant="outline">
            Update Token Info
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="token">Token</TabsTrigger>
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="debug">Debug Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Overview</CardTitle>
              <CardDescription>Current state of the authentication system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(isLoaded, "Loaded")}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(!!isSignedIn, "Signed In")}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(!adminAuth.isAuthError, "Auth Valid")}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(!!tokenInfo && !tokenInfo.isExpired, "Token Valid")}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(!authContext?.hasTokenExpired, "Context Token Valid")}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Auth Context</h3>
                {authContext ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Authenticated:</div>
                    <div>{authContext.isAuthenticated ? 'Yes' : 'No'}</div>
                    <div>Loading:</div>
                    <div>{authContext.isLoading ? 'Yes' : 'No'}</div>
                    <div>Token Expired:</div> 
                    <div>{authContext.hasTokenExpired ? 'Yes' : 'No'}</div>
                    <div>Has Error:</div>
                    <div>{authContext.error ? 'Yes' : 'No'}</div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Auth context not available</p>
                )}
              </div>
              
              {tokenInfo?.expiresIn && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Token Expiry</h3>
                    <p className={tokenInfo.isExpired ? "text-red-600 font-medium" : "font-medium"}>
                      {tokenInfo.isExpired ? 'Token has expired' : `Expires in ${tokenInfo.expiresIn}`}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="token" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
              <CardDescription>Details about your current authentication token</CardDescription>
            </CardHeader>
            <CardContent>
              {!isSignedIn ? (
                <Alert>
                  <AlertTitle>Not signed in</AlertTitle>
                  <AlertDescription>
                    Sign in to view token information
                  </AlertDescription>
                </Alert>
              ) : !tokenInfo ? (
                <div className="text-center p-4">
                  <p>Loading token information...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Token Status</h3>
                    <p className="font-medium">
                      {tokenInfo.status}
                    </p>
                    {tokenInfo.tokenStart && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Token: {tokenInfo.tokenStart}
                      </p>
                    )}
                  </div>
                  
                  {tokenInfo.parsedToken && (
                    <>
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-2">Token Expiry</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Issued At:</div>
                          <div>{tokenInfo.issuedTime || 'Unknown'}</div>
                          <div>Expires At:</div>
                          <div className={tokenInfo.isExpired ? "text-red-600" : ""}>
                            {tokenInfo.expiryTime || 'Unknown'}
                          </div>
                          <div>Time Remaining:</div>
                          <div className={tokenInfo.isExpired ? "text-red-600" : ""}>
                            {tokenInfo.isExpired ? 'Expired' : tokenInfo.expiresIn}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-2">Token Claims</h3>
                        <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[300px] text-xs">
                          {JSON.stringify(tokenInfo.parsedToken, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchTokenInfo} variant="outline" className="w-full">
                Refresh Token Info
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Details about the current user</CardDescription>
            </CardHeader>
            <CardContent>
              {!isSignedIn ? (
                <Alert>
                  <AlertTitle>Not signed in</AlertTitle>
                  <AlertDescription>
                    Sign in to view user information
                  </AlertDescription>
                </Alert>
              ) : !user ? (
                <div className="text-center p-4">
                  <p>Loading user information...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {user.imageUrl && (
                      <img 
                        src={user.imageUrl} 
                        alt={user.fullName || 'User'} 
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-medium">{user.fullName || 'Anonymous User'}</h3>
                      <p className="text-sm text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">User Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>User ID:</div>
                      <div>{user.id}</div>
                      <div>First Name:</div>
                      <div>{user.firstName || 'Not set'}</div>
                      <div>Last Name:</div>
                      <div>{user.lastName || 'Not set'}</div>
                      <div>Email:</div>
                      <div>{user.primaryEmailAddress?.emailAddress || 'Not set'}</div>
                      <div>Email Verified:</div>
                      <div>{user.primaryEmailAddress?.verification?.status === 'verified' ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Detailed debugging information from the authentication system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!debugData ? (
                <div className="text-center p-4">
                  <p>No debug data available. Click "Refresh Data" to fetch.</p>
                </div>
              ) : (
                <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[500px] text-xs">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchDebugData} className="w-full">
                {isLoading ? 'Loading...' : 'Refresh Debug Data'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 