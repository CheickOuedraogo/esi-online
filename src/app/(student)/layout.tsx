// Layout de l'espace etudiant : coquille client avec en-tete et navigation.

import { StudentShell } from '@/components/layout/StudentShell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
