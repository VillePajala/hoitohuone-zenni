'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, LogOut } from 'lucide-react';

export default function AdminBar() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-white h-10 px-4 fixed top-0 left-0 right-0 z-40 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Admin Mode</span>
        <Link 
          href="/admin/dashboard" 
          className="inline-flex items-center text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
      </div>
      <Link 
        href="/admin/logout" 
        className="inline-flex items-center text-sm hover:text-slate-300 transition-colors"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Link>
    </div>
  );
} 