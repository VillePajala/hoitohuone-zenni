export default function BookingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-serif mb-4">Ajanvaraus</h1>
        <p className="text-lg text-neutral-600 mb-8">
          Varaa aikasi helposti alla olevan ajanvarausjärjestelmän kautta.
        </p>

        {/* Placeholder for booking system */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 mb-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-medium">
              Ajanvarausjärjestelmä tulossa pian
            </h2>
            <p className="mt-2 text-neutral-600">
              Siihen asti voit varata ajan ottamalla yhteyttä puhelimitse tai
              sähköpostitse.
            </p>
          </div>
        </div>

        {/* Alternative booking methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <svg
              className="h-8 w-8 text-neutral-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">Varaa puhelimitse</h3>
            <p className="text-neutral-600">Puhelin tulossa pian</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <svg
              className="h-8 w-8 text-neutral-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">Varaa sähköpostitse</h3>
            <p className="text-neutral-600">info@hoitohuonezenni.fi</p>
          </div>
        </div>

        {/* Services Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto fade-in">
            <h2 className="text-3xl font-serif mb-4">Saatavilla olevat palvelut</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Valitse haluamasi hoito varataksesi ajan. Kaikki hoidot räätälöidään
              yksilöllisten tarpeidesi mukaan.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto fade-in">
            {/* Add your service cards here */}
          </div>
        </section>
      </div>
    </div>
  );
} 