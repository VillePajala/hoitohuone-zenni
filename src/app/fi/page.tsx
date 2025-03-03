'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
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

  const featuredServices = [
    {
      title: 'Energiahoito',
      description: 'Tasapainota kehosi energioita ja tue hyvinvointiasi.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: 'Reiki-hoito',
      description: 'Koe perinteisen japanilaisen energiahoidon voima.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const featuredTestimonial = {
    content:
      'Energiahoidot ovat auttaneet minua merkittävästi stressin hallinnassa. Jokaisen käynnin jälkeen olen rentoutuneempi ja energisempi.',
    author: 'Maija M.',
    title: 'Säännöllinen asiakas',
  };

  const featuredFaqs = [
    {
      question: 'Mitä energiahoito on?',
      answer:
        'Energiahoito on hoitomuoto, joka keskittyy kehon energiavirtojen tasapainottamiseen.',
    },
    {
      question: 'Onko hoito turvallista?',
      answer:
        'Kyllä, energiahoidot ovat turvallisia ja hellävaraisia hoitomuotoja.',
    },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center bg-neutral-50">
        <div className="absolute inset-0 overflow-hidden bg-neutral-100 animate-pulse">
          <Image
            src="/images/general/image.png"
            alt="Hoitohuone Zenni healing environment"
            fill
            className="object-cover transition-opacity duration-300 opacity-0 group-loaded:opacity-100"
            priority
            sizes="100vw"
            onLoadingComplete={(image: HTMLImageElement) => {
              image.classList.remove('opacity-0');
              image.classList.add('opacity-100');
              image.parentElement?.classList.remove('animate-pulse');
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/95" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-serif mb-6 fade-in">
            Löydä tasapaino
            <br />
            <span className="text-neutral-600">kehon ja mielen välillä</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-8 fade-in">
            Tervetuloa Hoitohuone Zenniin. Tarjoamme yksilöllisiä energiahoitoja,
            jotka auttavat sinua saavuttamaan kokonaisvaltaisen hyvinvoinnin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in">
            <Link
              href="/fi/palvelut"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              Tutustu palveluihin
            </Link>
            <Link
              href="/fi/ajanvaraus"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Varaa aika
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h2 className="text-3xl font-serif mb-4">Palvelumme</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Tutustu tarjoamiimme hoitopalveluihin. Jokainen hoito räätälöidään
            yksilöllisesti sinun tarpeisiisi.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto fade-in">
          {featuredServices.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
            >
              <div className="text-neutral-600 mb-4">{service.icon}</div>
              <h3 className="text-xl font-serif mb-2">{service.title}</h3>
              <p className="text-neutral-600 mb-4">{service.description}</p>
              <Link
                href="/fi/palvelut"
                className="text-neutral-900 font-medium hover:text-neutral-600 transition-colors"
              >
                Lue lisää →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Booking Section */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center fade-in">
            <h2 className="text-3xl font-serif mb-4">Varaa aikasi helposti</h2>
            <p className="text-neutral-600 mb-8">
              Valitse sinulle sopiva aika ja hoitomuoto. Olemme täällä auttaaksemme
              sinua voimaan paremmin.
            </p>
            <Link
              href="/fi/ajanvaraus"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              Siirry ajanvaraukseen
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center fade-in">
          <h2 className="text-3xl font-serif mb-12">Asiakkaiden kokemuksia</h2>
          <blockquote className="relative">
            <svg
              className="absolute top-0 left-0 transform -translate-x-6 -translate-y-8 h-16 w-16 text-neutral-100"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>
            <p className="relative text-xl text-neutral-600 mb-8">
              {featuredTestimonial.content}
            </p>
            <footer>
              <div className="font-medium">{featuredTestimonial.author}</div>
              <div className="text-neutral-500 text-sm">
                {featuredTestimonial.title}
              </div>
            </footer>
          </blockquote>
          <div className="mt-12">
            <Link
              href="/fi/kokemukset"
              className="text-neutral-900 font-medium hover:text-neutral-600 transition-colors"
            >
              Lue lisää kokemuksia →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif mb-4">Usein kysytyt kysymykset</h2>
              <p className="text-neutral-600">
                Löydä vastaukset yleisimpiin kysymyksiin energiahoidoista.
              </p>
            </div>
            <div className="space-y-6">
              {featuredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200"
                >
                  <h3 className="font-medium mb-2">{faq.question}</h3>
                  <p className="text-neutral-600">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/fi/ukk"
                className="text-neutral-900 font-medium hover:text-neutral-600 transition-colors"
              >
                Katso kaikki UKK →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
