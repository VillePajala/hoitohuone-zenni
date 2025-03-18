import { clerkMiddleware, createRouteMatcher, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of supported locales
const locales = ['en', 'fi'];
const defaultLocale = 'fi';

// Function to handle locale redirects
function localeMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip locale redirection for admin routes
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Skip locale redirection for API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if the pathname is missing a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Always redirect to Finnish for root path and paths without locale
    return NextResponse.redirect(
      new URL(
        `/${defaultLocale}${pathname === '/' ? '' : pathname}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}

// Public routes that don't need authentication
const publicRoutes = [
  // Public APIs
  '/api/services',
  '/api/services/',
  '/api/services/[id]',
  '/api/availability',
  '/api/bookings',
  '/api/available-dates',
  '/api/time-slots',
  '/api/debug',
  
  // Debug UI
  '/admin/bookings/debug',
  
  // Static assets
  'favicon.ico',
  '/_next',
  
  // Public pages
  '/',
  ...locales.map(locale => `/${locale}`),
  '/admin/sign-in',
  '/admin/sign-up'
];

// Create route matchers
const isAdminRoute = createRouteMatcher(['/admin/(.*)', '/api/admin/(.*)']);
const isDebugRoute = createRouteMatcher(['/api/debug/(.*)', '/admin/(.*)/debug/(.*)', '/admin/(.*)/debug']);

// Helper function to check if a route is public
function isPublicRoute(path: string) {
  return publicRoutes.some(route => path.startsWith(route));
}

// Helper to log auth information
function logAuthInfo(req: NextRequest, auth: any) {
  console.log(`Auth middleware processing: ${req.nextUrl.pathname}`);
  console.log('Auth session:', auth.sessionId ? 'Present' : 'Missing');
  console.log('Auth user:', auth.userId ? 'Present' : 'Missing');
  
  // Check for token in headers
  const authHeader = req.headers.get('authorization');
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
}

// Export the middleware
export default clerkMiddleware(async (auth, req) => {
  // Skip auth for debug routes
  if (isDebugRoute(req)) {
    console.log('Debug route detected, bypassing auth');
    return NextResponse.next();
  }
  
  // Handle admin routes (both UI and API)
  if (isAdminRoute(req)) {
    // Log additional info for admin routes
    logAuthInfo(req, auth);
    
    // Skip auth check for public admin routes
    if (isPublicRoute(req.nextUrl.pathname)) {
      console.log('Public admin route, skipping auth check:', req.nextUrl.pathname);
      return NextResponse.next();
    }
    
    // Check if user is authenticated
    try {
      console.log('Protecting route:', req.nextUrl.pathname);
      await auth.protect();
      console.log('Auth protection passed for:', req.nextUrl.pathname);
    } catch (error) {
      console.error('Auth protection failed:', error);
      
      // For API routes, return 401
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        console.log('Returning 401 for API route:', req.nextUrl.pathname);
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in to access this resource' },
          { status: 401 }
        );
      }
      
      // For UI routes, redirect to sign-in
      console.log('Redirecting to sign-in for UI route:', req.nextUrl.pathname);
      const signInUrl = new URL('/admin/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Apply locale middleware for non-admin routes
  return localeMiddleware(req);
});

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    // Include all paths that aren't static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
    // Include all API routes
    "/api/(.*)"
  ],
}; 