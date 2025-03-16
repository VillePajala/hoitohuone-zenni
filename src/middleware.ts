import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createClerkClient } from '@clerk/nextjs/server';

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

// Export the clerk middleware with enhanced error handling
export default clerkMiddleware((auth, request) => {
  const { pathname } = new URL(request.url);
  
  // Public routes that don't need authentication
  const publicRoutes = [
    '/api/services',
    '/api/availability',
    '/api/bookings',
    '/api/available-dates',
    '/api/time-slots',
    'favicon.ico',
    '/_next',
    '/',
    ...locales.map(locale => `/${locale}`),
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to sign-in and login pages
    if (pathname === '/admin/sign-in' || pathname === '/admin/login') {
      return NextResponse.next();
    }

    try {
      // Check authentication for other admin routes
      if (!auth.userId) {
        const signInUrl = new URL('/admin/sign-in', request.url);
        signInUrl.searchParams.set('redirect_url', pathname);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.next();
    } catch (error) {
      console.error('Clerk middleware error:', error);
      // On error, redirect to sign-in
      return NextResponse.redirect(new URL('/admin/sign-in', request.url));
    }
  }

  // Apply locale middleware for non-admin routes
  return localeMiddleware(request);
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