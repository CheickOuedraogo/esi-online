import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Bibliothèque',
};

export default function LibraryPage() {
  return <UnderConstruction title="Bibliothèque" description="La liste des documents arrivera prochainement." />;
}