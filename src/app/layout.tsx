import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Suspense, use } from 'react';
import PageTransition from '@/components/PageTransition';
import PageLoading from '@/components/PageLoading';
import { ClerkProvider } from '@clerk/nextjs';
import AdminBar from "@/components/layout/AdminBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Define fonts directly in this file since the import is causing issues
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

// For the page props with params
interface RootLayoutParams {
  lang: string;
  [key: string]: string;
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<RootLayoutParams>;
}) {
  // Properly unwrap params Promise
  const resolvedParams = use(params);
  const lang = resolvedParams?.lang || 'fi';

  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        }
      }}
      signInUrl="/admin/sign-in"
      signUpUrl="/admin/sign-up"
      afterSignInUrl="/admin/dashboard"
      afterSignUpUrl="/admin/dashboard"
    >
      <html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
        <head>
          {/* Add API secret for development and testing */}
          {process.env.NEXT_PUBLIC_ADMIN_API_SECRET && (
            <>
              <meta name="admin-api-secret" content={process.env.NEXT_PUBLIC_ADMIN_API_SECRET} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `window.ADMIN_API_SECRET = "${process.env.NEXT_PUBLIC_ADMIN_API_SECRET}";`
                }}
              />
            </>
          )}

          {/* Auth bootstrap script to detect and break redirect loops */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Auth loop detection
                (function() {
                  function detectAuthLoop() {
                    try {
                      const navHistory = JSON.parse(sessionStorage.getItem('auth_navigation') || '[]');
                      const now = Date.now();
                      navHistory.push({url: window.location.pathname, time: now});
                      if (navHistory.length > 10) navHistory.shift();
                      sessionStorage.setItem('auth_navigation', JSON.stringify(navHistory));
                      
                      const lastMinute = now - 60000;
                      const recentNavs = navHistory.filter(nav => nav.time > lastMinute);
                      const urlCounts = {};
                      recentNavs.forEach(nav => { urlCounts[nav.url] = (urlCounts[nav.url] || 0) + 1; });
                      
                      for (const url in urlCounts) {
                        if (urlCounts[url] >= 3) {
                          console.error('Auth loop detected!', url);
                          return true;
                        }
                      }
                      return false;
                    } catch (e) { return false; }
                  }
                  
                  function clearAuthState() {
                    document.cookie.split(";").forEach(c => {
                      if (c.includes('__clerk') || c.includes('__session')) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
                      }
                    });
                    
                    try {
                      sessionStorage.removeItem('clerk');
                      sessionStorage.removeItem('clerk:auth');
                      localStorage.setItem('auth_cleared_at', Date.now().toString());
                    } catch(e) {}
                    
                    if (window.location.pathname.includes('/admin/')) {
                      window.location.href = '/admin/sign-in?cleared=true';
                      return true;
                    }
                    return false;
                  }
                  
                  if (window.location.pathname.includes('/admin/')) {
                    const lastCleared = parseInt(localStorage.getItem('auth_cleared_at') || '0');
                    const timeSinceLastClear = Date.now() - lastCleared;
                    if (timeSinceLastClear > 5000 && detectAuthLoop()) {
                      console.log('Breaking auth loop by clearing state');
                      clearAuthState();
                    }
                  }
                })();
              `
            }}
          />
        </head>
        <body className="min-h-screen flex flex-col">
          <AuthProvider>
            <AdminBar />
            <Navigation />
            <main className="flex-grow pt-20">
              <Suspense fallback={<PageLoading />}>
                <PageTransition>{children}</PageTransition>
              </Suspense>
            </main>
            <Footer />
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}