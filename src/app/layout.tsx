import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
const DESCRIPTION =
  "La bibliothèque numérique de l'École Supérieure d'Informatique (ESI) — cours, TD, TP, tests et annales.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ESI-Library',
    template: '%s · ESI-Library',
  },
  description: DESCRIPTION,
  applicationName: 'ESI-Library',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: 'ESI-Library',
    title: 'ESI-Library',
    description: DESCRIPTION,
    images: [{ url: '/logo.jpg', width: 1075, height: 976, alt: 'ESI-Library' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ESI-Library',
    description: DESCRIPTION,
    images: ['/logo.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#4d6333',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
