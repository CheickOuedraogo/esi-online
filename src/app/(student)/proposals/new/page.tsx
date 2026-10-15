import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ProposalForm } from '@/features/proposals';

export const metadata: Metadata = {
  title: 'Proposer un document',
};

export default function NewProposalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposer un document"
        description="Votre proposition sera examinée par un administrateur avant publication."
      />
      <ProposalForm />
    </div>
  );
}
