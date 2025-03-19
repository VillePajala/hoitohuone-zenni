/**
 * Auth Utilities
 * Shared utilities for authentication functionality
 */

import { authLogger } from './authLogger';

// Constants for token management
export const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiration
export const TOKEN_CHECK_INTERVAL_MS = 60 * 1000; // Check token every minute
export const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between refreshes

/**
 * Parse JWT token to get expiration time
 */
export function getTokenExpiryTime(token: string): number | null {
  try {
    // JWT tokens are three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // The second part contains the payload, which is base64 encoded
    const payload = JSON.parse(atob(parts[1]));
    
    // Get the expiration time, which is in seconds
    const exp = payload.exp;
    if (!exp) return null;
    
    // Convert to milliseconds
    return exp * 1000;
  } catch (error) {
    authLogger.error('Error parsing JWT token', { context: 'token-parsing', data: error });
    return null;
  }
}

/**
 * Format token for display (first few characters only)
 */
export function formatTokenForDisplay(token: string, length = 10): string {
  if (!token) return 'no-token';
  if (token.length <= length) return token;
  return `${token.substring(0, length)}...`;
}

/**
 * Check if token is near expiry
 */
export function isTokenNearExpiry(expiryTimeMs: number | null, marginMs = TOKEN_REFRESH_MARGIN_MS): boolean {
  if (!expiryTimeMs) return false;
  const timeUntilExpiry = expiryTimeMs - Date.now();
  return timeUntilExpiry < marginMs;
}

/**
 * Check if token has expired
 */
export function hasTokenExpired(expiryTimeMs: number | null): boolean {
  if (!expiryTimeMs) return false;
  return Date.now() > expiryTimeMs;
}

/**
 * Get API key from various sources
 */
export function getApiKey(): string | null {
  // Try to get API key from window
  if (typeof window !== 'undefined') {
    const windowAny = window as any;
    if (windowAny.ADMIN_API_SECRET) {
      authLogger.debug('Found API key in window object', { context: 'api-key' });
      return windowAny.ADMIN_API_SECRET;
    }
    
    // Try meta tag
    try {
      const apiKeyMeta = document.querySelector('meta[name="admin-api-secret"]');
      if (apiKeyMeta) {
        const metaApiKey = apiKeyMeta.getAttribute('content');
        if (metaApiKey) {
          authLogger.debug('Found API key in meta tag', { context: 'api-key' });
          // Cache it on window for future use
          windowAny.ADMIN_API_SECRET = metaApiKey;
          return metaApiKey;
        }
      }
    } catch (e) {
      authLogger.error('Error reading API key from meta tag', { context: 'api-key', data: e });
    }
  }
  
  return null;
}

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parse a JWT token
 */
export function parseJwtToken(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    authLogger.error('Failed to parse JWT token', { context: 'token-parsing', data: error });
    return null;
  }
} 