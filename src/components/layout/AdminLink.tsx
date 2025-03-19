'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminLink() {
  const { isLoaded, isSignedIn } = useAuth();
  const [targetPath, setTargetPath] = useState<string>('/admin/sign-in');
  
  useEffect(() => {
    // Once auth is loaded, determine the target path
    if (isLoaded) {
      setTargetPath(isSignedIn ? '/admin/dashboard' : '/admin/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  return (
    <Link href={targetPath} className="hover:text-neutral-700 transition-colors">
      Admin
    </Link>
  );
} 