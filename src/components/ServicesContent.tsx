'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type Service = {
  title: string;
  description: string;
  duration: string;
  price: string;
  benefits: string[];
};

type ServicesContentProps = {
  services: Service[];
  translations: {
    title: string;
    subtitle: string;
    bookNow: string;
    contact: string;
    bookService: string;
    experienceService: string;
    faqTitle: string;
    faqDescription: string;
    viewFaq: string;
    benefits: string;
  };
  locale: string;
};

export default function ServicesContent({
  services,
  translations,
  locale,
}: ServicesContentProps) {
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

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">{translations.title}</h1>
          <p className="text-xl text-neutral-600">{translations.subtitle}</p>
        </div>
      </section>

      {/* Services List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden fade-in"
            >
              <div className="grid md:grid-cols-2 gap-8 p-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-serif">{service.title}</h2>
                  <p className="text-neutral-600">{service.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="bg-neutral-100 px-3 py-1 rounded-full">
                      {service.duration}
                    </span>
                    <span className="bg-neutral-100 px-3 py-1 rounded-full">
                      {service.price}
                    </span>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">{translations.benefits}:</h3>
                    <ul className="list-disc list-inside text-neutral-600 space-y-1">
                      {service.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-8">
                  <div className="space-y-4">
                    <h3 className="font-medium">{translations.bookService}</h3>
                    <p className="text-neutral-600">
                      {translations.experienceService.replace(
                        '{service}',
                        service.title.toLowerCase()
                      )}
                    </p>
                    <div className="flex flex-col gap-3">
                      <Link
                        href={`/${locale}/ajanvaraus`}
                        className="inline-block bg-neutral-900 text-white text-center px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
                      >
                        {translations.bookNow}
                      </Link>
                      <Link
                        href={`/${locale}/yhteystiedot`}
                        className="inline-block bg-white text-neutral-900 text-center px-6 py-3 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
                      >
                        {translations.contact}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-50 rounded-lg p-8 fade-in">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-serif mb-4">{translations.faqTitle}</h2>
            <p className="text-neutral-600 mb-8">{translations.faqDescription}</p>
            <Link
              href={`/${locale}/ukk`}
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              {translations.viewFaq}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 