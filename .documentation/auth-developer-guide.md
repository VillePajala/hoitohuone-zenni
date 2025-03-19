# Authentication System Developer Guide

This guide explains how to use the new authentication system for securing API routes and implementing role-based access control.

## Overview

The new authentication system includes:

1. **Enhanced Token Validation** - Secure Clerk JWT token validation with caching
2. **Session Management** - Track and manage user sessions with metadata
3. **Standardized API Authentication** - Consistent authentication pattern for all API routes
4. **Role-Based Access Control** - Control access based on user roles

## How to Secure an API Route

### Basic Usage

To secure an API route, use the `createAuthenticatedHandler` function:

```typescript
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler } from '@/lib/api/authHandler';

export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context: any) => {
    // Your handler code here
    const { auth } = context; // Access auth information
    
    return Response.json({
      success: true,
      message: "This route is protected"
    });
  },
  {
    allowedMethods: ['GET'], // Specify allowed HTTP methods
    authOptions: {
      // Authentication options (optional)
    }
  }
);
```

### With Role-Based Access Control

To restrict access based on user roles:

```typescript
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context: any) => {
    // Only users with 'admin' role can access this
    return Response.json({
      success: true,
      message: "Admin-only resource"
    });
  },
  {
    allowedMethods: ['POST'],
    authOptions: {
      requiredRoles: ['admin'], // User must have this role
      unauthorizedMessage: 'Admin access required'
    }
  }
);
```

### Multiple HTTP Methods

To handle multiple HTTP methods in one file:

```typescript
import { createAuthenticatedHandler } from '@/lib/api/authHandler';

// GET handler
export const GET = createAuthenticatedHandler(
  async (request, context) => {
    return Response.json({ message: "GET response" });
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      requiredRoles: ['user']
    }
  }
);

// POST handler
export const POST = createAuthenticatedHandler(
  async (request, context) => {
    return Response.json({ message: "POST response" });
  },
  {
    allowedMethods: ['POST'],
    authOptions: {
      requiredRoles: ['admin'] // More restrictive for POST
    }
  }
);
```

## Authentication Options

The `authOptions` object supports the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requiredRoles` | `string[]` | `[]` | Roles required to access the resource |
| `allowApiKey` | `boolean` | `true` | Whether to allow API key authentication |
| `unauthorizedMessage` | `string` | `'Authentication required'` | Custom message for unauthorized access |

## Error Handling

The system uses standardized error responses:

```typescript
// Example error response
{
  "error": "Insufficient permissions to access this resource",
  "code": "FORBIDDEN"
}
```

Error codes include:
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `INTERNAL_ERROR` (500)

## Validation Middleware

You can add request validation:

```typescript
// Define a validator function
function validateBookingData(data: any) {
  if (!data.date) throw new Error('Date is required');
  if (!data.serviceId) throw new Error('Service ID is required');
  
  return {
    date: new Date(data.date),
    serviceId: data.serviceId,
    notes: data.notes || ''
  };
}

// Use the validator in your handler
export const POST = createAuthenticatedHandler(
  async (request, context) => {
    // Validated data is available in context
    const bookingData = context.validatedData;
    
    // Use the validated data
    const result = await createBooking(bookingData);
    
    return Response.json({ success: true, data: result });
  },
  {
    allowedMethods: ['POST'],
    validator: validateBookingData, // Add validation
    authOptions: {
      requiredRoles: ['user']
    }
  }
);
```

## Additional Middleware

The system supports adding custom middleware:

```typescript
import { 
  createAuthenticatedHandler, 
  withRequestLogging, 
  withErrorHandling 
} from '@/lib/api/authHandler';

