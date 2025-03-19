# Cookie Handling in App Router API Routes

## Issue Encountered

During the migration of the `/api/bookings` endpoint, we encountered an issue with cookie handling in Next.js App Router. The TypeScript linter showed the following errors:

```
Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'.
```

This indicates that the `cookies()` function from Next.js is returning a Promise in some contexts, rather than the expected synchronous `ReadonlyRequestCookies` object.

## Root Cause

In Next.js App Router, certain server-side APIs behave differently depending on the context in which they're called:

1. When called directly within a Server Component or Route Handler, the `cookies()` function returns a synchronous `ReadonlyRequestCookies` object.
2. When called within a middleware, or in certain other contexts, it may return a Promise that resolves to `ReadonlyRequestCookies`.

Our API utility structure wrapped the route handler in middleware, which might have changed the execution context, causing the `cookies()` function to return a Promise.

## Workaround Options

### Option 1: Use a Middleware to Extract Cookies

Create a middleware that extracts cookies from the request headers and passes them to the route handler as part of the request context.

### Option 2: Use Headers API Instead

Use the raw request headers to extract cookies manually:

```typescript
const cookieHeader = request.headers.get('cookie') || '';
const cookiePairs = cookieHeader.split(';').map(pair => pair.trim());
      
for (const pair of cookiePairs) {
  const [name, value] = pair.split('=');
  if (name === 'cookie_name') {
    const cookieValue = decodeURIComponent(value);
    // Use cookieValue
  }
}
```

### Option 3: Create a Cookie Service

Create a cookie utility that handles both synchronous and asynchronous cookie access:

```typescript
export const CookieService = {
  get: async (name: string) => {
    try {
      const cookieStore = cookies();
      if (cookieStore instanceof Promise) {
        const resolvedStore = await cookieStore;
        return resolvedStore.get(name)?.value;
      }
      return cookieStore.get(name)?.value;
    } catch (error) {
      console.error('Error accessing cookies', error);
      return undefined;
    }
  }
};
```

## Decision

For the current migration, we'll treat the `/api/bookings` endpoint as "In Progress" and continue with migrating other endpoints. We'll create a separate task to investigate and implement a comprehensive solution for cookie handling across all API routes.

This approach allows us to make progress on the API standardization while acknowledging that the cookie issue requires a more thorough solution.

## Next Steps

1. Complete the migration of the remainder of the high-priority public endpoints
2. Research and implement a robust cookie handling solution
3. Once the cookie solution is in place, update the `/api/bookings` endpoint 