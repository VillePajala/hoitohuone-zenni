# Authentication System Restructuring Plan

This document outlines a comprehensive plan for restructuring the authentication system in the Hoitohuone Zenni booking application. The goal is to eliminate circular dependencies, remove duplicate functionality, and create a more maintainable authentication architecture.

## Current Architecture Analysis

### Components and Their Responsibilities

1. **Clerk (External Provider)**
   - Handles user authentication and session management
   - Provides tokens and user information
   - Offers built-in hooks: `useAuth()`, `useUser()`, etc.

2. **Middleware (`middleware.ts`)**
   - Protects admin routes via Clerk middleware
   - Handles redirects for unauthenticated users
   - Manages routing for public vs. protected routes

3. **AuthContext (`contexts/AuthContext.tsx`)**
   - Provides global authentication state via React Context
   - Manages token auto-refresh through timer system
   - Tracks token expiration and authentication errors
   - **Depends on useAdminAuth** for core functionality

4. **useAdminAuth (`hooks/useAdminAuth.tsx`)**
   - Manages token caching and refresh logic
   - Provides authenticated fetch utilities
   - Handles HTTP 401 errors with automatic refresh
   - Depends on Clerk's `useAuth()` hook

### Key Issues Identified

1. **Circular Dependency**
   - AuthContext depends on useAdminAuth
   - Many components rely on AuthContext
   - Creates a fragile dependency chain

2. **Duplicate Functionality**
   - Token caching in both useAdminAuth and AuthContext
   - Redundant refresh logic and timers
   - Parallel error tracking systems

3. **Complex Token Management**
   - Manual tracking of token expiration
   - Multiple refresh mechanisms
   - Rate limiting in multiple places
   - Overlapping timer systems

4. **Inconsistent Authentication State**
   - Different representations of the same state
   - Potential for state inconsistency across systems

5. **Scattered Error Handling**
   - Different approaches to handling auth errors
   - Manual redirection logic in multiple places
   - No centralized error policy

## Proposed Architecture

### 1. Core Authentication Service

Create a single, centralized authentication service with a clear separation of concerns:

```
src/
  lib/
    auth/
      authService.ts        # Core authentication functionality
      authTypes.ts          # TypeScript interfaces
      authContext.tsx       # React Context provider
      useAuth.tsx           # Main authentication hook
      apiClient.ts          # Authenticated API client
      authMiddleware.ts     # Client-side auth middleware
```

### 2. Separation of Concerns

Each module will have a specific responsibility:

**authService.ts**
- Token acquisition and management
- Refresh logic and caching
- Authentication state management

**authContext.tsx**
- Provides auth state to component tree
- Minimal logic, mostly delegates to authService

**useAuth.tsx**
- React hook for components to access auth functionality
- Integrates authService with React's lifecycle

**apiClient.ts**
- Authenticated API methods (get, post, etc.)
- Token injection and error handling
- Automatic retries on 401 errors

### 3. New Authentication Flow

```
Component
    ↓ calls
useAuth hook
    ↓ uses
AuthContext
    ↓ consumes
AuthService ← → Clerk SDK
    ↓ powers
API Client
    ↓ makes
HTTP Requests
```

## Implementation Strategy

To avoid breaking the application during migration, we'll follow a gradual approach:

### Phase 1: Create Core Infrastructure (No Impact)

1. Create basic architecture without changing existing code:
   - Implement authService.ts
   - Create new authContext.tsx (with different name)
   - Develop useAuth.tsx hook
   - Build apiClient.ts

2. Add comprehensive unit tests for new components

### Phase 2: Side-by-Side Implementation

1. Implement the new system alongside the existing one
2. Integrate Clerk functionality with the new authService
3. Configure session management and token refresh
4. Set up proper error handling and logging

### Phase 3: Component Migration

1. Identify small, isolated components to migrate first
2. Create a migration checklist for each component
3. Update components one by one to use the new system
4. Test thoroughly after each component migration

### Phase 4: Core Component Migration

1. Update main layout and admin components
2. Migrate critical authentication-dependent features
3. Remove old implementation components
4. Perform comprehensive testing

### Phase 5: Cleanup and Optimization

1. Remove any remaining legacy code
2. Enhance error handling and feedback
3. Add performance optimizations
4. Update documentation

## Technical Specifications

### 1. AuthService Interface

```typescript
interface AuthService {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // User info
  getUserInfo(): UserInfo | null;
  
  // Authentication actions
  signIn(): Promise<boolean>;
  signOut(): Promise<void>;
  
  // Token management
  getToken(): Promise<string | null>;
  refreshToken(): Promise<boolean>;
  
  // State management
  clearError(): void;
}
```

