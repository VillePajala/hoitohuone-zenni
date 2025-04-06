'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

// Path translations between languages
const pathTranslations = {
  fi: {
    '': '',
    '/palvelut': '/services',
    '/tietoa': '/about',
    '/kokemukset': '/testimonials',
    '/ukk': '/faq',
    '/yhteystiedot': '/contact',
    '/ajanvaraus': '/booking'
  },
  en: {
    '': '',
    '/services': '/palvelut',
    '/about': '/tietoa',
    '/testimonials': '/kokemukset',
    '/faq': '/ukk',
    '/contact': '/yhteystiedot',
    '/booking': '/ajanvaraus'
  }
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = useCallback((newLocale: 'fi' | 'en') => {
    // Get current locale and path
    const currentLocale = pathname.startsWith('/en') ? 'en' : 'fi';
    const currentPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';

    // Get the translated path
    const translations = pathTranslations[currentLocale];
    const translatedPath = Object.entries(translations).find(
      ([key]) => currentPath === key
    );

    // If translation exists, use it; otherwise, try to keep the same path
    const newPath = translatedPath 
      ? `/${newLocale}${translatedPath[1]}`
      : `/${newLocale}${currentPath}`;

    router.push(newPath);
  }, [pathname, router]);

  const currentLocale = pathname.startsWith('/en') ? 'en' : 'fi';

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLanguage('fi')}
        className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${
          currentLocale === 'fi'
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-label="Vaihda kieli suomeksi"
      >
        FI
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${
          currentLocale === 'en'
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-label="Switch language to English"
      >
        EN
      </button>
    </div>
  );
} 