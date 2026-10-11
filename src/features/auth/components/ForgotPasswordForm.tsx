'use client';

// Formulaire "mot de passe oublié" : enregistre la demande via
// POST /api/auth/request-reset. L'envoi des e-mails n'est pas automatise
// pour le moment : un administrateur traite les demandes manuellement.

import { useState } from 'react';
import Link from 'next/link';
import { requestResetInputSchema } from '@/contracts/auth';
import { ApiClientError } from '@/lib/api-client/client';
import { requestReset } from '@/lib/api-client/auth';
import {
  Alert,
  Button,
  buttonClassName,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import { FormField } from '@/components/forms/FormField';

const MANUAL_NOTE =
  "Pour le moment, les e-mails ne sont pas envoyés automatiquement : un administrateur traite chaque demande manuellement. Cela peut donc prendre un peu de temps. L'envoi automatique arrivera plus tard.";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setEmailError(undefined);

    const formData = new FormData(event.currentTarget);
    const parsed = requestResetInputSchema.safeParse({
      email: String(formData.get('email') ?? ''),
    });

    if (!parsed.success) {
      setEmailError(parsed.error.flatten().fieldErrors.email?.[0]);
      return;
    }

    setLoading(true);
    try {
      await requestReset(parsed.data);
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'RATE_LIMITED') {
          setGeneralError('Trop de demandes envoyées. Veuillez réessayer dans une heure.');
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demande envoyée</CardTitle>
          <CardDescription>
            Votre demande de réinitialisation a bien été enregistrée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            Si un compte existe pour cette adresse, un e-mail vous sera envoyé avec un mot de passe
            temporaire.
          </Alert>
          <Alert variant="info">{MANUAL_NOTE}</Alert>
          <Link
            href="/login"
            className={buttonClassName({ variant: 'secondary', fullWidth: true })}
          >
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Indiquez votre adresse e-mail : un administrateur vous enverra un mot de passe temporaire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Alert variant="info">{MANUAL_NOTE}</Alert>

          {generalError && <Alert variant="error">{generalError}</Alert>}

          <FormField id="email" label="Adresse e-mail" required error={emailError}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="prenom.nom@gmail.com"
              hasError={Boolean(emailError)}
            />
          </FormField>

          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Envoi de la demande…' : 'Envoyer la demande'}
          </Button>
        </form>
      </CardContent>
      <div className="border-t border-navy-100 px-6 py-4 text-center text-sm text-navy-600">
        <Link href="/login" className="font-semibold text-navy-700 hover:text-navy-900">
          Revenir à la connexion
        </Link>
      </div>
    </Card>
  );
}