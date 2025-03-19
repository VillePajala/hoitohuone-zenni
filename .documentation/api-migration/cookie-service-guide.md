# Cookie Service Usage Guide

The Cookie Service utility provides a robust way to handle cookies in Next.js App Router API routes, addressing the known issues with the built-in `cookies()` function when used within middleware-wrapped handlers.

## Features

- Works in both synchronous and asynchronous contexts
- Handles both reading and writing cookies
- Provides fallback mechanisms for different Next.js contexts
- Includes helper methods for common cookie operations

## Installation

The Cookie Service is automatically available as part of the API utilities:

```typescript
import { CookieService } from '@/lib/api';
```

## Basic Usage

### Reading Cookies

To read cookies, use the `get` method which takes the request object, cookie name, and optionally a request ID for logging:

```typescript
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    // Read a single cookie
    const customerEmail = CookieService.get(request, 'customer_email', requestId);
    
    // Or read multiple cookies at once
    const { username, theme } = CookieService.getMultiple(
      request, 
      ['username', 'theme'], 
      requestId
    );
    
    // Use the values in your handler
    return success({ 
      customerEmail,
      username,
      theme
    }, { requestId });
  }
);
```

### Writing Cookies

For setting cookies, there are two approaches:

#### 1. Using an existing response

```typescript
export const POST = createPostHandler(
  async ({ body, requestId, request }) => {
    // Create a normal success response
    const response = success({ message: 'Operation completed' }, { requestId });
    
    // Add a cookie to the response
    CookieService.set(response, 'username', body.username, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    return response;
  }
);
```

#### 2. Creating a response with cookies in one step

```typescript
export const POST = createPostHandler(
  async ({ body, requestId, request }) => {
    // Create a response with cookies in one step
    return CookieService.createResponseWithCookies(
      { message: 'Settings saved' }, // Data
      [
        {
          name: 'theme',
          value: body.theme,
          options: {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/'
          }
        },
        {
          name: 'language',
          value: body.language,
          options: {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/'
          }
        }
      ],
      {
        requestId,
        status: 200
      }
    );
  }
);
```

## API Reference

### `get(request, name, requestId?)`

Gets a cookie value by name.

- **Parameters:**
  - `request`: The NextRequest or Request object from the handler
  - `name`: The name of the cookie to get
  - `requestId` (optional): A request ID for logging purposes
- **Returns:** The cookie value or undefined if not found

### `getMultiple(request, names, requestId?)`

Gets multiple cookie values at once.

- **Parameters:**
  - `request`: The NextRequest or Request object from the handler
  - `names`: An array of cookie names to get
  - `requestId` (optional): A request ID for logging purposes
- **Returns:** An object with cookie names as keys and values (or undefined) as values

### `set(response, name, value, options?)`

Sets a cookie in a response.

- **Parameters:**
  - `response`: The NextResponse object to add the cookie to
  - `name`: The name of the cookie to set
  - `value`: The value of the cookie
  - `options` (optional): Cookie options including:
    - `maxAge`: Maximum age in seconds
    - `path`: Cookie path
    - `domain`: Cookie domain
    - `secure`: Whether the cookie is secure
    - `httpOnly`: Whether the cookie is HTTP only

### `setMultiple(response, cookies)`

Sets multiple cookies at once.

- **Parameters:**
  - `response`: The NextResponse object to add the cookies to
  - `cookies`: An array of cookie objects with `name`, `value`, and optional `options`

### `createResponseWithCookies(data, cookies, options?)`

Creates a success response with cookies in one step.

- **Parameters:**
  - `data`: The response data
  - `cookies`: An array of cookie objects with `name`, `value`, and optional `options`
  - `options` (optional): Response options including:
    - `status`: HTTP status code
    - `headers`: Additional headers
    - `requestId`: Request ID for logging
- **Returns:** A NextResponse object with the data and cookies set

## Best Practices

1. **Always pass the request object** to the cookie service methods to ensure reliable cookie access
2. **Use meaningful cookie names** that reflect the data they store
3. **Set appropriate expiration times** using the `maxAge` option
4. **Include the `path` option** when setting cookies (usually `'/'`)
5. **Consider security implications** and use `secure` and `httpOnly` options for sensitive data
6. **Always include request ID** in your calls for better debugging

## Troubleshooting

If you encounter issues with cookie handling:

1. Check that you're passing the request object correctly
2. Verify that cookie names and values are valid
3. Check browser settings to ensure cookies are enabled
4. Look for log messages from the CookieService in your application logs

The CookieService includes extensive logging to help diagnose issues. 