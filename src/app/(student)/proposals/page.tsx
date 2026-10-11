import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Mes propositions',
};

export default function ProposalsPage() {
  return <UnderConstruction title="Mes propositions" />;
}