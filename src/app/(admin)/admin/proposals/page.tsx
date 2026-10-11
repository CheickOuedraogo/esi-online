import type { Metadata } from 'next';
import { AdminProposalsView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Propositions',
};

export default function AdminProposalsPage() {
  return <AdminProposalsView />;
}
