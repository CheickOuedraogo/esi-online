import type { Metadata } from 'next';
import { AdminDocumentDetailView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Document',
};

export default async function AdminDocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  return <AdminDocumentDetailView id={id} editing={edit === '1'} />;
}
