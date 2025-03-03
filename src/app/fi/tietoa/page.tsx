export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif mb-8 text-center">Tietoa meistä</h1>

        {/* Introduction Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif mb-4">Tervetuloa Hoitohuone Zenniin</h2>
          <p className="text-neutral-600 mb-4">
            Hoitohuone Zenni on paikka, jossa voit löytää tasapainon ja
            hyvinvoinnin. Tarjoamme yksilöllisiä energiahoitoja ja
            hyvinvointipalveluja Helsingissä.
          </p>
          <p className="text-neutral-600 mb-4">
            Jokainen hoito räätälöidään asiakkaan tarpeiden mukaan, ja
            tavoitteenamme on tukea kokonaisvaltaista hyvinvointia sekä kehon ja
            mielen tasapainoa.
          </p>
        </section>

        {/* Practitioner Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif mb-4">Hoitaja</h2>
          <div className="bg-neutral-50 p-6 rounded-lg">
            <p className="text-neutral-600 mb-4">
              [Hoitajan nimi] on koulutettu energiahoitaja, jolla on [X] vuoden
              kokemus alalta. Hänen erikoisalaansa ovat [erikoisalat], ja hän on
              sitoutunut auttamaan asiakkaitaan saavuttamaan optimaalisen
              hyvinvoinnin tilan.
            </p>
            <p className="text-neutral-600">
              Koulutus ja sertifikaatit:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mt-2">
              <li>Energiahoitajan sertifikaatti (20XX)</li>
              <li>Reiki Master -taso (20XX)</li>
              <li>[Muut relevantit koulutukset]</li>
            </ul>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif mb-4">Hoitofilosofiamme</h2>
          <p className="text-neutral-600 mb-4">
            Uskomme, että jokainen ihminen on ainutlaatuinen kokonaisuus, joka
            ansaitsee yksilöllistä hoitoa ja huomiota. Hoitomme perustuvat
            vuosisatoja vanhoihin perinteisiin, yhdistettynä moderniin
            ymmärrykseen kehon ja mielen yhteydestä.
          </p>
          <p className="text-neutral-600">
            Tavoitteenamme on auttaa asiakkaitamme:
          </p>
          <ul className="list-disc list-inside text-neutral-600 mt-2">
            <li>Löytämään sisäisen tasapainon</li>
            <li>Vahvistamaan kehon luonnollista paranemiskykyä</li>
            <li>Vähentämään stressiä ja jännitystä</li>
            <li>Lisäämään elinvoimaa ja hyvinvointia</li>
          </ul>
        </section>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <a
            href="/ajanvaraus"
            className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Varaa aikasi
          </a>
        </div>
      </div>
    </div>
  );
} 