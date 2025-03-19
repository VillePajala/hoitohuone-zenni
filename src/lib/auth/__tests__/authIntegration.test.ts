import { NextRequest, NextResponse } from 'next/server';
import { validateClerkToken } from '../tokenValidator';
import { sessionManager } from '../sessionManager';
import { createAuthenticatedHandler, ApiError, ErrorCode } from '@/lib/api/authHandler';
import { jest, describe, expect, test, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('../tokenValidator', () => ({
  validateClerkToken: jest.fn(),
  decodeToken: jest.fn(),
  isTokenExpired: jest.fn()
}));

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn()
}));

jest.mock('@/lib/authLogger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager.__reset();
  });

  describe('Authentication Flow', () => {
    test('should authenticate a valid user with session', async () => {
      // Mock Clerk Auth
      const { getAuth } = require('@clerk/nextjs/server');
      getAuth.mockResolvedValue({
        userId: 'test-user-id',
        sessionId: 'test-session-id'
      });

      // Create a test handler
      const testHandler = createAuthenticatedHandler(
        async (req, ctx) => {
          return Response.json({
            success: true,
            userId: ctx.auth.userId
          });
        },
        {
          allowedMethods: ['GET'],
          authOptions: {
            requiredRoles: []
          }
        }
      );

      // Mock request
      const request = new NextRequest('https://example.com/api/test');
      
      // Call the handler
      const response = await testHandler(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        userId: 'test-user-id'
      });
    });

    test('should reject unauthenticated requests', async () => {
      // Mock Clerk Auth - no user
      const { getAuth } = require('@clerk/nextjs/server');
      getAuth.mockResolvedValue({
        userId: null,
        sessionId: null
      });

      // Mock token validation
      const { validateClerkToken } = require('../tokenValidator');
      validateClerkToken.mockResolvedValue(false);

      // Create a test handler
      const testHandler = createAuthenticatedHandler(
        async () => {
          return Response.json({ success: true });
        },
        {
          allowedMethods: ['GET'],
          authOptions: {
            requiredRoles: []
          }
        }
      );

      // Mock request
      const request = new NextRequest('https://example.com/api/test');
      
      // Call the handler
      const response = await testHandler(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data).toEqual(expect.objectContaining({
        error: expect.any(String),
        code: ErrorCode.UNAUTHORIZED
      }));
    });

    test('should authorize based on roles', async () => {
      // Mock Clerk Auth
      const { getAuth } = require('@clerk/nextjs/server');
      getAuth.mockResolvedValue({
        userId: 'admin',
        sessionId: 'admin-session'
      });

      // Create a test handler requiring admin role
      const testHandler = createAuthenticatedHandler(
        async () => {
          return Response.json({ success: true });
        },
        {
          allowedMethods: ['GET'],
          authOptions: {
            requiredRoles: ['admin']
          }
        }
      );

      // Mock request
      const request = new NextRequest('https://example.com/api/admin-test');
      
      // Call the handler
      const response = await testHandler(request);
      
      // Should succeed because our mock getUserRoles in authHandler.ts
      // returns ['admin', 'user'] for userId='admin'
      expect(response.status).toBe(200);
      
      // Now test with a regular user
      getAuth.mockResolvedValue({
        userId: 'regular-user',
        sessionId: 'user-session'
      });
      
      const response2 = await testHandler(request);
      const data2 = await response2.json();
      
      // Should fail because regular user doesn't have admin role
      expect(response2.status).toBe(403);
      expect(data2).toEqual(expect.objectContaining({
        error: expect.stringContaining('Insufficient permissions'),
        code: ErrorCode.FORBIDDEN
      }));
    });

    test('should authenticate with valid API key', async () => {
      // Store original env
      const originalEnv = process.env;
      
      // Set API key for test
      process.env.ADMIN_API_SECRET = 'test-api-key';
      
      try {
        // Mock Clerk Auth - no user
        const { getAuth } = require('@clerk/nextjs/server');
        getAuth.mockResolvedValue({
          userId: null,
          sessionId: null
        });
  
        // Create a test handler
        const testHandler = createAuthenticatedHandler(
          async (req, ctx) => {
            return Response.json({
              success: true,
              authType: ctx.auth.type
            });
          },
          {
            allowedMethods: ['GET'],
            authOptions: {
              allowApiKey: true
            }
          }
        );
  
        // Mock request with API key
        const headers = new Headers();
        headers.set('x-api-key', 'test-api-key');
        const request = new NextRequest('https://example.com/api/test', {
          headers
        });
        
        // Call the handler
        const response = await testHandler(request);
        const data = await response.json();
        
        // Assertions
        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          authType: 'apiKey'
        });
      } finally {
        // Restore env
        process.env = originalEnv;
      }
    });

    test('should authenticate with valid token in Authorization header', async () => {
      // Mock Clerk Auth - no user (forcing token path)
      const { getAuth } = require('@clerk/nextjs/server');
      getAuth.mockResolvedValue({
        userId: null,
        sessionId: null
      });

      // Mock token validation
      const { validateClerkToken } = require('../tokenValidator');
      validateClerkToken.mockResolvedValue(true);

      // Create a test handler
      const testHandler = createAuthenticatedHandler(
        async (req, ctx) => {
          return Response.json({
            success: true,
            authType: ctx.auth.type
          });
        },
        {
          allowedMethods: ['GET'],
          authOptions: {}
        }
      );

      // Mock request with Bearer token
      const headers = new Headers();
      headers.set('authorization', 'Bearer valid-token');
      const request = new NextRequest('https://example.com/api/test', {
        headers
      });
      
      // Call the handler
      const response = await testHandler(request);
      const data = await response.json();
      
      // Assertions
      expect(validateClerkToken).toHaveBeenCalledWith('valid-token');
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        authType: 'token'
      });
    });

    test('should handle method validation', async () => {
      // Create a test handler allowing only GET
      const testHandler = createAuthenticatedHandler(
        async () => {
          return Response.json({ success: true });
        },
        {
          allowedMethods: ['GET'],
          authOptions: {}
        }
      );

      // Mock GET request
      const getRequest = new NextRequest('https://example.com/api/test', {
        method: 'GET'
      });
      
      // Mock POST request
      const postRequest = new NextRequest('https://example.com/api/test', {
        method: 'POST'
      });
      
      // Mock Clerk Auth
      const { getAuth } = require('@clerk/nextjs/server');
      getAuth.mockResolvedValue({
        userId: 'test-user',
        sessionId: 'test-session'
      });
      
      // GET should work
      const getResponse = await testHandler(getRequest);
      expect(getResponse.status).toBe(200);
      
      // POST should fail
      const postResponse = await testHandler(postRequest);
      const postData = await postResponse.json();
      
      expect(postResponse.status).toBe(405); // Method Not Allowed
      expect(postData).toEqual(expect.objectContaining({
        error: expect.stringContaining('Method POST not allowed'),
        code: ErrorCode.BAD_REQUEST
      }));
    });

    test('should handle request validation with middleware', async () => {
      // Create validator function
      const validator = (body: any) => {
        if (!body.name) {
          throw new Error('Name is required');
        }
        return body;
      };
      
      // Create a test handler with validation
      const testHandler = createAuthenticatedHandler(
        async (req, ctx) => {
          return Response.json({
            success: true,
            validatedData: ctx.validatedData
          });
        },
        {
          allowedMethods: ['POST'],
          validator,
          authOptions: {}
        }
      );

      // Mock Clerk Auth
      const { getAuth } = require('@clerk/nextjs/server');
      getAuth.mockResolvedValue({
        userId: 'test-user',
        sessionId: 'test-session'
      });
      
      // Mock valid request
      const validRequest = new NextRequest('https://example.com/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Name' })
      });
      
      // Mock invalid request
      const invalidRequest = new NextRequest('https://example.com/api/test', {
        method: 'POST',
        body: JSON.stringify({ title: 'Missing Name' })
      });
      
      // Valid should work
      const validResponse = await testHandler(validRequest);
      const validData = await validResponse.json();
      
      expect(validResponse.status).toBe(200);
      expect(validData).toEqual({
        success: true,
        validatedData: { name: 'Test Name' }
      });
      
      // Invalid should fail
      const invalidResponse = await testHandler(invalidRequest);
      const invalidData = await invalidResponse.json();
      
      expect(invalidResponse.status).toBe(400);
      expect(invalidData).toEqual(expect.objectContaining({
        error: 'Name is required',
        code: ErrorCode.BAD_REQUEST
      }));
    });
  });

  describe('Session Management Integration', () => {
    test('should create and track user session', async () => {
      // Create a session
      const userId = 'integration-user';
      const sessionId = 'integration-session';
      
      const session = sessionManager.createSession(userId, sessionId, {
        userAgent: 'Test Browser',
        ip: '127.0.0.1'
      });
      
      // Verify session was created
      expect(session).toEqual(expect.objectContaining({
        userId,
        sessionId,
        userAgent: 'Test Browser',
        ip: '127.0.0.1'
      }));
      
      // Get user sessions
      const userSessions = sessionManager.getUserSessions(userId);
      
      expect(userSessions).toHaveLength(1);
      expect(userSessions[0]).toEqual(session);
    });

    test('should integrate with token validation', async () => {
      // Mock token validation
      const { validateClerkToken } = require('../tokenValidator');
      validateClerkToken.mockResolvedValue(true);
      
      // Create a handler that integrates token validation and sessions
      const integratedHandler = async (request: NextRequest) => {
        try {
          // Extract token from header
          const authHeader = request.headers.get('authorization');
          if (!authHeader?.startsWith('Bearer ')) {
            throw new ApiError(ErrorCode.UNAUTHORIZED, 'Invalid authorization');
          }
          
          const token = authHeader.slice(7);
          
          // Validate token
          const isValidToken = await validateClerkToken(token);
          if (!isValidToken) {
            throw new ApiError(ErrorCode.UNAUTHORIZED, 'Invalid token');
          }
          
          // For test purposes, assume token contains user ID 'test-user'
          const userId = 'test-user';
          
          // Get or create session
          let sessionId = request.headers.get('x-session-id');
          let session;
          
          if (sessionId) {
            // Try to get existing session
            session = sessionManager.getSession(sessionId);
            if (session) {
              // Update activity
              sessionManager.updateActivity(sessionId);
            } else {
              // Create new session if expired or not found
              sessionId = `session-${Date.now()}`;
              session = sessionManager.createSession(userId, sessionId, {
                userAgent: request.headers.get('user-agent') || undefined,
                ip: request.headers.get('x-forwarded-for') || undefined
              });
            }
          } else {
            // Create new session
            sessionId = `session-${Date.now()}`;
            session = sessionManager.createSession(userId, sessionId, {
              userAgent: request.headers.get('user-agent') || undefined,
              ip: request.headers.get('x-forwarded-for') || undefined
            });
          }
          
          // Return successful response with session info
          return Response.json({
            success: true,
            userId,
            sessionId: session.sessionId,
            expiresAt: new Date(session.expiresAt).toISOString()
          });
        } catch (error) {
          if (error instanceof ApiError) {
            return Response.json(
              { error: error.message, code: error.code },
              { status: error.status }
            );
          }
          
          return Response.json(
            { error: 'Authentication failed', code: ErrorCode.INTERNAL_ERROR },
            { status: 500 }
          );
        }
      };
      
      // Mock request with valid token
      const headers = new Headers();
      headers.set('authorization', 'Bearer valid-token');
      headers.set('user-agent', 'Integration Test Browser');
      
      const request = new NextRequest('https://example.com/api/session-test', {
        headers
      });
      
      // Call the handler
      const response = await integratedHandler(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        userId: 'test-user',
        sessionId: expect.any(String),
        expiresAt: expect.any(String)
      });
      
      // Verify session was created
      const userSessions = sessionManager.getUserSessions('test-user');
      expect(userSessions).toHaveLength(1);
      
      // Call again with session ID
      headers.set('x-session-id', data.sessionId);
      const request2 = new NextRequest('https://example.com/api/session-test', {
        headers
      });
      
      const response2 = await integratedHandler(request2);
      const data2 = await response2.json();
      
      // Should use same session
      expect(data2.sessionId).toBe(data.sessionId);
      
      // Should still have only one session
      const userSessions2 = sessionManager.getUserSessions('test-user');
      expect(userSessions2).toHaveLength(1);
    });
  });
}); 