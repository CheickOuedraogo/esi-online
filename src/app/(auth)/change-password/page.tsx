import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Changer le mot de passe',
};

export default function ChangePasswordPage() {
  return (
    <UnderConstruction
      title="Changer le mot de passe"
      description="Le changement de votre mot de passe temporaire arrivera prochainement."
    />
  );
}