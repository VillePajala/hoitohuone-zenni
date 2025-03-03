'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
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

  const milestones = [
    {
      year: '2018',
      title: 'Beginning of the Journey',
      description:
        'Started my journey in energy healing and completed my first Reiki certification.',
    },
    {
      year: '2019',
      title: 'Advanced Training',
      description:
        'Completed advanced energy healing courses and received additional certifications.',
    },
    {
      year: '2020',
      title: 'Hoitohuone Zenni Founded',
      description:
        'Established Hoitohuone Zenni to bring healing services to more people.',
    },
    {
      year: '2021',
      title: 'Expanding Services',
      description:
        'Introduced distance healing services to reach clients globally.',
    },
  ];

  const values = [
    {
      title: 'Holistic Approach',
      description:
        'We believe in treating the whole person - body, mind, and spirit - to achieve optimal wellbeing.',
    },
    {
      title: 'Individual Care',
      description:
        'Every person is unique, and we tailor our treatments to meet your specific needs.',
    },
    {
      title: 'Professional Excellence',
      description:
        'We maintain high standards of professionalism and continuously develop our expertise.',
    },
    {
      title: 'Safe Environment',
      description:
        'We provide a safe, peaceful, and nurturing environment for your healing journey.',
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center fade-in">
          <div>
            <h1 className="text-5xl font-serif mb-6">About Hoitohuone Zenni</h1>
            <p className="text-xl text-neutral-600 mb-8">
              Welcome to Hoitohuone Zenni, where we combine traditional wisdom with
              modern energy healing practices to support your wellbeing journey.
            </p>
            <Link
              href="/en/contact"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            {/* Placeholder for profile image */}
            <div className="absolute inset-0 bg-neutral-100" />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto fade-in">
          <h2 className="text-3xl font-serif mb-6 text-center">Our Story</h2>
          <div className="prose prose-neutral mx-auto">
            <p>
              Hoitohuone Zenni was born from a deep passion for helping others
              achieve balance and wellbeing through energy healing. My journey in
              energy healing began in 2018 when I discovered the transformative
              power of these ancient practices.
            </p>
            <p>
              After years of study and practice, I founded Hoitohuone Zenni to
              create a space where people could experience the benefits of
              professional energy healing in a peaceful and nurturing environment.
            </p>
            <p>
              Today, we continue to grow and evolve, offering both in-person and
              distance healing services to clients seeking balance, healing, and
              personal growth.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto fade-in">
          <h2 className="text-3xl font-serif mb-12 text-center">Our Journey</h2>
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-8 items-start"
              >
                <div className="flex-none">
                  <div className="bg-neutral-900 text-white px-4 py-2 rounded-md">
                    {milestone.year}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">{milestone.title}</h3>
                  <p className="text-neutral-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl font-serif mb-4">Our Values</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              These core values guide our practice and ensure we provide the best
              possible care for our clients.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 fade-in">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200"
              >
                <h3 className="text-xl font-medium mb-4">{value.title}</h3>
                <p className="text-neutral-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-900 text-white rounded-lg p-12 text-center fade-in">
          <h2 className="text-3xl font-serif mb-4">Start Your Healing Journey</h2>
          <p className="text-neutral-300 max-w-2xl mx-auto mb-8">
            Experience the benefits of professional energy healing in a peaceful and
            nurturing environment. Book your session today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/en/services"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md hover:bg-neutral-100 transition-colors"
            >
              View Services
            </Link>
            <Link
              href="/en/booking"
              className="inline-block bg-neutral-800 text-white px-8 py-4 rounded-md hover:bg-neutral-700 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 