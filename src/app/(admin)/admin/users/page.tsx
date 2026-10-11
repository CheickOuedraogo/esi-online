import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Utilisateurs',
};

export default function AdminUsersPage() {
  return <UnderConstruction title="Utilisateurs" />;
}