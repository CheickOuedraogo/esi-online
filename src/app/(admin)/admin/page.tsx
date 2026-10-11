import type { Metadata } from 'next';
import { AdminDashboardView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Tableau de bord',
};

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
