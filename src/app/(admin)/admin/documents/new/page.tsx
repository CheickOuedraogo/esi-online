import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Nouveau document',
};

export default function AdminNewDocumentPage() {
  return <UnderConstruction title="Nouveau document" />;
}