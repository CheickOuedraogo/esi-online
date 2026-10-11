import type { Metadata } from 'next';
import { AdminResetRequestsView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Réinitialisations',
};

export default function AdminResetRequestsPage() {
  return <AdminResetRequestsView />;
}
