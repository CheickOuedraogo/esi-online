'use client';

// Coquille de l'administration : barre laterale, navigation et verification du role admin.
// L'en-tete et la barre laterale restent visibles avant connexion.

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Spinner, buttonClassName } from '@/components/ui';
import { SkipLink } from '@/components/layout/SkipLink';
import {
  DashboardIcon,
  DocumentsIcon,
  ProposalsIcon,
  ResetIcon,
  UsersIcon,
} from '@/components/layout/NavIcons';
import { logout } from '@/lib/api-client/auth';
import { useRequireRole } from '@/lib/hooks/useSession';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', exact: true, icon: DashboardIcon },
  { href: '/admin/users', label: 'Utilisateurs', icon: UsersIcon },
  { href: '/admin/documents', label: 'Documents', icon: DocumentsIcon },
  { href: '/admin/proposals', label: 'Propositions', icon: ProposalsIcon },
  { href: '/admin/reset-requests', label: 'Réinitialisations', icon: ResetIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireRole('admin');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const authed = ready && user;
  const sidebarHidden = !isDesktop && !open;

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.replace('/');
  }

  const currentNavItem = NAV.find((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const currentTitle = currentNavItem ? currentNavItem.label : 'Administration';

  return (
    <div className="min-h-dvh bg-cream">
      <SkipLink />
      <aside
        id="admin-sidebar"
        aria-hidden={sidebarHidden || undefined}
        inert={sidebarHidden}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-cream transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <Image
            src="/logo.jpg"
            alt="ESI-Library"
            width={36}
            height={36}
            className="h-8 w-8 rounded-lg object-cover"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold">ESI-Library</p>
            <p className="text-xs text-gold-300">Administration</p>
          </div>
        </div>

        {authed && (
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'border-gold-400 bg-white/10 text-cream'
                      : 'border-transparent text-cream/70 hover:bg-white/5 hover:text-cream',
                  )}
                >
                  <Icon className={cn(active ? 'text-gold-300' : 'text-cream/50')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {authed && (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Ouvrir le menu"
                  aria-expanded={open}
                  aria-controls="admin-sidebar"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-50 lg:hidden"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-6 w-6">
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <span className="text-base font-semibold text-navy-900">{currentTitle}</span>
            </div>

            <div className="flex items-center gap-3">
              {authed ? (
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Déconnexion
                </Button>
              ) : (
                <>
                  <Link href="/login" className={buttonClassName({ variant: 'ghost', size: 'sm' })}>
                    Connexion
                  </Link>
                  <Link
                    href="/"
                    className={cn(buttonClassName({ variant: 'secondary', size: 'sm' }), 'hidden sm:inline-flex')}
                  >
                    Accueil
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main id="contenu" className="p-4 sm:p-6">
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
    </div>
  );
}
