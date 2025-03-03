'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TestimonialsPage() {
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

  const testimonials = [
    {
      content:
        'The energy healing sessions have been transformative for me. I feel more balanced and centered after each visit. The peaceful atmosphere and professional approach make every session special.',
      author: 'Sarah K.',
      title: 'Regular Client',
      service: 'Energy Healing',
    },
    {
      content:
        'I was skeptical at first, but after my first Reiki session, I was amazed by the results. The stress relief and relaxation I experienced were incredible. I highly recommend these services.',
      author: 'Michael R.',
      title: 'Business Professional',
      service: 'Reiki Healing',
    },
    {
      content:
        'Distance healing has been a game-changer for me. Despite being in a different city, I can still benefit from these amazing healing sessions. The effects are just as powerful as in-person treatments.',
      author: 'Emma L.',
      title: 'Remote Client',
      service: 'Distance Healing',
    },
    {
      content:
        'The combination of different energy healing techniques has helped me manage my chronic pain. I appreciate the holistic approach and the attention to individual needs.',
      author: 'David M.',
      title: 'Long-term Client',
      service: 'Energy Healing',
    },
    {
      content:
        'Regular sessions have improved my sleep quality and reduced anxiety. The peaceful environment and professional care make each visit a rejuvenating experience.',
      author: 'Lisa P.',
      title: 'Healthcare Professional',
      service: 'Reiki Healing',
    },
    {
      content:
        'I\'ve been doing monthly distance healing sessions for half a year now. The flexibility of scheduling and the effectiveness of the treatment have made it an essential part of my wellness routine.',
      author: 'James W.',
      title: 'International Client',
      service: 'Distance Healing',
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Client Testimonials</h1>
          <p className="text-xl text-neutral-600">
            Read about the experiences of our clients and discover how energy
            healing has supported their wellbeing journey.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 fade-in"
            >
              <svg
                className="h-8 w-8 text-neutral-300 mb-4"
                fill="currentColor"
                viewBox="0 0 32 32"
              >
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              <p className="text-neutral-600 mb-6">{testimonial.content}</p>
              <div className="flex justify-between items-end">
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-neutral-500 text-sm">
                    {testimonial.title}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="bg-neutral-100 px-3 py-1 rounded-full">
                    {testimonial.service}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-50 rounded-lg p-12 text-center fade-in">
          <h2 className="text-3xl font-serif mb-4">Experience It Yourself</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            Join our satisfied clients and start your healing journey today. Book
            your first session or contact us to learn more about our services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/en/services"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              View Services
            </Link>
            <Link
              href="/en/booking"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 