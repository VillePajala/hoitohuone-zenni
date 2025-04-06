export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: 'Hoitohuone Zenni',
    description: 'Energiahoitoja ja hyvinvointipalveluja Helsingissä',
    url: 'https://hoitohuonezenni.fi',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Helsinki',
      addressCountry: 'FI'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '60.1699',
      longitude: '24.9384'
    },
    openingHours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-16:00'],
    priceRange: '€€',
    image: 'https://hoitohuonezenni.fi/images/logo.png'
  };
};

export const generateServiceSchema = (service: {
  name: string;
  description: string;
  price: string;
  duration: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndWellnessService',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'HealthAndBeautyBusiness',
      name: 'Hoitohuone Zenni'
    },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'EUR'
    },
    duration: service.duration
  };
};

export const generateLocalBusinessSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Hoitohuone Zenni',
    image: 'https://hoitohuonezenni.fi/images/logo.png',
    '@id': 'https://hoitohuonezenni.fi',
    url: 'https://hoitohuonezenni.fi',
    telephone: '+358XXXXXXXXX',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '[Your Street Address]',
      addressLocality: 'Helsinki',
      postalCode: '[Your Postal Code]',
      addressCountry: 'FI'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '60.1699',
      longitude: '24.9384'
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00'
      }
    ]
  };
}; 