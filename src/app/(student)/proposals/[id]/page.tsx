import type { Metadata } from 'next';
import { ProposalDetailView } from '@/features/proposals';

export const metadata: Metadata = {
  title: 'Ma proposition',
};

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProposalDetailView id={id} />;
}
