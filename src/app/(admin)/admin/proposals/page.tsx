import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Propositions',
};

export default function AdminProposalsPage() {
  return <UnderConstruction title="Modération des propositions" />;
}