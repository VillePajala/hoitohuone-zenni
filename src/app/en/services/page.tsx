'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ServicesPage() {
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
      description:
        'Energy healing is a holistic treatment method that helps balance your body\'s energy flows. During the treatment, I work with your energy field to remove blockages and restore natural energy flow. The treatment can help with various physical and emotional challenges.',
      duration: '60 min',
      price: '75€',
      benefits: [
        'Stress relief',
        'Better sleep quality',
        'Pain reduction',
        'Emotional balance',
        'Increased energy levels',
      ],
    },
    {
      title: 'Reiki Healing',
      description:
        'Reiki is a Japanese form of energy healing that promotes relaxation and reduces stress. As a certified Reiki practitioner, I channel universal life energy through gentle touch to support your body\'s natural healing abilities.',
      duration: '60 min',
      price: '75€',
      benefits: [
        'Deep relaxation',
        'Stress and anxiety reduction',
        'Energy balance',
        'Mental clarity',
        'Overall wellbeing',
      ],
    },
    {
      title: 'Distance Healing',
      description:
        'Distance healing allows you to receive energy healing from the comfort of your own home. Energy is not limited by physical distance, making this an effective alternative to in-person sessions.',
      duration: '45 min',
      price: '65€',
      benefits: [
        'Convenience of home treatment',
        'Same benefits as in-person healing',
        'No travel required',
        'Flexible scheduling',
        'Perfect for remote clients',
      ],
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Our Services</h1>
          <p className="text-xl text-neutral-600">
            Discover our range of healing services designed to support your
            wellbeing. Each treatment is personalized to meet your individual needs.
          </p>
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
                    <h3 className="font-medium mb-2">Benefits:</h3>
                    <ul className="list-disc list-inside text-neutral-600 space-y-1">
                      {service.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-8">
                  <div className="space-y-4">
                    <h3 className="font-medium">Book This Service</h3>
                    <p className="text-neutral-600">
                      Ready to experience the benefits of {service.title.toLowerCase()}?
                      Book your session now or contact us for more information.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/en/booking"
                        className="inline-block bg-neutral-900 text-white text-center px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
                      >
                        Book Now
                      </Link>
                      <Link
                        href="/en/contact"
                        className="inline-block bg-white text-neutral-900 text-center px-6 py-3 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
                      >
                        Contact Us
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
            <h2 className="text-3xl font-serif mb-4">Have Questions?</h2>
            <p className="text-neutral-600 mb-8">
              Find answers to common questions about our services and treatments in
              our FAQ section.
            </p>
            <Link
              href="/en/faq"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 