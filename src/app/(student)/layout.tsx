// Layout de l'espace etudiant : coquille client avec en-tete et navigation,
// et fournisseur des favoris locaux (stockage navigateur).

import { StudentShell } from '@/components/layout/StudentShell';
import { FavoritesProvider } from '@/features/favorites';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <StudentShell>{children}</StudentShell>
    </FavoritesProvider>
  );
}
