export default function TestimonialsPage() {
  const testimonials = [
    {
      name: 'Maija M.',
      title: 'Säännöllinen asiakas',
      content:
        'Energiahoidot ovat auttaneet minua merkittävästi stressin hallinnassa. Jokaisen käynnin jälkeen olen rentoutuneempi ja energisempi.',
      rating: 5,
    },
    {
      name: 'Juhani K.',
      title: 'Uusi asiakas',
      content:
        'Olin aluksi skeptinen, mutta jo ensimmäisen hoitokerran jälkeen huomasin positiivisia muutoksia. Uni on parantunut ja olo on kevyempi.',
      rating: 5,
    },
    // Placeholder testimonials
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif mb-4">Asiakkaiden kokemuksia</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Lue mitä asiakkaamme kertovat kokemuksistaan Hoitohuone Zennissä.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200"
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <span className="text-xl font-serif text-neutral-600">
                  {testimonial.name.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="font-medium">{testimonial.name}</h3>
                <p className="text-sm text-neutral-500">{testimonial.title}</p>
              </div>
            </div>
            <p className="text-neutral-600 mb-4">{testimonial.content}</p>
            <div className="flex text-yellow-400">
              {[...Array(testimonial.rating)].map((_, i) => (
                <svg
                  key={i}
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-neutral-600 mb-6">
          Haluatko jakaa oman kokemuksesi? Ota yhteyttä!
        </p>
        <a
          href="/yhteystiedot"
          className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
        >
          Ota yhteyttä
        </a>
      </div>
    </div>
  );
} 