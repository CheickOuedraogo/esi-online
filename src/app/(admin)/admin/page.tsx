import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Tableau de bord',
};

export default function AdminDashboardPage() {
  return <UnderConstruction title="Tableau de bord" />;
}