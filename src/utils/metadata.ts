import { Metadata } from 'next';

interface GenerateMetadataProps {
  title: string;
  description: string;
  path: string;
  locale?: string;
  noindex?: boolean;
}

export function generateMetadata({
  title,
  description,
  path,
  locale = 'fi',
  noindex = false,
}: GenerateMetadataProps): Metadata {
  const url = `https://hoitohuonezenni.fi${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'fi': `/fi${path}`,
        'en': `/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Hoitohuone Zenni',
      locale: locale === 'fi' ? 'fi_FI' : 'en_US',
      type: 'website',
    },
    robots: noindex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
    },
  };
} 