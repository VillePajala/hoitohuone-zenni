import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of supported locales
const locales = ['en', 'fi'];
const defaultLocale = 'fi';

function getLocale(request: NextRequest) {
  // Get the preferred locale from the accept-language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')[0]
      .trim()
      .split('-')[0]
      .toLowerCase();
    if (locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname is missing a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Get the preferred locale
    const locale = getLocale(request);

    // Redirect to the same pathname with locale prefix
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname === '/' ? '' : pathname}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!_next|api|favicon.ico|.*\\.).*)',
  ],
}; 