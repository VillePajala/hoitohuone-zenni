'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Ban, Database, Server, Wifi, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorType } from '@/lib/errorHandling';

interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message: string;
  actionText?: string;
  actionFn?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  type = ErrorType.UNKNOWN,
  title,
  message,
  actionText,
  actionFn,
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  // Map error types to appropriate icons
  const getIcon = () => {
    switch (type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <Ban className="h-8 w-8 text-red-500" />;
      case ErrorType.VALIDATION:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case ErrorType.DATABASE:
        return <Database className="h-8 w-8 text-orange-500" />;
      case ErrorType.NOT_FOUND:
        return <AlertCircle className="h-8 w-8 text-blue-500" />;
      case ErrorType.SERVER:
        return <Server className="h-8 w-8 text-red-500" />;
      case ErrorType.NETWORK:
        return <Wifi className="h-8 w-8 text-orange-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  // Get default title if not provided
  const displayTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Error`;

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex flex-col items-center text-center">
        {getIcon()}
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{displayTitle}</h3>
        <p className="mt-2 text-gray-600">{message}</p>
        
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry} 
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          {actionText && actionFn && (
            <Button 
              onClick={actionFn}
              className="flex items-center gap-2"
            >
              {actionText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized variants for common errors

export function AuthenticationError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      type={ErrorType.AUTHENTICATION}
      title="Authentication Required"
      actionText="Sign In"
      actionFn={() => window.location.href = '/admin/sign-in'}
      onRetry={onRetry}
      {...props}
    />
  );
}

export function NotFoundError({ ...props }: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      type={ErrorType.NOT_FOUND}
      title="Not Found"
      {...props}
    />
  );
}

export function ServerError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      type={ErrorType.SERVER}
      title="Server Error"
      onRetry={onRetry}
      {...props}
    />
  );
}

export function DatabaseError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      type={ErrorType.DATABASE}
      title="Database Error"
      onRetry={onRetry}
      {...props}
    />
  );
}

export function NetworkError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      type={ErrorType.NETWORK}
      title="Network Error"
      onRetry={onRetry}
      {...props}
    />
  );
} 