import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Demandes de réinitialisation',
};

export default function AdminResetRequestsPage() {
  return <UnderConstruction title="Demandes de réinitialisation" />;
}