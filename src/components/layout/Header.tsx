'use client';

// En-tete public : logo, navigation, acces connexion/inscription et menu hamburger.

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Header() {
  const [open, setOpen] = useState(false);

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

        <nav className="hidden items-center gap-1.5 sm:flex">
          <Link
            href="/documents"
            className="rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900"
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

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-50 sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-t border-navy-100 bg-cream shadow-lg sm:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
          <Link
            href="/documents"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            Bibliothèque
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className={cn(buttonClassName({ variant: 'primary', size: 'md' }), 'mt-1')}
          >
            S&apos;inscrire
          </Link>
        </nav>
        </div>
      )}
    </header>
  );
}
