import type { Metadata } from 'next';
import { ProposalsView } from '@/features/proposals';

export const metadata: Metadata = {
  title: 'Mes propositions',
};

export default function ProposalsPage() {
  return <ProposalsView />;
}