### 2. API Client Interface

```typescript
interface ApiClient {
  get<T = any>(url: string): Promise<T>;
  post<T = any>(url: string, data: any): Promise<T>;
  put<T = any>(url: string, data: any): Promise<T>;
  patch<T = any>(url: string, data: any): Promise<T>;
  delete<T = any>(url: string): Promise<T>;
}
```

### 3. UseAuth Hook Interface

```typescript
interface UseAuthResult {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // User information
  user: UserInfo | null;
  
  // Authentication actions
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  
  // API client
  api: ApiClient;
  
  // Error management
  clearError: () => void;
}
```

## Detailed Implementation Plan

### Step 1: Create `authTypes.ts`

Define interfaces and types for the authentication system:

```typescript
// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  user: UserInfo | null;
}

// User information
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

// API response error
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
```

### Step 2: Implement `authService.ts`

Create the core authentication service:

```typescript
import { getAuth } from '@clerk/nextjs/client';
import { AuthState, UserInfo } from './authTypes';

class AuthServiceImpl {
  private tokenCache: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private lastRefreshTime: number = 0;
  
  // Core functionality
  // ...
}

// Export a singleton instance
export const authService = new AuthServiceImpl();
```

### Step 3: Create `authContext.tsx`

Implement the React context provider:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './authService';
import { AuthState } from './authTypes';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Implement provider logic
  // ...
  
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
```

### Step 4: Build `useAuth.tsx` Hook

Create the main hook for components:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from './authContext';
import { createApiClient } from './apiClient';

export function useAuth(options = { redirectOnUnauthenticated: false }) {
  const authState = useAuthContext();
  const router = useRouter();
  const apiClient = createApiClient(getToken);
  
  // Implement hook logic
  // ...
  
  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    user: authState.user,
    
    // Actions
    signIn,
    signOut,
    refreshAuth,
    
    // API
    api: apiClient,
    
    // Utilities
    clearError,
  };
}
```

### Step 5: Implement `apiClient.ts`

Build the authenticated API client:

```typescript
export function createApiClient(getToken: () => Promise<string | null>) {
  // Implement API client functions with auth header injection
  const get = async <T>(url: string): Promise<T> => {
    // Implementation with auth headers
  };
  
  const post = async <T>(url: string, data: any): Promise<T> => {
    // Implementation with auth headers
  };
  
  // Additional methods...
  
  return {
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
  };
}
```

## Migration Checklist

For each component that uses the old authentication system:

1. Import the new useAuth hook instead of useAuthContext and useAdminAuth
2. Replace authentication state checks:
   - Old: `isSignedIn`, `isAuthenticated`
   - New: `isAuthenticated`
3. Replace API calls:
   - Old: `authGet`, `authPost`, etc.
   - New: `api.get`, `api.post`, etc.
4. Update error handling to use the new system
5. Remove any manual token refresh logic

## Testing Strategy

1. **Unit Tests**:
   - Test authService.ts in isolation
   - Mock Clerk dependencies
   - Verify token management logic

2. **Integration Tests**:
   - Test useAuth hook with React Testing Library
   - Verify context provider behavior
   - Test API client with mock fetch

3. **Component Tests**:
   - Test each migrated component
   - Verify authentication state handling
   - Test error scenarios

4. **End-to-End Tests**:
   - Test complete authentication flow
   - Verify redirects and protected routes
   - Test token refresh scenarios

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking functionality during migration | Incremental approach with thorough testing after each step |
| Clerk API changes | Abstract Clerk-specific code in authService.ts |
| Timing issues with auth state | Implement proper loading states and error handling |
| Missing edge cases | Comprehensive test suite with error scenarios |
| Performance impact | Monitor token refresh frequency and optimize as needed |

## Timeline Estimate

- Phase 1 (Core Infrastructure): 2-3 days
- Phase 2 (Side-by-Side Implementation): 2-3 days
- Phase 3 (Component Migration): 3-5 days
- Phase 4 (Core Component Migration): 2-3 days
- Phase 5 (Cleanup and Optimization): 1-2 days

Total estimated time: 10-16 days, depending on complexity and testing requirements

## Conclusion

This restructuring will create a more maintainable authentication system by:

1. Eliminating circular dependencies
2. Centralizing token management
3. Providing a consistent API for components
4. Simplifying error handling
5. Making testing easier

The phased approach ensures minimal disruption while achieving a cleaner architecture.

---

This plan provides a roadmap for safely restructuring the authentication system. Each step should be implemented carefully with thorough testing to ensure the application remains functional throughout the migration process.
