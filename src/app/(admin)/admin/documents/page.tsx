import type { Metadata } from 'next';
import { AdminDocumentsView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Documents',
};

export default function AdminDocumentsPage() {
  return <AdminDocumentsView />;
}
