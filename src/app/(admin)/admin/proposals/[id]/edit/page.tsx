import type { Metadata } from 'next';
import { AdminProposalEditView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Modifier la proposition',
};

export default async function AdminEditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProposalEditView id={id} />;
}
