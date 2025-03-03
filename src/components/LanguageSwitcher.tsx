'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = useCallback((locale: string) => {
    // Get the current route without the locale prefix
    const currentRoute = pathname.replace(/^\/[a-z]{2}/, '');
    router.push(`/${locale}${currentRoute}`);
  }, [pathname, router]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLanguage('fi')}
        className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${
          pathname.startsWith('/fi')
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        FI
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${
          pathname.startsWith('/en')
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        EN
      </button>
    </div>
  );
} 