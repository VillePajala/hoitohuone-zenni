import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import PageLoading from '@/components/PageLoading';
import { ClerkProvider } from '@clerk/nextjs';
import AdminBar from "@/components/layout/AdminBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Hoitohuone Zenni | Energiahoitoja Helsingissä",
    template: "%s | Hoitohuone Zenni"
  },
  description: "Laadukkaita energiahoitoja ja hyvinvointipalveluja Helsingissä. Kokenut energiahoitaja tarjoaa yksilöllisiä hoitoja stressiin, uupumukseen ja kehon tasapainottamiseen.",
  keywords: ["energiahoito", "hyvinvointi", "Helsinki", "hoitohuone", "zenni", "stressinhallinta", "kehon tasapaino", "energiahoitaja"],
  authors: [{ name: "Hoitohuone Zenni" }],
  creator: "Hoitohuone Zenni",
  publisher: "Hoitohuone Zenni",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hoitohuonezenni.fi'),
  alternates: {
    canonical: '/',
    languages: {
      'fi': '/fi',
      'en': '/en',
    },
  },
  openGraph: {
    title: 'Hoitohuone Zenni | Energiahoitoja Helsingissä',
    description: 'Laadukkaita energiahoitoja ja hyvinvointipalveluja Helsingissä. Kokenut energiahoitaja tarjoaa yksilöllisiä hoitoja.',
    url: 'https://hoitohuonezenni.fi',
    siteName: 'Hoitohuone Zenni',
    locale: 'fi_FI',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'add-your-google-site-verification-here',
  },
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang = params.lang || 'fi';

  return (
    <ClerkProvider>
      <html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
        <body className="min-h-screen flex flex-col">
          <AdminBar />
          <Navigation />
          <main className="flex-grow pt-20">
            <Suspense fallback={<PageLoading />}>
              <PageTransition>{children}</PageTransition>
            </Suspense>
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}