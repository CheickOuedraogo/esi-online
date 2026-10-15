// Layout de l'espace public : en-tete, contenu principal et pied de page.
// Fournit un point d'ancrage (#contenu) pour le lien d'evitement.

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <SkipLink />
      <Header />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
