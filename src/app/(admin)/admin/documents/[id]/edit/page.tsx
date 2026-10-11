import type { Metadata } from 'next';
import { AdminDocumentEditView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Modifier le document',
};

export default async function AdminEditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminDocumentEditView id={id} />;
}
