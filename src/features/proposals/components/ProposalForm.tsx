'use client';

// Formulaire de proposition : creation ou modification (re-soumission).

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, CardContent, Input, Select, Spinner, Textarea, useToast } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { createProposalInputSchema, type Proposal } from '@/contracts/proposals';
import { ApiClientError } from '@/lib/api-client/client';
import { createProposal, updateProposal } from '@/lib/api-client/proposals';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { ACADEMIC_YEAR_OPTIONS } from '@/features/library';

type FieldErrors = Partial<Record<'title' | 'subjectId' | 'typeId' | 'file', string>>;

export function ProposalForm({ proposal }: { proposal?: Proposal }) {
  const router = useRouter();
  const { toast } = useToast();
  const catalog = useApiResource(() => getCatalog(), []);
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const editMode = Boolean(proposal);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const file = fileRef.current?.files?.[0];
    const parsed = createProposalInputSchema.safeParse({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      subjectId: String(formData.get('subjectId') ?? ''),
      typeId: String(formData.get('typeId') ?? ''),
      academicYear: formData.get('academicYear')
        ? Number(formData.get('academicYear'))
        : undefined,
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

    if (!editMode && !file) {
      setFieldErrors({ file: 'Le fichier est requis.' });
      return;
    }

    try {
      if (proposal) {
        await updateProposal(proposal.id, parsed.data, file);
        toast('Proposition mise à jour.');
        startTransition(() => router.push(`/proposals/${proposal.id}`));
      } else {
        await createProposal(parsed.data, file as File);
        toast('Proposition envoyée. Elle sera examinée par un administrateur.');
        startTransition(() => router.push('/proposals'));
      }
    } catch (error) {
      setGeneralError(
        error instanceof ApiClientError ? error.message : 'Une erreur est survenue. Veuillez réessayer.',
      );
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <FormField id="title" label="Titre du document" required error={fieldErrors.title}>
            <Input
              id="title"
              name="title"
              defaultValue={proposal?.title}
              placeholder="Ex. Algorithmique — Fiche de révision"
            />
          </FormField>

          <FormField id="description" label="Description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={proposal?.description ?? ''}
              placeholder="Décrivez brièvement le contenu du document…"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="subjectId" label="Matière" required error={fieldErrors.subjectId}>
              {catalog.loading ? (
                <Spinner className="text-navy-400" />
              ) : (
                <Select id="subjectId" name="subjectId" defaultValue={proposal?.subjectId ?? ''}>
                  <option value="" disabled>
                    Choisir une matière
                  </option>
                  {catalog.data?.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>

            <FormField id="typeId" label="Type de document" required error={fieldErrors.typeId}>
              <Select id="typeId" name="typeId" defaultValue={proposal?.typeId ?? ''}>
                <option value="" disabled>
                  Choisir un type
                </option>
                {catalog.data?.documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField id="academicYear" label="Année académique">
            <Select id="academicYear" name="academicYear" defaultValue={proposal?.academicYear != null ? String(proposal.academicYear) : ''}>
              <option value="">Non précisée</option>
              {ACADEMIC_YEAR_OPTIONS.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            id="file"
            label={editMode ? 'Remplacer le fichier (facultatif)' : 'Fichier'}
            required={!editMode}
            error={fieldErrors.file}
            hint={
              editMode
                ? `Fichier actuel : ${proposal?.originalFilename}. Laissez vide pour le conserver.`
                : 'Formats acceptés : PDF, DOC, DOCX.'
            }
          >
            <input
              id="file"
              name="file"
              type="file"
              ref={fileRef}
              accept=".pdf,.doc,.docx,application/pdf"
              className="block w-full text-sm text-navy-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-100"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending
                ? 'Envoi…'
                : editMode
                  ? 'Enregistrer et resoumettre'
                  : 'Envoyer la proposition'}
            </Button>
          </div>

          {editMode && (
            <p className="text-xs text-navy-400">
              En enregistrant, votre proposition repasse en attente de validation et le délai de
              conservation du fichier (3 jours) est réinitialisé.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
