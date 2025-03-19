import { NextRequest, NextResponse } from 'next/server';

// Define supported locales and configurations
const defaultLocale = 'fi';
const locales = ['en', 'fi'];

// Patterns for different types of routes
const ADMIN_PROTECTED_ROUTES = /^\/admin\/(?!(sign-in|sign-up|logout))/;
const PUBLIC_ADMIN_ROUTES = /^\/admin\/(sign-in|sign-up|logout)/;
const STATIC_FILES = /\..*$/;

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip for static files
  if (STATIC_FILES.test(pathname)) {
    return NextResponse.next();
  }
  
  // Handle admin routes - let Clerk handle them directly
  if (pathname.startsWith('/admin')) {
    // Public admin routes - let them pass through
    if (PUBLIC_ADMIN_ROUTES.test(pathname)) {
      return NextResponse.next();
    }
    
    // Protected admin routes - Clerk will handle auth via client-side
    if (ADMIN_PROTECTED_ROUTES.test(pathname)) {
      return NextResponse.next();
    }
    
    // Any other admin route
    return NextResponse.next();
  }
  
  // For non-admin routes, handle locale
  if (!pathname.startsWith('/api')) {
    // Check if the pathname already includes a locale
    const pathnameHasLocale = locales.some(
      locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    
    if (!pathnameHasLocale) {
      // Redirect if locale is missing
      const url = new URL(`/${defaultLocale}${pathname}`, request.url);
      url.search = request.nextUrl.search;
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 