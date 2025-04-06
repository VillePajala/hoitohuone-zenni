'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: Implement actual form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      reset();
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Yhteystiedot</h1>
          <p className="text-xl text-neutral-600">
            Onko sinulla kysyttävää palveluistamme? Olemme täällä auttaaksemme.
            Täytä alla oleva lomake tai käytä yhteystietojamme ottaaksesi yhteyttä.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 fade-in">
            <div>
              <h2 className="text-3xl font-serif mb-6">Ota yhteyttä</h2>
              <p className="text-neutral-600">
                Vastaamme yhteydenottoosi 24 tunnin kuluessa arkipäivisin.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Sijainti</h3>
                <p className="text-neutral-600">
                  Hoitohuone Zenni
                  <br />
                  Esimerkkikatu 123
                  <br />
                  00100 Helsinki
                  <br />
                  Suomi
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Yhteystiedot</h3>
                <div className="space-y-2 text-neutral-600">
                  <p>
                    <span className="font-medium">Sähköposti:</span>{' '}
                    <a
                      href="mailto:info@hoitohuonezenni.fi"
                      className="hover:text-neutral-900 transition-colors"
                    >
                      info@hoitohuonezenni.fi
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Puhelin:</span>{' '}
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
                <h3 className="font-medium mb-2">Aukioloajat</h3>
                <div className="space-y-1 text-neutral-600">
                  <p>Maanantai - Perjantai: 10:00 - 18:00</p>
                  <p>Lauantai: Sopimuksen mukaan</p>
                  <p>Sunnuntai: Suljettu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="fade-in">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-900 mb-1"
                >
                  Nimi
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: true })}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-neutral-200 focus:ring-neutral-500'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">Nimi on pakollinen</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-900 mb-1"
                >
                  Sähköposti
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', {
                    required: true,
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  })}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-neutral-200 focus:ring-neutral-500'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    Kelvollinen sähköpostiosoite on pakollinen
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-neutral-900 mb-1"
                >
                  Puhelin (valinnainen)
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone')}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 focus:ring-neutral-500 focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-neutral-900 mb-1"
                >
                  Aihe
                </label>
                <input
                  type="text"
                  id="subject"
                  {...register('subject', { required: true })}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.subject
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-neutral-200 focus:ring-neutral-500'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-500">Aihe on pakollinen</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-neutral-900 mb-1"
                >
                  Viesti
                </label>
                <textarea
                  id="message"
                  rows={5}
                  {...register('message', { required: true })}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.message
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-neutral-200 focus:ring-neutral-500'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">Viesti on pakollinen</p>
                )}
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 text-green-800 rounded-md">
                  Kiitos viestistäsi! Otamme sinuun yhteyttä pian.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 text-red-800 rounded-md">
                  Viestin lähetyksessä tapahtui virhe. Yritä uudelleen tai ota yhteyttä suoraan sähköpostitse.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-8 py-4 rounded-md text-white transition-colors ${
                  isSubmitting
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
} 