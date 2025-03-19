# Authentication Migration Guide

This guide provides instructions for migrating from the old authentication system to the new authentication handler system implemented in Phase 2.

## Why Migrate?

The new authentication system offers several benefits:

- **Improved Security**: Enhanced token validation with proper JWK verification
- **Better Role-Based Access Control**: Fine-grained access control with role checking
- **Standardized Error Handling**: Consistent error responses across all API routes
- **Comprehensive Logging**: Better audit trail for authentication events
- **Session Management**: Improved session tracking and management

## Migration Quick Reference

| Old System | New System |
|------------|------------|
| `createGetHandler()` | `createAuthenticatedHandler()` with `allowedMethods: ['GET']` |
| `createPostHandler()` | `createAuthenticatedHandler()` with `allowedMethods: ['POST']` | 
| `createPutHandler()` | `createAuthenticatedHandler()` with `allowedMethods: ['PUT']` |
| `createPatchHandler()` | `createAuthenticatedHandler()` with `allowedMethods: ['PATCH']` |
| `createDeleteHandler()` | `createAuthenticatedHandler()` with `allowedMethods: ['DELETE']` |
| `success(data)` | `Response.json(data)` |
| `badRequest()` | `throw new ApiError(ErrorCode.BAD_REQUEST, message)` |
| `unauthorized()` | `throw new ApiError(ErrorCode.UNAUTHORIZED, message)` |
| `forbidden()` | `throw new ApiError(ErrorCode.FORBIDDEN, message)` |
| `notFound()` | `throw new ApiError(ErrorCode.NOT_FOUND, message)` |

## Migration Examples

### Example 1: GET Handler

#### Before:

```typescript
import { createGetHandler, success, badRequest } from '@/lib/api';

export const GET = createGetHandler(
  async ({ requestId }) => {
    try {
      const items = await fetchItems();
      return success(items, { requestId });
    } catch (error) {
      return badRequest('Failed to fetch items');
    }
  }
);
```

#### After:

```typescript
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling, ApiError, ErrorCode } from '@/lib/api/authHandler';

export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    
    try {
      const items = await fetchItems();
      return Response.json(items);
    } catch (error) {
      throw new ApiError(
        ErrorCode.BAD_REQUEST,
        'Failed to fetch items'
      );
    }
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      allowPublicAccess: true // If public access is allowed
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
);
```

### Example 2: POST Handler with Validation

#### Before:

```typescript
import { createPostHandler, success, validationError } from '@/lib/api';
import { string, createObjectValidator } from '@/lib/api/validation';

const bodyValidator = createObjectValidator({
  name: string().required(),
  email: string().email().required()
});

export const POST = createPostHandler(
  async ({ body, requestId }) => {
    try {
      const user = await createUser(body);
      return success(user, { requestId });
    } catch (error) {
      return validationError('Invalid user data');
    }
  },
  {
    bodyValidator
  }
);
```

#### After:

```typescript
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling, ApiError, ErrorCode } from '@/lib/api/authHandler';
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required")
});

// Validator function using Zod
const validateBody = (data: unknown) => {
  return bodySchema.parse(data);
};

export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { validatedData } = context;
    
    try {
      const user = await createUser(validatedData);
      return Response.json(user);
    } catch (error) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid user data'
      );
    }
  },
  {
    allowedMethods: ['POST'],
    authOptions: {
      requiredRoles: ['admin'], // If admin role is required
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()],
    validator: validateBody
  }
);
```

## Common Authentication Scenarios

### Public Endpoints

For endpoints that don't require authentication:

```typescript
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    // Handler implementation
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      allowPublicAccess: true
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
);
```

### Admin-Only Endpoints

For endpoints that require admin access:

```typescript
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    // Handler implementation
  },
  {
    allowedMethods: ['POST'],
    authOptions: {
      requiredRoles: ['admin'],
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
);
```

### User-Specific Endpoints

For endpoints that require authentication but no specific role:

```typescript
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { userId } = context.auth;
    // Get user-specific data using userId
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      requiredRoles: ['user'],
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
);
```

## Accessing Context Data

The context object in the new system provides several useful properties:

- `requestId`: Unique ID for the current request
- `auth`: Authentication information including `userId` and `sessionId`
- `validatedData`: Validated request body (when using a validator)

## Error Handling

In the new system, errors are thrown rather than returned:

```typescript
// Old way
return badRequest('Invalid data');

// New way
throw new ApiError(ErrorCode.BAD_REQUEST, 'Invalid data');
```

The middleware will automatically catch these errors and format appropriate responses.

## Need Help?

If you encounter issues during migration, refer to:

1. The auth handler implementation in `src/lib/api/authHandler.ts`
2. Example implementations in the project, such as `src/app/api/admin/protected-resource/route.ts`
3. The Authentication Phase 2 Implementation Plan in `.documentation/auth-phase-2-implementation-plan.md` 