'use client';

// Formulaire de modification des informations d'un compte utilisateur
// (nom complet, e-mail, rôle, niveau). Le statut n'est pas modifiable ici.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, CardContent, Input, Select, useToast } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { updateUserInputSchema, type UpdateUserInput } from '@/contracts/admin';
import type { Level } from '@/contracts/catalog';
import { ApiClientError } from '@/lib/api-client/client';

export interface AdminUserEditFormProps {
  levels: Level[];
  initial: {
    fullName: string;
    email: string;
    role: 'student' | 'admin';
    levelId: string | null;
  };
  submitLabel: string;
  onSubmit: (input: UpdateUserInput) => Promise<void>;
  cancelHref: string;
}

type FieldErrors = Partial<Record<'fullName' | 'email', string>>;

export function AdminUserEditForm({
  levels,
  initial,
  submitLabel,
  onSubmit,
  cancelHref,
}: AdminUserEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const levelId = String(formData.get('levelId') ?? '');
    const parsed = updateUserInputSchema.safeParse({
      fullName: String(formData.get('fullName') ?? ''),
      email: String(formData.get('email') ?? ''),
      role: String(formData.get('role') ?? 'student'),
      levelId: levelId || null,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: errors.fullName?.[0],
        email: errors.email?.[0],
      });
      return;
    }

    try {
      await onSubmit(parsed.data);
      toast('Modifications enregistrées.');
      startTransition(() => router.push(cancelHref));
    } catch (error) {
      setGeneralError(
        error instanceof ApiClientError ? error.message : 'Une erreur est survenue. Veuillez réessayer.',
      );
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <FormField id="fullName" label="Nom complet" required error={fieldErrors.fullName}>
            <Input id="fullName" name="fullName" defaultValue={initial.fullName} autoComplete="off" />
          </FormField>

          <FormField id="email" label="Adresse e-mail" required error={fieldErrors.email}>
            <Input id="email" name="email" type="email" defaultValue={initial.email} autoComplete="off" />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="role" label="Rôle" required>
              <Select id="role" name="role" defaultValue={initial.role}>
                <option value="student">Étudiant</option>
                <option value="admin">Administrateur</option>
              </Select>
            </FormField>

            <FormField id="levelId" label="Niveau">
              <Select id="levelId" name="levelId" defaultValue={initial.levelId ?? ''}>
                <option value="">Non précisé</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.push(cancelHref)}>
              Annuler
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? 'Enregistrement…' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
