'use client';

// Formulaire de connexion : valide les champs puis POST /api/auth/login
// et redirige selon le role, le statut et mustChangePassword.

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginInputSchema } from '@/contracts/auth';
import { ApiClientError } from '@/lib/api-client/client';
import { login } from '@/lib/api-client/auth';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, PasswordInput } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';

type FieldErrors = { email?: string; password?: string };

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = loginInputSchema.safeParse({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    if (!parsed.success) {
      setFieldErrors({
        email: parsed.error.flatten().fieldErrors.email?.[0],
        password: parsed.error.flatten().fieldErrors.password?.[0],
      });
      return;
    }

    try {
      const result = await login(parsed.data);
      startTransition(() => {
        if (result.mustChangePassword) {
          router.replace('/change-password');
        } else if (result.role === 'admin') {
          router.replace('/admin');
        } else if (result.status === 'pending' || result.status === 'rejected') {
          router.replace('/pending');
        } else {
          router.replace('/library');
        }
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'UNAUTHENTICATED') {
          setFieldErrors({
            email: 'E-mail ou mot de passe incorrect.',
            password: 'E-mail ou mot de passe incorrect.',
          });
        } else if (error.code === 'ACCOUNT_SUSPENDED') {
          setFieldErrors({ email: error.message });
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accédez à la bibliothèque numérique de l&apos;ESI.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <FormField id="email" label="Adresse e-mail" required error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="prenom.nom@gmail.com"
              hasError={Boolean(fieldErrors.email)}
            />
          </FormField>

          <FormField id="password" label="Mot de passe" required error={fieldErrors.password}>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              hasError={Boolean(fieldErrors.password)}
            />
          </FormField>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-navy-600 hover:text-navy-800"
            >
              Mot de passe oublié&nbsp;?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={isPending}>
            {isPending ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </CardContent>
      <div className="border-t border-navy-100 px-6 py-4 text-center text-sm text-navy-600">
        Pas encore de compte&nbsp;?{' '}
        <Link href="/register" className="font-semibold text-navy-700 hover:text-navy-900">
          Inscrivez-vous
        </Link>
      </div>
    </Card>
  );
}