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
      title: 'Energiahoito',
      description:
        'Energiahoito on kokonaisvaltainen hoitomenetelmä, joka auttaa tasapainottamaan kehosi energiavirtauksia. Hoidon aikana työskentelen energiakentässäsi poistaakseni tukoksia ja palauttaakseni luonnollisen energian virtauksen. Hoito voi auttaa erilaisissa fyysisissä ja emotionaalisissa haasteissa.',
      duration: '60 min',
      price: '75€',
      benefits: [
        'Stressin lievitys',
        'Parempi unenlaatu',
        'Kivun lievitys',
        'Tunne-elämän tasapaino',
        'Lisääntynyt energiataso',
      ],
    },
    {
      title: 'Reikihoito',
      description:
        'Reiki on japanilainen energiahoitomuoto, joka edistää rentoutumista ja vähentää stressiä. Sertifioituna Reiki-hoitajana kanavoin universaalia elämänenergiaa lempeän kosketuksen kautta tukemaan kehosi luonnollista paranemiskykyä.',
      duration: '60 min',
      price: '75€',
      benefits: [
        'Syvä rentoutuminen',
        'Stressin ja ahdistuksen lievitys',
        'Energiatasapaino',
        'Mielen selkeys',
        'Kokonaisvaltainen hyvinvointi',
      ],
    },
    {
      title: 'Etähoito',
      description:
        'Etähoito mahdollistaa energiahoidon vastaanottamisen kotisi mukavuudesta. Energia ei ole sidottu fyysiseen etäisyyteen, mikä tekee tästä tehokkaan vaihtoehdon paikan päällä tapahtuvalle hoidolle.',
      duration: '45 min',
      price: '65€',
      benefits: [
        'Hoito kotoa käsin',
        'Samat hyödyt kuin paikan päällä',
        'Ei matkustamista',
        'Joustava aikataulutus',
        'Täydellinen etäasiakkaille',
      ],
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">Palvelut</h1>
          <p className="text-xl text-neutral-600">
            Tutustu hoitopalveluihimme, jotka on suunniteltu tukemaan hyvinvointiasi.
            Jokainen hoito räätälöidään yksilöllisten tarpeidesi mukaan.
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
                    <h3 className="font-medium mb-2">Hyödyt:</h3>
                    <ul className="list-disc list-inside text-neutral-600 space-y-1">
                      {service.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-8">
                  <div className="space-y-4">
                    <h3 className="font-medium">Varaa tämä hoito</h3>
                    <p className="text-neutral-600">
                      Haluatko kokea {service.title.toLowerCase()}n hyödyt?
                      Varaa aikasi nyt tai ota yhteyttä lisätietoja varten.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/fi/ajanvaraus"
                        className="inline-block bg-neutral-900 text-white text-center px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
                      >
                        Varaa aika
                      </Link>
                      <Link
                        href="/fi/yhteystiedot"
                        className="inline-block bg-white text-neutral-900 text-center px-6 py-3 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
                      >
                        Ota yhteyttä
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
            <h2 className="text-3xl font-serif mb-4">Onko sinulla kysyttävää?</h2>
            <p className="text-neutral-600 mb-8">
              Löydä vastaukset yleisimpiin kysymyksiin palveluistamme ja hoidoista UKK-osiostamme.
            </p>
            <Link
              href="/fi/ukk"
              className="inline-block bg-white text-neutral-900 px-8 py-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Katso UKK
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 