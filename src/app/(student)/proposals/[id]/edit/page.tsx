import type { Metadata } from 'next';
import { EditProposalView } from '@/features/proposals';

export const metadata: Metadata = {
  title: 'Modifier la proposition',
};

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProposalView id={id} />;
}
