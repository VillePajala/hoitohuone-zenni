import { validateClerkToken, decodeToken, isTokenExpired } from '../tokenValidator';
import { jest, describe, expect, test, beforeEach } from '@jest/globals';

// Mock the jose library
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(() => jest.fn())
}));

// Mock the authLogger
jest.mock('@/lib/authLogger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Token Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('validateClerkToken', () => {
    test('should return true for valid token', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ payload: { sub: 'user123' } });
      
      const result = await validateClerkToken('valid.token.here');
      
      expect(result).toBe(true);
      expect(jwtVerify).toHaveBeenCalledWith('valid.token.here', expect.any(Function));
    });
    
    test('should return false for invalid token', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValue(new Error('Invalid token'));
      
      const result = await validateClerkToken('invalid.token');
      
      expect(result).toBe(false);
    });
    
    test('should log error when token validation fails', async () => {
      const { jwtVerify } = require('jose');
      const error = new Error('Invalid token');
      jwtVerify.mockRejectedValue(error);
      
      const { error: logError } = require('@/lib/authLogger');
      
      await validateClerkToken('invalid.token');
      
      expect(logError).toHaveBeenCalledWith(
        'Token validation failed', 
        expect.objectContaining({
          context: 'token-validation',
          data: error
        })
      );
    });
  });
  
  describe('decodeToken', () => {
    test('should decode a valid token', () => {
      // Create a mock JWT token with a known payload
      const mockPayload = { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 };
      const mockTokenPayload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
      const mockToken = `header.${mockTokenPayload}.signature`;
      
      const result = decodeToken(mockToken);
      
      expect(result).toEqual(mockPayload);
    });
    
    test('should return null for invalid token format', () => {
      const result = decodeToken('invalid-token');
      
      expect(result).toBeNull();
    });
    
    test('should return null and log error for invalid JSON in payload', () => {
      const { error: logError } = require('@/lib/authLogger');
      const invalidPayload = Buffer.from('{invalid-json}').toString('base64');
      const invalidToken = `header.${invalidPayload}.signature`;
      
      const result = decodeToken(invalidToken);
      
      expect(result).toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Token decoding failed', 
        expect.objectContaining({
          context: 'token-validation'
        })
      );
    });
  });
  
  describe('isTokenExpired', () => {
    test('should return true for expired token', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour in the past
      
      const result = isTokenExpired(expiredPayload);
      
      expect(result).toBe(true);
    });
    
    test('should return false for valid token', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour in the future
      
      const result = isTokenExpired(validPayload);
      
      expect(result).toBe(false);
    });
    
    test('should return true for token without exp claim', () => {
      const noExpPayload = { sub: 'user123' };
      
      const result = isTokenExpired(noExpPayload);
      
      expect(result).toBe(true);
    });
    
    test('should return true for null or invalid input', () => {
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired(undefined)).toBe(true);
      expect(isTokenExpired('not-a-token-or-payload')).toBe(true);
    });
    
    test('should handle string token input by decoding first', () => {
      // Mock implementation for decodeToken
      jest.spyOn(global, 'decodeToken').mockImplementation(() => ({
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      
      const result = isTokenExpired('valid.token.here');
      
      expect(result).toBe(false);
    });
  });
}); 