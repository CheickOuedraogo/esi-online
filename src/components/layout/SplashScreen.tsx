'use client';

// Ecran d'accueil plein ecran : logo en grand, message de bienvenue en bas.
// Affiche ~2 s puis fondu, au maximum une fois par heure (localStorage).

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface SplashScreenProps {
  message?: string;
  durationMs?: number;
  src?: string;
}

const STORAGE_KEY = 'esi-library:splash:lastShown';
const HOUR_MS = 60 * 60 * 1000;
const FADE_MS = 300;

type Phase = 'idle' | 'visible' | 'fading' | 'hidden';

export function SplashScreen({
  message = "Bienvenue à la bibliothèque numérique de l'ESI",
  durationMs = 2000,
  src = '/logo.jpg',
}: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    let lastShown = 0;
    try {
      lastShown = Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
      // stockage indisponible : on affiche le splash a chaque visite
    }

    if (Date.now() - lastShown < HOUR_MS) {
      setPhase('hidden');
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignorer
    }

    setPhase('visible');
    const hideTimer = window.setTimeout(() => setPhase('fading'), durationMs);
    const removeTimer = window.setTimeout(() => setPhase('hidden'), durationMs + FADE_MS);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [durationMs]);

  if (phase === 'idle' || phase === 'hidden') return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setPhase('fading')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') setPhase('fading');
      }}
      aria-label="Passer l'écran d'accueil"
      aria-hidden={phase === 'fading'}
      className={cn(
        'fixed inset-0 z-50 flex cursor-pointer select-none flex-col items-center justify-center bg-gradient-to-b from-navy-800 to-navy-950',
        'transition-opacity duration-300',
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <div
        aria-hidden="true"
        className={cn('absolute h-72 w-72 rounded-full bg-gold-400/15 blur-3xl', 'motion-safe:animate-fade-in motion-reduce:animate-none')}
      />
      <div
        className={cn(
          'relative rounded-3xl bg-white p-4 shadow-2xl shadow-navy-950/40 motion-safe:animate-scale-in motion-reduce:animate-none',
        )}
      >
        <Image
          src={src}
          alt=""
          width={1075}
          height={976}
          priority
          className="h-44 w-auto rounded-2xl object-contain sm:h-56"
        />
      </div>
      <p
        role="status"
        className={cn(
          'absolute bottom-10 max-w-sm px-6 text-center text-sm text-cream/90 motion-safe:animate-fade-up motion-reduce:animate-none sm:bottom-12 sm:text-base',
        )}
      >
        {message}
      </p>
    </div>
  );
}