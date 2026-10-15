// Layout de l'espace d'authentification : en-tete public toujours visible et carte centree.

import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-navy-50/60">
      <SkipLink />
      <Header />
      <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
