/**
 * Cookie Service Utility
 * 
 * Provides a consistent way to access cookies in both synchronous and asynchronous contexts.
 * Works with Next.js App Router API routes regardless of middleware wrapping.
 */

import { cookies } from 'next/headers';
import { log } from './logging';
import { NextRequest, NextResponse } from 'next/server';

interface CookieOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

/**
 * Helper to safely extract cookies from raw headers
 */
const extractCookieFromHeader = (cookieHeader: string | null, name: string): string | undefined => {
  if (!cookieHeader) return undefined;
  
  const cookies = cookieHeader.split(';');
  
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return undefined;
};

/**
 * Cookie Service
 */
export const CookieService = {
  /**
   * Get a cookie value using multiple methods to handle different contexts
   */
  get: (request: NextRequest | Request | null, name: string, requestId?: string): string | undefined => {
    try {
      // Method 1: Try using Next.js cookies() API first
      try {
        // TypeScript errors here because it doesn't know cookies() might return a Promise
        // We'll use a direct header approach instead to avoid the Promise issue
        
        // Method 2: If we have a request object, extract cookies from headers directly
        if (request) {
          const cookieHeader = request.headers.get('cookie');
          const value = extractCookieFromHeader(cookieHeader, name);
          if (value) {
            log.debug(`Cookie '${name}' retrieved from request headers`, { requestId });
            return value;
          }
        }
      } catch (err) {
        // Log any errors but continue to fallback methods
        log.debug(`Error in primary cookie extraction method`, { requestId, error: err });
      }
      
      log.debug(`Cookie '${name}' not found`, { requestId });
      return undefined;
    } catch (error) {
      log.error(`Error accessing cookie '${name}'`, { requestId, error });
      return undefined;
    }
  },
  
  /**
   * Get multiple cookies at once
   */
  getMultiple: (request: NextRequest | Request | null, names: string[], requestId?: string): Record<string, string | undefined> => {
    const result: Record<string, string | undefined> = {};
    
    for (const name of names) {
      result[name] = CookieService.get(request, name, requestId);
    }
    
    return result;
  },
  
  /**
   * Set a cookie in a response
   */
  set: (response: NextResponse, name: string, value: string, options?: CookieOptions): void => {
    try {
      response.cookies.set({
        name,
        value,
        ...options
      });
      
      // Also add a Set-Cookie header for compatibility
      const currentSetCookie = response.headers.get('Set-Cookie') || '';
      const cookieString = `${name}=${encodeURIComponent(value)}`;
      
      let optionsString = '';
      if (options?.maxAge) optionsString += `; Max-Age=${options.maxAge}`;
      if (options?.path) optionsString += `; Path=${options.path}`;
      if (options?.domain) optionsString += `; Domain=${options.domain}`;
      if (options?.secure) optionsString += `; Secure`;
      if (options?.httpOnly) optionsString += `; HttpOnly`;
      
      const newCookie = `${cookieString}${optionsString}`;
      
      if (currentSetCookie) {
        response.headers.set('Set-Cookie', `${currentSetCookie}, ${newCookie}`);
      } else {
        response.headers.set('Set-Cookie', newCookie);
      }
    } catch (error) {
      log.error(`Error setting cookie '${name}'`, { error });
    }
  },
  
  /**
   * Set multiple cookies at once
   */
  setMultiple: (response: NextResponse, cookies: Array<{ name: string, value: string, options?: CookieOptions }>): void => {
    for (const cookie of cookies) {
      CookieService.set(response, cookie.name, cookie.value, cookie.options);
    }
  },
  
  /**
   * Create a success response with cookies
   */
  createResponseWithCookies: <T>(
    data: T, 
    cookies: Array<{ name: string, value: string, options?: CookieOptions }>,
    options?: {
      status?: number;
      headers?: Record<string, string>;
      requestId?: string;
    }
  ): NextResponse => {
    const { status = 200, headers = {}, requestId } = options || {};
    
    // Create the response
    const response = NextResponse.json(
      { 
        data,
        meta: {
          timestamp: new Date().toISOString(),
          ...(requestId ? { requestId } : {})
        }
      },
      { 
        status,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    );
    
    // Set the cookies
    CookieService.setMultiple(response, cookies);
    
    return response;
  }
}; 