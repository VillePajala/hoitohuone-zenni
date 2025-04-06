'use client';

import { useEffect } from 'react';
import ContactForm, { ContactFormData } from '@/components/ContactForm';

const translations = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  subject: 'Subject',
  message: 'Message',
  submit: 'Send Message',
  required: 'This field is required',
  validEmail: 'Please enter a valid email address',
  success: 'Thank you for your message! We\'ll get back to you soon.',
  error: 'Something went wrong. Please try again later.',
  phoneOptional: 'Phone (optional)',
};

export default function ContactPage() {
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

  const handleSubmit = async (data: ContactFormData) => {
    // TODO: Implement actual form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Contact Us</h1>
          <p className="text-xl text-neutral-600">
            Have questions about our services? We're here to help. Fill out the form
            below or use our contact information to get in touch.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 fade-in">
            <div>
              <h2 className="text-3xl font-serif mb-6">Get in Touch</h2>
              <p className="text-neutral-600">
                We'll get back to you within 24 hours during business days.
              </p>
            </div>

            <div className="space-y-6">
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

              <div>
                <h3 className="font-medium mb-2">Contact Information</h3>
                <div className="space-y-2 text-neutral-600">
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    <a
                      href="mailto:info@hoitohuonezenni.fi"
                      className="hover:text-neutral-900 transition-colors"
                    >
                      info@hoitohuonezenni.fi
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{' '}
                    <a
                      href="tel:+358401234567"
                      className="hover:text-neutral-900 transition-colors"
                    >
                      +358 40 123 4567
                    </a>
                  </p>
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
            </div>
          </div>

          {/* Contact Form */}
          <div className="fade-in">
            <ContactForm onSubmit={handleSubmit} translations={translations} />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 fade-in">
        <div className="aspect-[16/9] bg-neutral-100 rounded-lg overflow-hidden">
          {/* TODO: Add actual map integration */}
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            Map placeholder
          </div>
        </div>
      </section>
    </div>
  );
} 