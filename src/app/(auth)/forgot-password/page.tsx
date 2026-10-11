import type { Metadata } from 'next';
import { UnderConstruction } from '@/components/layout/UnderConstruction';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
};

export default function ForgotPasswordPage() {
  return (
    <UnderConstruction
      title="Mot de passe oublié"
      description="La réinitialisation via un administrateur arrivera prochainement."
    />
  );
}