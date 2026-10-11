import type { Metadata } from 'next';
import { AdminCatalogView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Catalogue',
};

export default function AdminCatalogPage() {
  return <AdminCatalogView />;
}
