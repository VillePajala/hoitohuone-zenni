import { jwtVerify, createRemoteJWKSet } from 'jose';
import { authLogger } from '@/lib/authLogger';

// Cache for JWK set to improve performance
let jwkSet: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwkSetLastFetchTime = 0;
const JWK_CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Validate a Clerk JWT token using JWK validation
 * @param token The JWT token to validate
 * @returns Promise<boolean> True if token is valid, false otherwise
 */
export async function validateClerkToken(token: string): Promise<boolean> {
  try {
    // Initialize or refresh JWK set if needed
    const now = Date.now();
    if (!jwkSet || now - jwkSetLastFetchTime > JWK_CACHE_TTL) {
      // Using environment variable for the Clerk domain
      const clerkDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'clerk.zenni.com';
      const jwksUrl = `https://${clerkDomain}/.well-known/jwks.json`;
      
      jwkSet = createRemoteJWKSet(new URL(jwksUrl));
      jwkSetLastFetchTime = now;
      
      authLogger.debug('JWK set refreshed', { context: 'token-validation' });
    }
    
    // Verify the token
    const result = await jwtVerify(token, jwkSet);
    
    // Additional validation can be added here (e.g., checking issuer, audience)
    // For example: if (result.payload.iss !== expectedIssuer) return false;
    
    return !!result.payload;
  } catch (error) {
    authLogger.error('Token validation failed', { 
      context: 'token-validation',
      data: error 
    });
    return false;
  }
}

/**
 * Extract information from a JWT token without verifying signature
 * @param token The JWT token to decode
 * @returns The decoded token payload or null if invalid
 */
export function decodeToken(token: string): any {
  try {
    // Split the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const decodedPayload = Buffer.from(parts[1], 'base64').toString();
    return JSON.parse(decodedPayload);
  } catch (error) {
    authLogger.error('Token decoding failed', { 
      context: 'token-validation',
      data: error 
    });
    return null;
  }
}

/**
 * Check if a token is expired based on its 'exp' claim
 * @param token The JWT token or decoded payload to check
 * @returns boolean True if token is expired, false otherwise
 */
export function isTokenExpired(token: string | any): boolean {
  try {
    // If token is a string, decode it first
    const payload = typeof token === 'string' ? decodeToken(token) : token;
    
    if (!payload || !payload.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    return true;
  }
} 