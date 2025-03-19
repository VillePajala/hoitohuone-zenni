import { authLogger } from '@/lib/authLogger';

/**
 * Interface for session metadata
 */
export interface SessionMetadata {
  /** User ID associated with this session */
  userId: string;
  /** Unique session identifier */
  sessionId: string;
  /** User agent string (browser/device info) */
  userAgent?: string;
  /** IP address of the client */
  ip?: string;
  /** Timestamp of last activity (milliseconds) */
  lastActive: number;
  /** Timestamp when session expires (milliseconds) */
  expiresAt: number;
}

// In-memory store for simplicity - would be replaced with Redis or similar in production
const sessions = new Map<string, SessionMetadata>();

/**
 * Session Manager
 * 
 * Handles user session tracking, expiration, and management.
 * This implementation uses an in-memory store, but could be extended
 * to use Redis, database, or other persistent storage.
 */
export const sessionManager = {
  /**
   * Create a new session
   */
  createSession(userId: string, sessionId: string, options?: {
    userAgent?: string;
    ip?: string;
    duration?: number; // in seconds
  }): SessionMetadata {
    const duration = options?.duration || 24 * 60 * 60; // 24 hours default
    const now = Date.now();
    
    const metadata: SessionMetadata = {
      userId,
      sessionId,
      userAgent: options?.userAgent,
      ip: options?.ip,
      lastActive: now,
      expiresAt: now + (duration * 1000)
    };
    
    sessions.set(sessionId, metadata);
    
    authLogger.info(`Session created for user ${userId}`, {
      context: 'session-manager',
      data: { sessionId }
    });
    
    return metadata;
  },
  
  /**
   * Get session metadata
   */
  getSession(sessionId: string): SessionMetadata | null {
    const session = sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.terminateSession(sessionId);
      return null;
    }
    
    return session;
  },
  
  /**
   * Update session activity
   */
  updateActivity(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.lastActive = Date.now();
    sessions.set(sessionId, session);
    
    return true;
  },
  
  /**
   * Extend session expiry
   */
  extendSession(sessionId: string, additionalTimeInSeconds: number): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.expiresAt = session.expiresAt + (additionalTimeInSeconds * 1000);
    sessions.set(sessionId, session);
    
    authLogger.debug(`Session extended for user ${session.userId}`, {
      context: 'session-manager',
      data: { 
        sessionId,
        newExpiryTime: new Date(session.expiresAt).toISOString() 
      }
    });
    
    return true;
  },
  
  /**
   * Terminate a session
   */
  terminateSession(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    sessions.delete(sessionId);
    
    authLogger.info(`Session terminated for user ${session.userId}`, {
      context: 'session-manager',
      data: { sessionId }
    });
    
    return true;
  },
  
  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): SessionMetadata[] {
    const userSessions: SessionMetadata[] = [];
    
    for (const session of sessions.values()) {
      if (session.userId === userId) {
        // Filter out expired sessions
        if (Date.now() <= session.expiresAt) {
          userSessions.push(session);
        }
      }
    }
    
    return userSessions;
  },
  
  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [sessionId, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(sessionId);
        count++;
      }
    }
    
    if (count > 0) {
      authLogger.info(`Cleaned up ${count} expired sessions`, {
        context: 'session-manager'
      });
    }
    
    return count;
  },
  
  /**
   * Get total active session count
   */
  getActiveSessionCount(): number {
    this.cleanupExpiredSessions();
    return sessions.size;
  },
  
  /**
   * Reset sessions (for testing purposes only)
   */
  __reset(): void {
    sessions.clear();
    authLogger.warn('All sessions have been reset', {
      context: 'session-manager'
    });
  }
}; 