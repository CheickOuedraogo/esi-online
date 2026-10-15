// Page 404 : message clair et retour vers les sections utiles.

import Link from 'next/link';
import { buttonClassName } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Erreur 404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
        Cette page est introuvable
      </h1>
      <p className="max-w-md text-sm text-navy-600">
        Le lien est peut-être obsolète ou la page a été déplacée. Revenez à l&apos;accueil ou
        consultez la bibliothèque.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClassName({ variant: 'primary' })}>
          Retour à l&apos;accueil
        </Link>
        <Link href="/documents" className={buttonClassName({ variant: 'secondary' })}>
          Voir les documents
        </Link>
      </div>
    </div>
  );
}
