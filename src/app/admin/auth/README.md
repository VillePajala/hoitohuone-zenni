# Authentication Tools

This directory contains tools for managing, debugging, and documenting the Hoitohuone Zenni authentication system.

## Available Tools

### Auth Dashboard

**URL:** `/admin/auth-dashboard`

The authentication dashboard provides real-time monitoring and debugging of the authentication system:

- Authentication state monitoring
- Token inspection and validation
- User information display
- Log level management
- Interactive debugging tools
- Token refresh testing

Use this dashboard when troubleshooting authentication issues or when you need to understand the current state of a user's authentication.

### Auth Test Page

**URL:** `/admin/auth-test`

A simplified testing page for authentication functionality:

- Authentication state display
- Token refresh testing
- Auth debug endpoint testing
- Error visualization

This page is useful for quick testing of authentication functionality without the full dashboard.

### Auth Documentation

**URL:** `/admin/auth-docs`

Comprehensive in-app documentation covering:

- Authentication system overview
- Component details and usage examples
- Authentication flows and processes
- Error handling strategies
- Debugging techniques

This documentation helps developers understand how to work with the authentication system.

## API Endpoints

### Auth Debug API

**URL:** `/api/admin/auth-debug`

Returns detailed information about the current authentication state:

- Authentication status from Clerk
- Session details
- Token validation and claims
- Cookie inspection
- Request details

This endpoint can be called programmatically to check authentication state.

## Recommended Development Tools

For authentication development and debugging, we recommend:

1. **Browser Dev Tools**: Inspect network requests, cookies, and JWT tokens
2. **Auth Dashboard**: For visualization of the auth state
3. **Auth Logger**: For detailed logging of auth events (use `authLogger` from `@/lib/authLogger`)
4. **Clerk Dashboard**: For user and session management

## Related Documentation

For more information, see:

- [Authentication System Improvements](/.documentation/auth-system-improvements.md)
- [Authentication Architecture](/.documentation/authentication-architecture.md)
- [Authentication Fix Plan](/.documentation/authentication-fix-plan.md) 