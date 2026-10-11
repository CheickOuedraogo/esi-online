'use client';

// Coquille de l'espace etudiant : en-tete, navigation et verification d'acces.

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { logout } from '@/lib/api-client/auth';
import { useRequireRole } from '@/lib/hooks/useSession';
import { cn } from '@/lib/utils';
import { FullPageLoader } from './FullPageLoader';

const NAV = [
  { href: '/library', label: 'Bibliothèque' },
  { href: '/proposals', label: 'Mes propositions' },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireRole('student');
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
      <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/library" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="ESI-Library"
              width={40}
              height={40}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="hidden text-base font-semibold text-navy-900 sm:inline">ESI-Library</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-navy-600 sm:inline">{user.fullName}</span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
