import type { Metadata } from 'next';
import { AdminProposalDetailView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Proposition',
};

export default async function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProposalDetailView id={id} />;
}
