'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthStatusProps {
  showButtons?: boolean;
  compact?: boolean;
}

export default function AuthStatus({ showButtons = true, compact = false }: AuthStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, hasTokenExpired, refreshAuth, isLoading, error } = useAuthContext();
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAuth();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        <div className="animate-spin">
          <RefreshCcw size={compact ? 14 : 16} className="text-gray-500" />
        </div>
        <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          Checking authentication...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        <AlertTriangle size={compact ? 14 : 16} className="text-amber-500" />
        <span className={`text-amber-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          {compact ? 'Auth error' : error.message}
        </span>
        {showButtons && (
          <Button
            size="sm"
            variant="outline"
            className={`ml-2 ${compact ? 'h-6 px-2 py-0 text-xs' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!isAuthenticated || hasTokenExpired) {
    return (
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        <ShieldX size={compact ? 14 : 16} className="text-red-500" />
        <span className={`text-red-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          {compact ? 'Not authenticated' : 'You are not authenticated'}
        </span>
        {showButtons && (
          <>
            <Button
              size="sm"
              variant="outline"
              className={`ml-2 ${compact ? 'h-6 px-2 py-0 text-xs' : ''}`}
              onClick={() => router.push('/admin/sign-in')}
            >
              <Shield className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
              Sign In
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`ml-1 ${compact ? 'h-6 px-2 py-0 text-xs' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <ShieldCheck size={compact ? 14 : 16} className="text-green-500" />
      <span className={`text-green-500 ${compact ? 'text-xs' : 'text-sm'}`}>
        {compact ? 'Authenticated' : 'You are authenticated'}
      </span>
      {showButtons && (
        <Button
          size="sm"
          variant="outline"
          className={`ml-2 ${compact ? 'h-6 px-2 py-0 text-xs' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
    </div>
  );
} 