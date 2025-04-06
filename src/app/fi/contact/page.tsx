'use client';

import { useEffect } from 'react';
import ContactForm, { ContactFormData } from '@/components/ContactForm';

const translations = {
  name: 'Nimi',
  email: 'Sähköposti',
  phone: 'Puhelin',
  subject: 'Aihe',
  message: 'Viesti',
  submit: 'Lähetä viesti',
  required: 'Tämä kenttä on pakollinen',
  validEmail: 'Anna kelvollinen sähköpostiosoite',
  success: 'Kiitos viestistäsi! Palaamme asiaan pian.',
  error: 'Jotain meni pieleen. Yritä myöhemmin uudelleen.',
  phoneOptional: 'Puhelin (valinnainen)',
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
          <h1 className="text-5xl font-serif mb-6">Ota yhteyttä</h1>
          <p className="text-xl text-neutral-600">
            Onko sinulla kysyttävää palveluistamme? Olemme täällä auttaaksemme. Täytä alla oleva lomake
            tai käytä yhteystietojamme ottaaksesi meihin yhteyttä.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 fade-in">
            <div>
              <h2 className="text-3xl font-serif mb-6">Yhteystiedot</h2>
              <p className="text-neutral-600">
                Vastaamme yhteydenottoihin arkisin 24 tunnin kuluessa.
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
                  <p>Lauantai: Ajanvarauksella</p>
                  <p>Sunnuntai: Suljettu</p>
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
    </div>
  );
} 