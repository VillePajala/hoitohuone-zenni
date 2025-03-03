'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '../LanguageSwitcher';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname.startsWith('/en') ? 'en' : 'fi';

  const navigationLinks = {
    fi: [
      { href: '/fi', label: 'Etusivu' },
      { href: '/fi/palvelut', label: 'Palvelut' },
      { href: '/fi/tietoa', label: 'Tietoa' },
      { href: '/fi/kokemukset', label: 'Kokemukset' },
      { href: '/fi/ukk', label: 'UKK' },
      { href: '/fi/yhteystiedot', label: 'Yhteystiedot' },
    ],
    en: [
      { href: '/en', label: 'Home' },
      { href: '/en/services', label: 'Services' },
      { href: '/en/about', label: 'About' },
      { href: '/en/testimonials', label: 'Testimonials' },
      { href: '/en/faq', label: 'FAQ' },
      { href: '/en/contact', label: 'Contact' },
    ],
  };

  const isActive = (path: string) => pathname === path;
  const links = navigationLinks[locale as keyof typeof navigationLinks];

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href={`/${locale}`} className="text-xl font-serif">
              Hoitohuone Zenni
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive(link.href)
                    ? 'text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center space-x-4">
            <LanguageSwitcher />
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">
                {locale === 'fi' ? 'Avaa päävalikko' : 'Open main menu'}
              </span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium
                ${isActive(link.href)
                  ? 'text-neutral-900 bg-neutral-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 