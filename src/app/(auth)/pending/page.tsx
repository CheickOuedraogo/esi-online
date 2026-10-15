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
          Vous serez prévenu(e) par e-mail dès que votre compte sera validé.
        </Alert>
        <Alert variant="info">
          Pour le moment, les e-mails ne sont pas envoyés automatiquement : un administrateur traite
          les validations manuellement, cela peut donc prendre un peu de temps. L&apos;envoi
          automatique arrivera plus tard.
        </Alert>
        <Link href="/" className={buttonClassName({ variant: 'secondary', fullWidth: true })}>
          Retour à l&apos;accueil
        </Link>
      </CardContent>
    </Card>
  );
}