import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Compte en attente',
};

export default function PendingPage() {
  return (
    <UnderConstruction
      title="Compte en attente de validation"
      description="Un administrateur doit valider votre compte avant de pouvoir accéder à la bibliothèque."
    />
  );
}