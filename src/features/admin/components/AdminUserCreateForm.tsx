'use client';

// Création directe d'un compte utilisateur par l'administration.

import { useState } from 'react';
import { Alert, Button, Input, PasswordInput, Select } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { createUserInputSchema, type AdminUser } from '@/contracts/admin';
import type { Level } from '@/contracts/catalog';
import { ApiClientError } from '@/lib/api-client/client';
import { createUser } from '@/lib/api-client/admin';

interface AdminUserCreateFormProps {
  levels: Level[];
  onCreated: (user: AdminUser) => void;
  onCancel: () => void;
}

type FieldErrors = Partial<Record<'fullName' | 'email' | 'password', string>>;

export function AdminUserCreateForm({
  levels,
  onCreated,
  onCancel,
}: AdminUserCreateFormProps) {
  const [busy, setBusy] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = createUserInputSchema.safeParse({
      fullName: String(formData.get('fullName') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? '') || undefined,
      role: String(formData.get('role') ?? 'student'),
      levelId: String(formData.get('levelId') ?? '') || null,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: errors.fullName?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setBusy(true);
    try {
      const user = await createUser(parsed.data);
      onCreated(user);
    } catch (error) {
      setGeneralError(
        error instanceof ApiClientError
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.',
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
      {generalError && <Alert variant="error">{generalError}</Alert>}

      <FormField id="new-fullName" label="Nom complet" required error={fieldErrors.fullName}>
        <Input id="new-fullName" name="fullName" autoComplete="off" autoFocus />
      </FormField>

      <FormField id="new-email" label="E-mail" required error={fieldErrors.email}>
        <Input id="new-email" name="email" type="email" autoComplete="off" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="new-role" label="Rôle" required>
          <Select id="new-role" name="role" defaultValue="student">
            <option value="student">Étudiant</option>
            <option value="admin">Administrateur</option>
          </Select>
        </FormField>

        <FormField id="new-level" label="Niveau">
          <Select id="new-level" name="levelId" defaultValue="">
            <option value="">Non précisé</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        id="new-password"
        label="Mot de passe"
        error={fieldErrors.password}
        hint="Laissez vide pour générer un mot de passe temporaire que l’utilisateur devra changer."
      >
        <PasswordInput id="new-password" name="password" autoComplete="new-password" />
      </FormField>

      <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Annuler
        </Button>
        <Button type="submit" loading={busy}>
          Créer le compte
        </Button>
      </div>
    </form>
  );
}
