export default function ServicesPage() {
  const services = [
    {
      title: 'Energiahoito',
      description: 'Kokonaisvaltainen energiahoito, joka auttaa tasapainottamaan kehon energioita ja tukee hyvinvointia.',
      duration: '60 min',
      price: '85€',
    },
    {
      title: 'Reikihoito',
      description: 'Perinteinen japanilainen energiahoitomenetelmä, joka edistää kehon ja mielen tasapainoa.',
      duration: '45 min',
      price: '65€',
    },
    // Placeholder data - to be updated with actual services
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif mb-4">Palvelut</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Tutustu tarjoamiimme hoitopalveluihin. Jokainen hoito on yksilöllisesti
          suunniteltu juuri sinun tarpeisiisi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl font-serif mb-3">{service.title}</h2>
            <p className="text-neutral-600 mb-4">{service.description}</p>
            <div className="flex justify-between items-center text-sm text-neutral-500">
              <span>{service.duration}</span>
              <span className="font-medium text-neutral-900">{service.price}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <a
          href="/ajanvaraus"
          className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
        >
          Varaa aika
        </a>
      </div>
    </div>
  );
} 