'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Section from './layout/Section';
import { PageTitle, Text, SectionTitle, ContentWrapper } from './typography';

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
    <div>
      {/* Hero Section */}
      <Section background="white">
        <ContentWrapper centered className="fade-in">
          <PageTitle centered>{translations.title}</PageTitle>
          <Text centered large>{translations.subtitle}</Text>
        </ContentWrapper>
      </Section>

      {/* Services List */}
      <Section background="light">
        <div className="grid gap-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden fade-in"
            >
              <div className="grid md:grid-cols-2 gap-8 p-8">
                <div className="space-y-4">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden mb-6 bg-neutral-100 animate-pulse">
                    <Image
                      src="/images/general/image.png"
                      alt={service.title}
                      fill
                      className="object-cover transition-opacity duration-300 opacity-0 group-loaded:opacity-100"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      loading="lazy"
                      onLoad={(event) => {
                        const image = event.currentTarget as HTMLImageElement;
                        image.classList.remove('opacity-0');
                        image.classList.add('opacity-100');
                        image.parentElement?.classList.remove('animate-pulse');
                      }}
                    />
                  </div>
                  <SectionTitle>{service.title}</SectionTitle>
                  <Text>{service.description}</Text>
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
                    <Text>{translations.experienceService.replace(
                      '{service}',
                      service.title.toLowerCase()
                    )}</Text>
                    <div className="flex flex-col gap-3">
                      <Link
                        href={locale === 'fi' ? `/fi/ajanvaraus` : `/en/booking`}
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
      </Section>

      {/* FAQ Preview */}
      <Section background="white">
        <ContentWrapper centered className="fade-in">
          <SectionTitle centered>{translations.faqTitle}</SectionTitle>
          <Text centered>{translations.faqDescription}</Text>
          <div className="mt-8">
            <Link
              href={`/${locale}/ukk`}
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              {translations.viewFaq}
            </Link>
          </div>
        </ContentWrapper>
      </Section>
    </div>
  );
} 