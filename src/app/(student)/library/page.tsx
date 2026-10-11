import type { Metadata } from 'next';
import { LibraryView } from '@/features/library';

export const metadata: Metadata = {
  title: 'Bibliothèque',
};

export default function LibraryPage() {
  return <LibraryView />;
}
