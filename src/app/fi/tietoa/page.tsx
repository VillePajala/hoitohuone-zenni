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
      title: 'Matkan alku',
      description:
        'Aloitin matkani energiahoitamisen parissa ja suoritin ensimmäisen Reiki-sertifikaattini.',
    },
    {
      year: '2019',
      title: 'Jatkokoulutus',
      description:
        'Suoritin edistyneitä energiahoitokursseja ja sain lisää sertifikaatteja.',
    },
    {
      year: '2020',
      title: 'Hoitohuone Zennin perustaminen',
      description:
        'Perustin Hoitohuone Zennin tuodakseni hoitopalvelut useampien ihmisten saataville.',
    },
    {
      year: '2021',
      title: 'Palveluiden laajentaminen',
      description:
        'Aloitin etähoitopalvelut tavoittaakseni asiakkaita maailmanlaajuisesti.',
    },
  ];

  const values = [
    {
      title: 'Kokonaisvaltainen lähestymistapa',
      description:
        'Uskomme koko ihmisen - kehon, mielen ja hengen - hoitamiseen optimaalisen hyvinvoinnin saavuttamiseksi.',
    },
    {
      title: 'Yksilöllinen hoito',
      description:
        'Jokainen ihminen on ainutlaatuinen, ja räätälöimme hoitomme juuri sinun tarpeisiisi sopiviksi.',
    },
    {
      title: 'Ammatillinen osaaminen',
      description:
        'Ylläpidämme korkeaa ammattitaitoa ja kehitämme jatkuvasti asiantuntemustamme.',
    },
    {
      title: 'Turvallinen ympäristö',
      description:
        'Tarjoamme turvallisen, rauhallisen ja hoivaavan ympäristön paranemismatkallesi.',
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center fade-in">
          <div>
            <h1 className="text-5xl font-serif mb-6">Tietoa Hoitohuone Zennistä</h1>
            <p className="text-xl text-neutral-600 mb-8">
              Tervetuloa Hoitohuone Zenniin, jossa yhdistämme perinteistä viisautta
              moderneihin energiahoitokäytäntöihin tukeaksemme hyvinvointimatkaasi.
            </p>
            <Link
              href="/fi/yhteystiedot"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
            >
              Ota yhteyttä
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
          <h2 className="text-3xl font-serif mb-6 text-center">Meidän tarinamme</h2>
          <div className="prose prose-neutral mx-auto">
            <p>
              Hoitohuone Zenni syntyi syvästä intohimosta auttaa muita saavuttamaan
              tasapainon ja hyvinvoinnin energiahoidon avulla. Matkani energiahoidon
              parissa alkoi vuonna 2018, kun löysin näiden ikivanhoja käytäntöjen
              muutosvoimaisen vaikutuksen.
            </p>
            <p>
              Vuosien opiskelun ja harjoittelun jälkeen perustin Hoitohuone Zennin
              luodakseni tilan, jossa ihmiset voivat kokea ammattimaisen energiahoidon
              hyödyt rauhallisessa ja hoivaavassa ympäristössä.
            </p>
            <p>
              Tänään jatkamme kasvua ja kehitystä, tarjoten sekä paikan päällä
              tapahtuvia että etähoitopalveluja asiakkaille, jotka etsivät tasapainoa,
              paranemista ja henkilökohtaista kasvua.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto fade-in">
          <h2 className="text-3xl font-serif mb-12 text-center">Meidän matkamme</h2>
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
            <h2 className="text-3xl font-serif mb-4">Arvomme</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Nämä ydinarvot ohjaavat toimintaamme ja varmistavat, että tarjoamme
              parasta mahdollista hoitoa asiakkaillemme.
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
          <h2 className="text-3xl font-serif mb-4">Aloita hoitomatkasi</h2>
          <p className="text-neutral-300 max-w-2xl mx-auto mb-8">
            Koe ammattimaisen energiahoidon hyödyt rauhallisessa ja hoivaavassa
            ympäristössä. Varaa aikasi tänään.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/fi/palvelut"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md hover:bg-neutral-100 transition-colors"
            >
              Katso palvelut
            </Link>
            <Link
              href="/fi/ajanvaraus"
              className="inline-block bg-neutral-800 text-white px-8 py-4 rounded-md hover:bg-neutral-700 transition-colors"
            >
              Varaa aika
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 