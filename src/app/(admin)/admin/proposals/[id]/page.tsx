import type { Metadata } from 'next';
import { AdminProposalDetailView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Proposition',
};

export default async function AdminProposalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  return <AdminProposalDetailView id={id} editing={edit === '1'} />;
}
