/**
 * Authentication Types
 * Shared types for authentication system
 */

// User details
export interface UserDetails {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Session information
export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: number;
}

// Error structure
export interface AuthError {
  message: string;
  code?: string;
  type?: string;
}

// Shared auth state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasTokenExpired: boolean;
  user: UserDetails | null;
  error: AuthError | null;
}

// Context type for auth provider
export interface AuthContextType extends AuthState {
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
}

// Result of auth verification
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  reason?: string;
}

// Auth service interface
export interface AuthService {
  isSignedIn: boolean;
  isLoading: boolean;
  isAuthError: boolean;
  isRedirecting?: boolean;
  refreshToken: () => Promise<boolean>;
  authFetch?: (url: string, options?: RequestInit & { __retried?: boolean }) => Promise<Response>;
  authGet?: (url: string) => Promise<any>;
  authPost?: (url: string, data: any) => Promise<any>;
  authPatch?: (url: string, data: any) => Promise<any>;
  authDelete?: (url: string) => Promise<any>;
  redirectToLoginPage?: () => void;
}

// Configuration for auth refresh
export interface RefreshConfig {
  silent?: boolean;
  force?: boolean;
} 