import type { Metadata } from 'next';
import { AdminUsersView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Utilisateurs',
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
