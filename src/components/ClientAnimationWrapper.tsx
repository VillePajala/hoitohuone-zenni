'use client';

import { useEffect } from 'react';
import { type ReactNode } from 'react';

interface ClientAnimationWrapperProps {
  children: ReactNode;
}

export default function ClientAnimationWrapper({ children }: ClientAnimationWrapperProps) {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
} 