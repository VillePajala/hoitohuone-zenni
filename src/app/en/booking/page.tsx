'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BookingPage() {
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

  const services = [
    {
      title: 'Energy Healing',
      duration: '60 min',
      price: '75€',
      description:
        'A holistic treatment that helps balance your body\'s energy flows and promotes overall wellbeing.',
    },
    {
      title: 'Reiki Healing',
      duration: '60 min',
      price: '75€',
      description:
        'Traditional Japanese energy healing that promotes relaxation and reduces stress.',
    },
    {
      title: 'Distance Healing',
      duration: '45 min',
      price: '65€',
      description:
        'Experience the benefits of energy healing from the comfort of your own home.',
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Book Your Session</h1>
          <p className="text-xl text-neutral-600">
            Choose your preferred treatment and time. We'll confirm your booking
            within 24 hours.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h2 className="text-3xl font-serif mb-4">Available Services</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Select a service to proceed with booking. All treatments are
            personalized to meet your individual needs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto fade-in">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8"
            >
              <h3 className="text-xl font-medium mb-2">{service.title}</h3>
              <div className="flex gap-4 text-sm mb-4">
                <span className="bg-neutral-100 px-3 py-1 rounded-full">
                  {service.duration}
                </span>
                <span className="bg-neutral-100 px-3 py-1 rounded-full">
                  {service.price}
                </span>
              </div>
              <p className="text-neutral-600 mb-6">{service.description}</p>
              <button
                onClick={() => {
                  // TODO: Implement booking flow
                  alert('Booking system coming soon!');
                }}
                className="w-full bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Information Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-50 rounded-lg p-8 space-y-8 fade-in">
          <div>
            <h2 className="text-3xl font-serif mb-4">Booking Information</h2>
            <div className="prose prose-neutral">
              <p>
                Please note the following information when booking your treatment:
              </p>
              <ul>
                <li>Arrive 5-10 minutes before your appointment</li>
                <li>Wear comfortable, loose-fitting clothing</li>
                <li>Avoid heavy meals before the treatment</li>
                <li>
                  Cancellations must be made at least 24 hours before the
                  appointment
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Opening Hours</h3>
            <div className="space-y-1 text-neutral-600">
              <p>Monday - Friday: 10:00 - 18:00</p>
              <p>Saturday: By appointment</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Location</h3>
            <p className="text-neutral-600">
              Hoitohuone Zenni
              <br />
              Example Street 123
              <br />
              00100 Helsinki
              <br />
              Finland
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center fade-in">
          <h2 className="text-3xl font-serif mb-4">Have Questions?</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            Find answers to common questions about our services and booking process
            in our FAQ section.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/en/faq"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              View FAQ
            </Link>
            <Link
              href="/en/contact"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 