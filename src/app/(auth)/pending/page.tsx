import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, buttonClassName, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Compte en attente',
};

export default function PendingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Compte en attente de validation</CardTitle>
        <CardDescription>
          Votre inscription a bien été enregistrée. Un administrateur doit valider votre compte
          avant que vous puissiez accéder à la bibliothèque.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="info">
          Les validations de comptes sont traitées manuellement par l’équipe d’administration de l’ESI.
          Une fois votre inscription validée, vous pourrez vous connecter pour accéder à l’ensemble des ressources privées et proposer vos documents.
        </Alert>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/documents" className={buttonClassName({ variant: 'primary', fullWidth: true })}>
            Consulter les documents en libre accès
          </Link>
          <Link href="/" className={buttonClassName({ variant: 'secondary', fullWidth: true })}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}