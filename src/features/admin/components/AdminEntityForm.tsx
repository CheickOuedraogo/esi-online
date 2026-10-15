'use client';

// Formulaire generique de modification d'un document ou d'une proposition
// (titre, description, matiere, type, annee, visibilite). Pas de filiere : l'ESI n'en a qu'une.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, CardContent, Input, Select } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { adminContentInputSchema, type AdminContentInput } from '@/contracts/admin';
import type { CatalogResponse } from '@/contracts/catalog';
import { ApiClientError } from '@/lib/api-client/client';
import { ACADEMIC_YEAR_OPTIONS } from '@/features/library';

export interface AdminEntityFormProps {
  catalog: CatalogResponse;
  initial: {
    title: string;
    description: string;
    subjectId: string;
    typeId: string;
    academicYear: number | null;
    visibility: 'public' | 'students';
  };
  submitLabel: string;
  onSubmit: (input: AdminContentInput) => Promise<void>;
  cancelHref: string;
}

type FieldErrors = Partial<Record<'title' | 'subjectId' | 'typeId', string>>;

export function AdminEntityForm({ catalog, initial, submitLabel, onSubmit, cancelHref }: AdminEntityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = adminContentInputSchema.safeParse({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      subjectId: String(formData.get('subjectId') ?? ''),
      typeId: String(formData.get('typeId') ?? ''),
      academicYear: String(formData.get('academicYear') ?? '') || undefined,
      visibility: String(formData.get('visibility') ?? 'students'),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        title: errors.title?.[0],
        subjectId: errors.subjectId?.[0],
        typeId: errors.typeId?.[0],
      });
      return;
    }

    try {
      await onSubmit(parsed.data);
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

          <FormField id="title" label="Titre" required error={fieldErrors.title}>
            <Input id="title" name="title" defaultValue={initial.title} />
          </FormField>

          <FormField id="description" label="Description">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={initial.description}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-200"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="subjectId" label="Matière" required error={fieldErrors.subjectId}>
              <Select id="subjectId" name="subjectId" defaultValue={initial.subjectId}>
                <option value="" disabled>
                  Choisir une matière
                </option>
                {catalog.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="typeId" label="Type" required error={fieldErrors.typeId}>
              <Select id="typeId" name="typeId" defaultValue={initial.typeId}>
                <option value="" disabled>
                  Choisir un type
                </option>
                {catalog.documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="academicYear" label="Année académique">
              <Select id="academicYear" name="academicYear" defaultValue={initial.academicYear != null ? String(initial.academicYear) : ''}>
                <option value="">Non précisée</option>
                {ACADEMIC_YEAR_OPTIONS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="visibility" label="Visibilité" required>
              <Select id="visibility" name="visibility" defaultValue={initial.visibility}>
                <option value="students">Étudiants</option>
                <option value="public">Public</option>
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
