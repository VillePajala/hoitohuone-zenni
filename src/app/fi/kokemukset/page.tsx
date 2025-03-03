'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        'Energiahoitosessiot ovat olleet minulle mullistavia. Tunnen itseni tasapainoisemmaksi ja keskittyneemmäksi jokaisen käynnin jälkeen. Rauhallinen ilmapiiri ja ammattimainen lähestymistapa tekevät jokaisesta sessiosta erityisen.',
      author: 'Sanna K.',
      title: 'Vakioasiakas',
      service: 'Energiahoito',
    },
    {
      content:
        'Olin aluksi skeptinen, mutta ensimmäisen Reiki-session jälkeen olin hämmästynyt tuloksista. Stressin lievitys ja rentoutuminen olivat uskomattomia. Suosittelen näitä palveluita lämpimästi.',
      author: 'Mikko R.',
      title: 'Yritysalan ammattilainen',
      service: 'Reiki-hoito',
    },
    {
      content:
        'Etähoito on ollut minulle käänteentekevää. Vaikka olen eri kaupungissa, voin silti hyötyä näistä mahtavista hoitosessioista. Vaikutukset ovat yhtä voimakkaita kuin paikan päällä tehdyissä hoidoissa.',
      author: 'Emma L.',
      title: 'Etäasiakas',
      service: 'Etähoito',
    },
    {
      content:
        'Erilaisten energiahoitotekniikoiden yhdistelmä on auttanut minua hallitsemaan kroonista kipua. Arvostan kokonaisvaltaista lähestymistapaa ja huomiota yksilöllisiin tarpeisiin.',
      author: 'David M.',
      title: 'Pitkäaikainen asiakas',
      service: 'Energiahoito',
    },
    {
      content:
        'Säännölliset sessiot ovat parantaneet unenlaatua ja vähentäneet ahdistusta. Rauhallinen ympäristö ja ammattimainen hoito tekevät jokaisesta käynnistä virkistävän kokemuksen.',
      author: 'Liisa P.',
      title: 'Terveydenhuollon ammattilainen',
      service: 'Reiki-hoito',
    },
    {
      content:
        'Olen käynyt kuukausittaisissa etähoitosessioissa puolen vuoden ajan. Aikataulutuksen joustavuus ja hoidon tehokkuus ovat tehneet siitä olennaisen osan hyvinvointirutiiniani.',
      author: 'Jaakko V.',
      title: 'Kansainvälinen asiakas',
      service: 'Etähoito',
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Asiakkaiden kokemuksia</h1>
          <p className="text-xl text-neutral-600">
            Lue asiakkaidemme kokemuksista ja siitä, miten energiahoito on tukenut
            heidän hyvinvointimatkaansa.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src="/images/general/image.png"
                      alt={testimonial.author}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-neutral-500 text-sm">
                      {testimonial.title}
                    </div>
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
          <h2 className="text-3xl font-serif mb-4">Koe se itse</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            Liity tyytyväisten asiakkaidemme joukkoon ja aloita oma hoitomatkasi
            tänään. Varaa ensimmäinen sessiosi tai ota yhteyttä saadaksesi lisätietoja
            palveluistamme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/fi/palvelut"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              Katso palvelut
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
    </div>
  );
} 