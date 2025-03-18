'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { ErrorType, logError } from '@/lib/errorHandling';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console or an error reporting service
    logError(error, 'ErrorBoundary');
    console.error(errorInfo);
    
    // Call the optional onError callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Determine error type for better messaging
      let errorType = ErrorType.UNKNOWN;
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      
      if (errorMessage.toLowerCase().includes('network') || 
          errorMessage.toLowerCase().includes('fetch') ||
          errorMessage.toLowerCase().includes('connection')) {
        errorType = ErrorType.NETWORK;
      } else if (errorMessage.toLowerCase().includes('auth') || 
                errorMessage.toLowerCase().includes('login') ||
                errorMessage.toLowerCase().includes('sign in')) {
        errorType = ErrorType.AUTHENTICATION;
      }

      // Default fallback UI
      return (
        <div className="p-4">
          <ErrorDisplay
            type={errorType}
            message={errorMessage}
            onRetry={this.resetError}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap any component with an error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
} 