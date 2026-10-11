import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Documents publics',
};

export default function PublicDocumentsPage() {
  return <UnderConstruction title="Documents publics" />;
}