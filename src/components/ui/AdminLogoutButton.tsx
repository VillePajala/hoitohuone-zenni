'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ButtonProps } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function AdminLogoutButton({ className, ...props }: ButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      // Navigate to the logout page with a timestamp to prevent caching
      const timestamp = Date.now();
      window.location.href = `/admin/logout?t=${timestamp}`;
    } catch (error) {
      console.error('Navigation failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Logout"
      {...props}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  );
} 