import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Catalogue',
};

export default function AdminCatalogPage() {
  return <UnderConstruction title="Gestion du catalogue" />;
}