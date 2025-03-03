'use client';

import { useState } from 'react';

export default function FAQPage() {
  const faqs = [
    {
      question: 'Mitä energiahoito on?',
      answer:
        'Energiahoito on hoitomuoto, joka keskittyy kehon energiavirtojen tasapainottamiseen. Hoidon aikana hoitaja kanavoi energiaa käsiensä kautta asiakkaan kehoon, mikä voi auttaa stressin lievittämisessä, rentoutumisessa ja kehon luonnollisen paranemiskyvyn tukemisessa.',
    },
    {
      question: 'Miten voin valmistautua hoitoon?',
      answer:
        'Hoitoon kannattaa tulla levänneenä ja rauhallisella mielellä. Vältä raskasta ateriaa juuri ennen hoitoa. Pukeudu mukaviin, väljiin vaatteisiin. Saavu paikalle noin 5-10 minuuttia ennen varattua aikaa.',
    },
    {
      question: 'Kuinka kauan hoito kestää?',
      answer:
        'Hoitojen kesto vaihtelee 45-90 minuutin välillä hoitomuodosta riippuen. Tarkemmat tiedot löydät Palvelut-sivulta kunkin hoidon kohdalta.',
    },
    {
      question: 'Onko hoito turvallista?',
      answer:
        'Kyllä, energiahoidot ovat turvallisia ja hellävaraisia hoitomuotoja. Ne soveltuvat kaikenikäisille ja niitä voidaan käyttää täydentävänä hoitona perinteisen lääketieteen rinnalla.',
    },
    // Placeholder FAQs
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif mb-8 text-center">
          Usein kysytyt kysymykset
        </h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-neutral-200 rounded-lg overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-neutral-50"
                onClick={() => toggleQuestion(index)}
              >
                <span className="font-medium">{faq.question}</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-200 ease-in-out ${
                  openIndex === index ? 'py-4' : 'max-h-0'
                }`}
              >
                <p className="text-neutral-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-neutral-600 mb-6">
            Etkö löytänyt etsimääsi vastausta? Ota yhteyttä, niin autamme
            mielellämme!
          </p>
          <a
            href="/yhteystiedot"
            className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Ota yhteyttä
          </a>
        </div>
      </div>
    </div>
  );
} 