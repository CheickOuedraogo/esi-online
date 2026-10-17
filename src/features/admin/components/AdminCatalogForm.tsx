'use client';

// Formulaire de création / modification d'un élément du catalogue
// (niveau ou type de document).

import { useState } from 'react';
import { Alert, Button, Input } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import {
  createDocumentTypeSchema,
  createLevelSchema,
} from '@/contracts/catalog';

export type CatalogKind = 'level' | 'documentType';

export interface CatalogFormValues {
  name: string;
}

interface AdminCatalogFormProps {
  kind: CatalogKind;
  initial?: { name: string };
  error: string | null;
  pending: boolean;
  submitLabel: string;
  onSubmit: (values: CatalogFormValues) => void;
  onCancel: () => void;
}

type FieldErrors = Partial<Record<'name', string>>;

const NAME_SCHEMAS = {
  level: createLevelSchema,
  documentType: createDocumentTypeSchema,
} as const;

export function AdminCatalogForm({
  kind,
  initial,
  error,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
}: AdminCatalogFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = NAME_SCHEMAS[kind].safeParse({ name });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as FieldErrors;
      setFieldErrors({ name: errors.name?.[0] });
      return;
    }

    onSubmit({ name: parsed.data.name });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
      {error && <Alert variant="error">{error}</Alert>}

      <FormField id="catalog-name" label="Nom" required error={fieldErrors.name}>
        <Input
          id="catalog-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          hasError={Boolean(fieldErrors.name)}
          autoFocus
        />
      </FormField>

      <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Annuler
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
