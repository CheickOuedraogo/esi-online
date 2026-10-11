import type { Metadata } from 'next';
import { NewProposalForm } from '@/features/proposals';

export const metadata: Metadata = {
  title: 'Proposer un document',
};

export default function NewProposalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Proposer un document</h1>
        <p className="mt-1 text-sm text-navy-500">
          Votre proposition sera examinée par un administrateur avant publication.
        </p>
      </div>
      <NewProposalForm />
    </div>
  );
}
