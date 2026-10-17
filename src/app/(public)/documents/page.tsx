import type { Metadata } from 'next';
import { PublicLibraryView } from '@/features/library';

export const metadata: Metadata = {
  title: 'Documents publics',
};

export default function PublicDocumentsPage() {
  return <PublicLibraryView />;
}
