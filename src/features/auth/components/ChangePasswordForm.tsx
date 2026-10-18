'use client';

// Formulaire de changement de mot de passe (obligatoire après réinitialisation).

import { useState } from 'react';
import Link from 'next/link';
import { changePasswordInputSchema } from '@/contracts/auth';
import { ApiClientError } from '@/lib/api-client/client';
import { changePassword } from '@/lib/api-client/auth';
import {
  Alert,
  Button,
  buttonClassName,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PasswordInput,
} from '@/components/ui';
import { FormField } from '@/components/forms/FormField';

type FieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    const parsed = changePasswordInputSchema.safeParse({
      currentPassword,
      newPassword,
    });

    const errors: FieldErrors = {};

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      if (flattened.currentPassword?.[0]) errors.currentPassword = flattened.currentPassword[0];
      if (flattened.newPassword?.[0]) errors.newPassword = flattened.newPassword[0];
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    } else if (!confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer le nouveau mot de passe.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          setGeneralError(error.message || 'Le mot de passe actuel est incorrect.');
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError('Une erreur est survenue lors du changement de mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h1">Mot de passe modifié</CardTitle>
          <CardDescription>
            Votre mot de passe a été mis à jour avec succès. Vos sessions précédentes ont été invalidées par sécurité.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            Vous pouvez maintenant vous reconnecter avec votre nouveau mot de passe.
          </Alert>
          <Link
            href="/login"
            className={buttonClassName({ variant: 'primary', fullWidth: true })}
          >
            Se connecter
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Changer le mot de passe</CardTitle>
        <CardDescription>
          Veuillez définir un nouveau mot de passe personnel pour sécuriser votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <FormField
            id="currentPassword"
            label="Mot de passe actuel ou temporaire"
            required
            error={fieldErrors.currentPassword}
          >
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              placeholder="••••••••"
              hasError={Boolean(fieldErrors.currentPassword)}
            />
          </FormField>

          <FormField
            id="newPassword"
            label="Nouveau mot de passe"
            required
            error={fieldErrors.newPassword}
            hint="8 caractères minimum."
          >
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              hasError={Boolean(fieldErrors.newPassword)}
            />
          </FormField>

          <FormField
            id="confirmPassword"
            label="Confirmer le nouveau mot de passe"
            required
            error={fieldErrors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              hasError={Boolean(fieldErrors.confirmPassword)}
            />
          </FormField>

          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Modification en cours…' : 'Enregistrer le nouveau mot de passe'}
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
