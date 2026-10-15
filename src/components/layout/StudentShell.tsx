'use client';

// Coquille de l'espace etudiant : en-tete, navigation et verification d'acces.
// La barre de navigation reste visible meme avant connexion, avec menu hamburger
// sur petits ecrans.

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Spinner, buttonClassName } from '@/components/ui';
import { SkipLink } from '@/components/layout/SkipLink';
import { logout } from '@/lib/api-client/auth';
import { useRequireRole } from '@/lib/hooks/useSession';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/library', label: 'Bibliothèque' },
  { href: '/proposals', label: 'Mes propositions' },
];

const MENU_ID = 'student-menu';

export function StudentShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireRole('student');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const authed = ready && user;

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.replace('/');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <SkipLink />
      <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={authed ? '/library' : '/'} className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="ESI-Library"
              width={40}
              height={40}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="hidden text-base font-semibold text-navy-900 sm:inline">ESI-Library</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-navy-50 text-navy-900'
                      : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {authed ? (
              <>
                <span className="text-sm text-navy-600">{user.fullName}</span>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClassName({ variant: 'ghost', size: 'sm' })}>
                  Connexion
                </Link>
                <Link href="/register" className={buttonClassName({ variant: 'primary', size: 'sm' })}>
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-50 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-6 w-6">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div
            id={MENU_ID}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-navy-100 bg-white shadow-lg sm:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-navy-50 text-navy-900' : 'text-navy-600 hover:bg-navy-50',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-1 border-t border-navy-50 pt-3">
                {authed ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-navy-600">{user.fullName}</span>
                    <Button variant="secondary" size="sm" onClick={handleLogout}>
                      Déconnexion
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
                      Connexion
                    </Link>
                    <Link href="/register" className={buttonClassName({ variant: 'primary', size: 'md' })}>
                      S&apos;inscrire
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {authed ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-navy-500">
            <Spinner className="h-7 w-7 text-navy-400" label="Vérification de votre session" />
            <p className="text-sm">Vérification de votre session…</p>
          </div>
        )}
      </main>
    </div>
  );
}
