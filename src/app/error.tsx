'use client';

// Page d'erreur globale (erreurs de rendu cote client) : message et bouton de reprise.

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonClassName } from '@/components/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Erreur</p>
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
        Une erreur inattendue est survenue
      </h1>
      <p className="max-w-md text-sm text-navy-600">
        Réessayez dans un instant. Si le problème persiste, revenez à l&apos;accueil.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Réessayer</Button>
        <Link href="/" className={buttonClassName({ variant: 'secondary' })}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