export const GET = createAuthenticatedHandler(
  async (request, context) => {
    // Handler logic
  },
  {
    allowedMethods: ['GET'],
    // Add additional middleware
    middleware: [
      withRequestLogging(), 
      withErrorHandling()
    ],
    authOptions: {
      requiredRoles: ['user']
    }
  }
);
```

## Accessing Authentication Data

Authentication data is available in the `context` parameter:

```typescript
async (request, context) => {
  const { auth } = context;
  
  // Auth object contains:
  // - userId: The authenticated user's ID
  // - type: Authentication type ('user', 'apiKey', or 'token')
  // - sessionId: Session ID (only for 'user' type)
  
  return Response.json({
    message: `Hello, ${auth.userId}!`,
    authType: auth.type
  });
}
```

## API Key Authentication

To authenticate with an API key:

1. Set the `ADMIN_API_SECRET` environment variable
2. Include the API key in the `x-api-key` header:

```
x-api-key: your-api-key-here
```

## Token Authentication

To authenticate with a token:

1. Include the token in the `Authorization` header:

```
Authorization: Bearer your-jwt-token
```

## Session Management

To manage user sessions, use the session manager:

```typescript
import { sessionManager } from '@/lib/auth/sessionManager';

// Create a session
const session = sessionManager.createSession(userId, sessionId, {
  userAgent: request.headers.get('user-agent') || undefined,
  ip: request.headers.get('x-forwarded-for') || undefined,
  duration: 3600 // 1 hour in seconds
});

// Get a session
const session = sessionManager.getSession(sessionId);

// Update activity
sessionManager.updateActivity(sessionId);

// Extend session
sessionManager.extendSession(sessionId, 3600); // Extend by 1 hour

// Terminate session
sessionManager.terminateSession(sessionId);

// Get user sessions
const userSessions = sessionManager.getUserSessions(userId);
```

## Migration Guide

When migrating existing API routes:

1. **Keep both implementations** - Start by implementing the new auth pattern alongside the existing one
2. **Test thoroughly** - Ensure the new auth works correctly with your existing endpoint
3. **Switch gradually** - Migrate routes one category at a time (e.g., all booking routes)
4. **Remove deprecated code** - Once all routes are migrated, remove the old auth code

## Best Practices

1. **Always specify allowed methods** - Use the `allowedMethods` option to restrict HTTP methods
2. **Use role-based access** - Implement the principle of least privilege
3. **Add request validation** - Validate input data before processing
4. **Handle errors properly** - Let the auth system handle auth errors
5. **Log important events** - Use the `authLogger` for security-related events

## Example: Full API Route

```typescript
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler } from '@/lib/api/authHandler';
import { withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';
import { authLogger } from '@/lib/authLogger';

// Validator function
function validateUserData(body: any) {
  if (!body.name) throw new Error('Name is required');
  if (!body.email) throw new Error('Email is required');
  
  return {
    name: body.name,
    email: body.email,
    preferences: body.preferences || {}
  };
}

/**
 * Protected API route for user profile management
 */
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context: any) => {
    const { auth } = context;
    
    // Log the access
    authLogger.info('User profile accessed', {
      context: 'user-profile',
      data: { userId: auth.userId }
    });
    
    // Fetch user data
    const userData = await getUserData(auth.userId);
    
    return Response.json({ 
      success: true, 
      data: userData 
    });
  },
  {
    allowedMethods: ['GET'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['user']
    }
  }
);

export const PUT = createAuthenticatedHandler(
  async (request: NextRequest, context: any) => {
    const { auth, validatedData } = context;
    
    // Update user data
    const result = await updateUserData(auth.userId, validatedData);
    
    // Log the update
    authLogger.info('User profile updated', {
      context: 'user-profile',
      data: { userId: auth.userId }
    });
    
    return Response.json({ 
      success: true, 
      data: result 
    });
  },
  {
    allowedMethods: ['PUT'],
    validator: validateUserData,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['user']
    }
  }
);

// Helper function
async function getUserData(userId: string) {
  // Implementation would fetch user data from database
  return { id: userId, name: 'Example User', email: 'user@example.com' };
}

// Helper function
async function updateUserData(userId: string, data: any) {
  // Implementation would update user data in database
  return { id: userId, ...data, updated: new Date().toISOString() };
}
``` 