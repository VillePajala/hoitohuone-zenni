'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DashboardFixPage() {
  const [authInfo, setAuthInfo] = useState<string[]>([]);

  useEffect(() => {
    // Extract auth info from cookies and storage
    const info: string[] = [];
    
    // Check cookies
    info.push('Cookies:');
    try {
      const cookies = document.cookie.split(';');
      if (cookies.length === 0 || (cookies.length === 1 && cookies[0] === '')) {
        info.push('  No cookies found');
      } else {
        cookies.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          // Redact values but show if it's auth related
          const isAuth = name.includes('clerk') || name.includes('session');
          info.push(`  ${name}${isAuth ? ' (AUTH)' : ''}`);
        });
      }
    } catch (e) {
      info.push(`  Error checking cookies: ${e}`);
    }
    
    // Check sessionStorage
    info.push('\nSession Storage:');
    try {
      if (sessionStorage.length === 0) {
        info.push('  No session storage items found');
      } else {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const isAuth = key.includes('clerk') || key.includes('auth');
            info.push(`  ${key}${isAuth ? ' (AUTH)' : ''}`);
          }
        }
      }
    } catch (e) {
      info.push(`  Error checking sessionStorage: ${e}`);
    }
    
    // Check localStorage
    info.push('\nLocal Storage:');
    try {
      if (localStorage.length === 0) {
        info.push('  No local storage items found');
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const isAuth = key.includes('clerk') || key.includes('auth');
            info.push(`  ${key}${isAuth ? ' (AUTH)' : ''}`);
          }
        }
      }
    } catch (e) {
      info.push(`  Error checking localStorage: ${e}`);
    }
    
    setAuthInfo(info);
  }, []);

  const clearAllAuth = () => {
    try {
      // Clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Refresh the page
      window.location.reload();
    } catch (e) {
      console.error('Error clearing auth:', e);
      alert('Error clearing auth: ' + e);
    }
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Authentication Loop Fixer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This is a special page to help fix authentication loops. It doesn't depend on Clerk's hooks 
            or redirects, so it should be accessible even if you're stuck in a loop.
          </p>
          
          <div className="bg-slate-100 p-4 rounded-md">
            <h2 className="font-medium mb-2">Authentication State:</h2>
            <pre className="text-xs overflow-auto">{authInfo.join('\n')}</pre>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={clearAllAuth} 
              variant="destructive"
            >
              Clear All Auth Data
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/admin/sign-in?t=' + Date.now()}
              variant="outline"
            >
              Go to Sign In
            </Button>
            
            <Link href="/">
              <Button variant="secondary">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 