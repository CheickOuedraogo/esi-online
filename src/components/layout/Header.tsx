// En-tete public : logo, navigation et acces connexion/inscription.

import Image from 'next/image';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Accueil ESI-Library">
          <Image
            src="/logo.jpg"
            alt=""
            width={1075}
            height={976}
            className="h-10 w-10 rounded-lg bg-white object-contain"
          />
          <span className="hidden text-lg font-semibold tracking-tight text-navy-900 sm:inline">
            ESI-Library
          </span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/documents"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900 sm:inline-block"
          >
            Bibliothèque
          </Link>
          <Link href="/login" className={buttonClassName({ variant: 'ghost', size: 'sm' })}>
            Connexion
          </Link>
          <Link href="/register" className={buttonClassName({ variant: 'primary', size: 'sm' })}>
            S&apos;inscrire
          </Link>
        </nav>
      </div>
    </header>
  );
}