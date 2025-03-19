import { Inter, Playfair_Display } from 'next/font/google';

// Define fonts to be used throughout the application
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: 'swap',
}); 