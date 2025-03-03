'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '../LanguageSwitcher';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname.startsWith('/en') ? 'en' : 'fi';

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navigationLinks = {
    fi: [
      { href: '/fi', label: 'Etusivu' },
      { href: '/fi/palvelut', label: 'Palvelut' },
      { href: '/fi/tietoa', label: 'Tietoa' },
      { href: '/fi/kokemukset', label: 'Kokemukset' },
      { href: '/fi/ukk', label: 'UKK' },
      { href: '/fi/yhteystiedot', label: 'Yhteystiedot' },
      { href: '/fi/ajanvaraus', label: 'Ajanvaraus' },
    ],
    en: [
      { href: '/en', label: 'Home' },
      { href: '/en/services', label: 'Services' },
      { href: '/en/about', label: 'About' },
      { href: '/en/testimonials', label: 'Testimonials' },
      { href: '/en/faq', label: 'FAQ' },
      { href: '/en/contact', label: 'Contact' },
      { href: '/en/booking', label: 'Book Now' },
    ],
  };

  const isActive = (path: string) => pathname === path;
  const links = navigationLinks[locale as keyof typeof navigationLinks];

  return (
    <>
      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Two-Row Layout */}
          <div className="hidden sm:block">
            {/* Top Row - Brand and Language */}
            <div className="h-16 flex items-center justify-between">
              <div className="flex-1" /> {/* Spacer for centering */}
              <Link 
                href={`/${locale}`} 
                className="text-2xl font-serif text-center"
              >
                Hoitohuone Zenni
              </Link>
              <div className="flex-1 flex justify-end">
                <LanguageSwitcher />
              </div>
            </div>
            
            {/* Bottom Row - Navigation */}
            <div className="h-12 flex justify-center items-center space-x-4">
              {links.map((link) => {
                const isBookingLink = link.href.includes('/ajanvaraus') || link.href.includes('/booking');
                
                if (isBookingLink) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium 
                        hover:bg-neutral-800 transition-all duration-200"
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                      ${isActive(link.href)
                        ? 'text-neutral-900 bg-neutral-50'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Single-Row Layout */}
          <div className="sm:hidden flex justify-between h-16 items-center">
            <Link 
              href={`/${locale}`} 
              className="text-xl font-serif"
              onClick={() => setIsMenuOpen(false)}
            >
              Hoitohuone Zenni
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
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

        {/* Mobile menu panel */}
        <div
          className={`absolute top-16 left-0 right-0 bg-white sm:hidden shadow-lg transition-all duration-200 ease-in-out ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <div className="px-4 pt-2 pb-3 space-y-1">
            {links.map((link) => {
              const isBookingLink = link.href.includes('/ajanvaraus') || link.href.includes('/booking');
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-md text-base font-medium transition-colors
                    ${isBookingLink 
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : isActive(link.href)
                        ? 'text-neutral-900 bg-neutral-50'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* Adjust spacer height for two-row desktop layout */}
      <div className="h-16 sm:h-28" />
    </>
  );
};

export default Navigation; 