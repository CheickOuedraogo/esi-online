'use client';

// Coquille de l'administration : barre laterale, navigation et verification du role admin.

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { logout } from '@/lib/api-client/auth';
import { useRequireRole } from '@/lib/hooks/useSession';
import { cn } from '@/lib/utils';
import { FullPageLoader } from './FullPageLoader';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', exact: true },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/documents', label: 'Documents' },
  { href: '/admin/proposals', label: 'Propositions' },
  { href: '/admin/reset-requests', label: 'Réinitialisations' },
  { href: '/admin/catalog', label: 'Catalogue' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireRole('admin');
  const pathname = usePathname();
  const router = useRouter();

  if (!ready || !user) {
    return <FullPageLoader label="Vérification de votre session…" />;
  }

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.replace('/');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="sticky top-0 z-20 border-b border-navy-900/20 bg-navy-800 text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="ESI-Library"
              width={36}
              height={36}
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-base font-semibold">
              ESI-Library <span className="text-gold-300">· Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-cream/80 sm:inline">{user.fullName}</span>
            <Button
              variant="secondary"
              size="sm"
              className="border-white/30 bg-white/10 text-cream hover:bg-white/20"
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-navy-100 bg-white p-2 lg:flex-col lg:overflow-visible">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-navy-700 text-cream'
                      : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
