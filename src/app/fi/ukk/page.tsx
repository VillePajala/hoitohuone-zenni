'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FAQPage() {
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

  const [openQuestions, setOpenQuestions] = useState<number[]>([]);

  const toggleQuestion = (index: number) => {
    setOpenQuestions((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: 'Yleiset kysymykset',
      questions: [
        {
          question: 'Mitä energiahoito on?',
          answer:
            'Energiahoito on kokonaisvaltainen hoitomuoto, joka työskentelee kehon energiakenttien kanssa poistaakseen energiablokeja ja edistääkseen fyysistä, emotionaalista ja henkistä hyvinvointia. Se perustuu periaatteeseen, että kaikki koostuu energiasta, ja tasapainottamalla tätä energiaa voimme tukea kehon luonnollista paranemiskykyä.',
        },
        {
          question: 'Onko energiahoito turvallista?',
          answer:
            'Kyllä, energiahoito on täysin turvallista ja ei-invasiivista. Se on hellävarainen ja luonnollinen lähestymistapa, jota voidaan käyttää perinteisten lääketieteellisten hoitojen rinnalla. On kuitenkin tärkeää huomata, että energiahoito ei korvaa lääketieteellistä hoitoa.',
        },
        {
          question: 'Täytyykö minun uskoa energiahoitoon, jotta se toimisi?',
          answer:
            'Ei, sinun ei tarvitse uskoa energiahoitoon, jotta se olisi tehokasta. Vaikka avoin mieli voi parantaa kokemustasi, energia virtaa ja toimii uskomuksistasi riippumatta. Monet skeptikot ovat raportoineet positiivisia tuloksia kokeiltuaan energiahoitoa.',
        },
      ],
    },
    {
      title: 'Hoitotiedot',
      questions: [
        {
          question: 'Mitä hoidon aikana tapahtuu?',
          answer:
            'Hoidon aikana makaat täysissä vaatteissa hoitopöydällä hoitajan työskennellessä energiakenttäsi kanssa. Saatat tuntea lämmön tai kihelmöinnin tunnetta tai syvää rentoutumista. Hoito kestää tyypillisesti 60 minuuttia, sisältäen lyhyen konsultaation ennen ja jälkeen hoidon.',
        },
        {
          question: 'Kuinka monta hoitokertaa tarvitsen?',
          answer:
            'Hoitokertojen määrä vaihtelee yksilöllisten tarpeidesi ja tavoitteidesi mukaan. Jotkut tuntevat merkittäviä hyötyjä jo yhden hoitokerran jälkeen, kun taas toiset suosivat säännöllisiä hoitoja osana hyvinvointirutiiniaan. Keskustelemme suositellusta hoitosuunnitelmasta ensimmäisellä käynnilläsi.',
        },
        {
          question: 'Miten valmistaudun hoitoon?',
          answer:
            'Pukeudu mukaviin, väljiin vaatteisiin. Vältä raskaita aterioita ennen hoitoa ja pyri saapumaan rauhallisessa mielentilassa. On hyödyllistä asettaa intentio paranemisellesi, mutta se ei ole välttämätöntä. Vältä alkoholia tai päihteitä 24 tuntia ennen hoitoa.',
        },
      ],
    },
    {
      title: 'Etähoito',
      questions: [
        {
          question: 'Miten etähoito toimii?',
          answer:
            'Etähoito perustuu periaatteeseen, että energia ei ole rajoittunut fyysiseen etäisyyteen. Hoitaja yhdistyy energiakenttääsi etänä sovittuna aikana. Monet asiakkaat raportoivat samanlaisia hyötyjä kuin paikan päällä tapahtuvissa hoidoissa.',
        },
        {
          question: 'Mitä tarvitsen etähoitoa varten?',
          answer:
            'Tarvitset rauhallisen tilan, jossa sinua ei häiritä, ja mukavan paikan maata tai istua. Yhdistämme puhelimitse tai videopuhelulla lyhyesti ennen hoitoa, jonka jälkeen voit rentoutua hoidon aikana.',
        },
      ],
    },
    {
      title: 'Käytännön tiedot',
      questions: [
        {
          question: 'Miten varaan ajan?',
          answer:
            'Voit varata ajan verkkovarausjärjestelmämme kautta, puhelimitse tai sähköpostitse. Vahvistamme varauksesi ja lähetämme sinulle kaikki tarvittavat tiedot, mukaan lukien valmistautumisohjeet.',
        },
        {
          question: 'Mikä on peruutuskäytäntönne?',
          answer:
            'Edellytämme 24 tunnin peruutusilmoitusta. Myöhäisistä peruutuksista tai saapumatta jättämisestä voidaan veloittaa täysi hoitomaksu. Ymmärrämme, että hätätilanteita voi sattua, ja käsittelemme näitä tilanteita tapauskohtaisesti.',
        },
        {
          question: 'Tarjoatteko lahjakortteja?',
          answer:
            'Kyllä, tarjoamme lahjakortteja kaikkiin palveluihimme. Niitä voi ostaa verkosta tai toimipisteestämme, ja ne ovat voimassa kuusi kuukautta ostopäivästä.',
        },
      ],
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">
            Usein kysytyt kysymykset
          </h1>
          <p className="text-xl text-neutral-600">
            Löydä vastauksia yleisiin kysymyksiin energiahoidosta ja palveluistamme.
            Etkö löydä etsimääsi? Ota yhteyttä meihin.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="fade-in">
              <h2 className="text-3xl font-serif mb-8">{category.title}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = categoryIndex * 10 + questionIndex;
                  const isOpen = openQuestions.includes(index);
                  return (
                    <div
                      key={questionIndex}
                      className="border border-neutral-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="w-full flex justify-between items-center p-6 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <span className="font-medium">{faq.question}</span>
                        <svg
                          className={`h-6 w-6 transform transition-transform ${
                            isOpen ? 'rotate-180' : ''
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
                      {isOpen && (
                        <div className="p-6 pt-0 text-neutral-600">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-50 rounded-lg p-12 text-center fade-in">
          <h2 className="text-3xl font-serif mb-4">Vieläkö kysyttävää?</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            Olemme täällä auttaaksemme. Ota meihin suoraan yhteyttä, niin vastaamme
            mielellämme kaikkiin palveluitamme koskeviin kysymyksiin.
          </p>
          <Link
            href="/fi/yhteystiedot"
            className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Ota yhteyttä
          </Link>
        </div>
      </section>
    </div>
  );
} 