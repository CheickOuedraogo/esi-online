import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ESI-Library',
    template: '%s · ESI-Library',
  },
  description:
    "La bibliothèque numérique de l'École Supérieure d'Informatique (ESI) — cours, TD, TP, tests et annales.",
  applicationName: 'ESI-Library',
};

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
