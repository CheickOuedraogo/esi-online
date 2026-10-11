import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Documents',
};

export default function AdminDocumentsPage() {
  return <UnderConstruction title="Gestion des documents" />;
}