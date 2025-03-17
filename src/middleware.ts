import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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
  '/api/services', // Public services API
  '/api/availability',
  '/api/bookings',
  '/api/available-dates',
  '/api/time-slots',
  '/api/debug', // Debug endpoints
  '/admin/bookings/debug', // Debug UI
  'favicon.ico',
  '/_next',
  '/',
  ...locales.map(locale => `/${locale}`),
  '/admin/sign-in',
  '/admin/sign-up'
];

// Create route matchers
const isAdminRoute = createRouteMatcher(['/admin/(.*)', '/api/admin/(.*)']);
const isDebugRoute = createRouteMatcher(['/api/debug/(.*)', '/admin/(.*)/debug/(.*)', '/admin/(.*)/debug']);

// Export the middleware
export default clerkMiddleware(async (auth, req) => {
  // Skip auth for debug routes
  if (isDebugRoute(req)) {
    console.log('Debug route detected, bypassing auth');
    return NextResponse.next();
  }
  
  // Handle admin routes (both UI and API)
  if (isAdminRoute(req)) {
    // Skip auth check for public admin routes
    if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
      return NextResponse.next();
    }
    
    // Check if user is authenticated
    try {
      await auth.protect();
    } catch {
      // For API routes, return 401
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in to access this resource' },
          { status: 401 }
        );
      }
      // For UI routes, redirect to sign-in
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