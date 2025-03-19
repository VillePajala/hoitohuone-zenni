'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLogoutButton from '@/components/ui/AdminLogoutButton';

export default function AdminBar() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // Don't render if not authenticated
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const goToDashboard = () => {
    // Use window.location for a complete page refresh
    window.location.href = '/admin/dashboard';
  };

  return (
    <div className="bg-slate-900 text-white h-10 px-4 fixed top-0 left-0 right-0 z-40 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Admin Mode</span>
        <Button
          variant="ghost"
          size="sm" 
          onClick={goToDashboard}
          className="inline-flex items-center text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors h-7"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>
      <AdminLogoutButton 
        variant="ghost"
        size="sm"
        className="inline-flex items-center text-sm hover:text-slate-300 transition-colors h-7"
      />
    </div>
  );
} 