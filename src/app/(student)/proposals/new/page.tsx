import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Nouvelle proposition',
};

export default function NewProposalPage() {
  return <UnderConstruction title="Nouvelle proposition" />;
}