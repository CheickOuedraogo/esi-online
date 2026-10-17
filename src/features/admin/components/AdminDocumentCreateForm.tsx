'use client';

// Formulaire de dépôt direct d'un document par l'administration (fichier + métadonnées).
// Conçu pour être affiché dans une fenêtre modale.

import { useState } from 'react';
import { Alert, Button, Input, Select, Spinner, Textarea, useToast } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { adminContentInputSchema } from '@/contracts/admin';
import { ApiClientError } from '@/lib/api-client/client';
import { createDocument } from '@/lib/api-client/admin';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { ACADEMIC_YEAR_OPTIONS } from '@/features/library';

const ACCEPTED_FORMATS = '.pdf,.docx,.pptx,.jpg,.jpeg,.png,.zip';
const MAX_UPLOAD_MB = 50;

type FieldErrors = Partial<
  Record<'title' | 'subject' | 'typeId' | 'description' | 'file', string>
>;

interface AdminDocumentCreateFormProps {
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

export function AdminDocumentCreateForm({ onCreated, onCancel }: AdminDocumentCreateFormProps) {
  const { toast } = useToast();
  const catalog = useApiResource(() => getCatalog(), []);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (!file) {
      setFieldErrors({ file: 'Veuillez sélectionner un fichier.' });
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setFieldErrors({ file: `Le fichier dépasse la taille maximale de ${MAX_UPLOAD_MB} Mo.` });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const levelId = String(formData.get('levelId') ?? '');
    const parsed = adminContentInputSchema.safeParse({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      subject: String(formData.get('subject') ?? ''),
      typeId: String(formData.get('typeId') ?? ''),
      levelId: levelId || null,
      academicYear: String(formData.get('academicYear') ?? '') || undefined,
      visibility: String(formData.get('visibility') ?? 'students'),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        title: errors.title?.[0],
        subject: errors.subject?.[0],
        typeId: errors.typeId?.[0],
        description: errors.description?.[0],
      });
      return;
    }

    setBusy(true);
    try {
      const document = await createDocument(parsed.data, file);
      toast('Document ajouté.');
      onCreated?.(document.id);
    } catch (error) {
      setGeneralError(
        error instanceof ApiClientError
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.',
      );
      setBusy(false);
    }
  }

  if (catalog.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du catalogue" />
      </div>
    );
  }

  if (catalog.error || !catalog.data) {
    return <Alert variant="error">{catalog.error ?? 'Impossible de charger le catalogue.'}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
      <p className="text-sm text-navy-500">
        Déposez un document directement dans la bibliothèque. Il sera publié immédiatement.
      </p>

      {generalError && <Alert variant="error">{generalError}</Alert>}

      <FormField
        id="file"
        label="Fichier"
        required
        error={fieldErrors.file}
        hint={`Formats acceptés : PDF, DOCX, PPTX, JPG, PNG, ZIP — ${MAX_UPLOAD_MB} Mo maximum.`}
      >
        <Input
          id="file"
          name="file"
          type="file"
          accept={ACCEPTED_FORMATS}
          hasError={Boolean(fieldErrors.file)}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </FormField>

      <FormField id="title" label="Titre" required error={fieldErrors.title}>
        <Input id="title" name="title" />
      </FormField>

      <FormField id="description" label="Description" error={fieldErrors.description}>
        <Textarea id="description" name="description" rows={3} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="subject" label="Matière" required error={fieldErrors.subject}>
          <Input id="subject" name="subject" />
        </FormField>

        <FormField id="typeId" label="Type" required error={fieldErrors.typeId}>
          <Select id="typeId" name="typeId" defaultValue="">
            <option value="" disabled>
              Choisir un type
            </option>
            {catalog.data.documentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="levelId" label="Niveau">
          <Select id="levelId" name="levelId" defaultValue="">
            <option value="">Non précisé</option>
            {catalog.data.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="academicYear" label="Année académique">
          <Select id="academicYear" name="academicYear" defaultValue="">
            <option value="">Non précisée</option>
            {ACADEMIC_YEAR_OPTIONS.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="visibility" label="Visibilité" required>
          <Select id="visibility" name="visibility" defaultValue="students">
            <option value="students">Étudiants</option>
            <option value="public">Public</option>
          </Select>
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-navy-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Annuler
        </Button>
        <Button type="submit" loading={busy}>
          {busy ? 'Envoi…' : 'Ajouter le document'}
        </Button>
      </div>
    </form>
  );
}
