'use client';

// Formulaire d'inscription : nom, email, mot de passe et niveau.
// Charge le catalogue pour le niveau puis soumet POST /api/auth/register.

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerInputSchema } from '@/contracts/auth';
import type { CatalogResponse } from '@/contracts/catalog';
import { ApiClientError } from '@/lib/api-client/client';
import { register } from '@/lib/api-client/auth';
import { getCatalog } from '@/lib/api-client/catalog';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, PasswordInput, Select, Spinner } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  levelId?: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function loadCatalog() {
    let active = true;
    setCatalogError(null);
    getCatalog()
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCatalogError(
          error instanceof ApiClientError
            ? error.message
            : 'Impossible de charger la liste des niveaux.',
        );
      });
    return () => {
      active = false;
    };
  }

  useEffect(loadCatalog, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '');
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const levelId = String(formData.get('levelId') ?? '');

    const parsed = registerInputSchema.safeParse({
      fullName,
      email,
      password,
      levelId: levelId || '00000000-0000-4000-8000-000000000000',
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: fieldErrors.fullName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        levelId: levelId ? undefined : 'Le niveau est requis.',
      });
      return;
    }

    try {
      setSubmitting(true);
      await register(parsed.data);
      startTransition(() => router.replace('/pending'));
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'CONFLICT') {
          setFieldErrors({ email: error.message });
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Inscription</CardTitle>
        <CardDescription>Créez votre compte étudiant, puis attendez sa validation par un administrateur.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <FormField id="fullName" label="Nom complet" required error={fieldErrors.fullName}>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="Ex. Awa Traore"
              hasError={Boolean(fieldErrors.fullName)}
            />
          </FormField>

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

          <FormField
            id="password"
            label="Mot de passe"
            required
            error={fieldErrors.password}
            hint="8 caractères minimum."
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              hasError={Boolean(fieldErrors.password)}
            />
          </FormField>

          {catalog ? (
            <FormField id="levelId" label="Niveau" required error={fieldErrors.levelId}>
              <Select
                id="levelId"
                name="levelId"
                placeholder="Choisir un niveau"
                hasError={Boolean(fieldErrors.levelId)}
              >
                {catalog.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : (
            <div
              role={catalogError ? 'alert' : 'status'}
              className="flex items-center gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-600"
            >
              {catalogError ? (
                <>
                  <span className="flex-1">{catalogError}</span>
                  <Button type="button" variant="secondary" size="sm" onClick={loadCatalog}>
                    Réessayer
                  </Button>
                </>
              ) : (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Chargement des niveaux…</span>
                </>
              )}
            </div>
          )}

          <Button type="submit" fullWidth loading={submitting || isPending} disabled={!catalog}>
            {submitting || isPending ? 'Création du compte…' : "S'inscrire"}
          </Button>
        </form>
      </CardContent>
      <div className="border-t border-navy-100 px-6 py-4 text-center text-sm text-navy-600">
        Déjà inscrit&nbsp;?{' '}
        <Link href="/login" className="font-semibold text-navy-700 hover:text-navy-900">
          Connectez-vous
        </Link>
      </div>
    </Card>
  );
}