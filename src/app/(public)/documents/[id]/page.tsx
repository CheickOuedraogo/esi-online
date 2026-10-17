import type { Metadata } from 'next';
import { PublicDocumentDetailView } from '@/features/library';

export const metadata: Metadata = {
  title: 'Document',
};

export default async function PublicDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicDocumentDetailView id={id} />;
}
