// Landing page publique : presentation de la bibliotheque et acces connexion/inscription.
// Affiche l'ecran d'accueil (splash) une fois par heure.

import Link from 'next/link';
import Image from 'next/image';
import { SplashScreen } from '@/components/layout/SplashScreen';

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-navy-800 to-navy-950 px-6 text-cream">
      <SplashScreen />
      <div aria-hidden="true" className="absolute h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl shadow-navy-950/40 motion-safe:animate-scale-in">
        <Image
          src="/logo.jpg"
          alt="ESI-Library"
          width={1075}
          height={976}
          priority
          className="w-full rounded-2xl object-contain"
        />
      </div>
      <h1 className="relative mt-6 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
        La bibliothèque numérique de l&apos;ESI
      </h1>
      <p className="relative mt-2 max-w-md text-center text-sm text-cream/70 sm:text-base">
        Cours, TD, TP, tests et annales réunis au même endroit pour les étudiants de l&apos;École
        Supérieure d&apos;Informatique.
      </p>
      <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row motion-safe:animate-fade-up">
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cream px-8 text-base font-medium text-navy-900 shadow-sm transition-colors hover:bg-white active:bg-cream/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
        >
          Connexion
        </Link>
        <Link
          href="/register"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/60 bg-white/10 px-8 text-base font-medium text-cream transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
        >
          S&apos;inscrire
        </Link>
      </div>
    </main>
  );
}