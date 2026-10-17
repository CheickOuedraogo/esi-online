'use client';

// Consultation d'un document par l'administration : apercu, modification et suppression.
// Le mode édition (`editing`) affiche le formulaire de métadonnées directement sur la fiche.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, CardContent, PageHeader, Spinner } from '@/components/ui';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { ApiClientError } from '@/lib/api-client/client';
import { deleteDocument, getAdminDocument, updateAdminDocument } from '@/lib/api-client/admin';
import { getCatalog } from '@/lib/api-client/catalog';
import { documentFileUrl } from '@/lib/api-client/documents';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { VISIBILITY_LABEL, VISIBILITY_VARIANT, formatAcademicYear, formatDate, formatFileSize } from '@/lib/labels';
import { AdminEntityForm } from './AdminEntityForm';

export function AdminDocumentDetailView({ id, editing = false }: { id: string; editing?: boolean }) {
  const router = useRouter();
  const document = useApiResource(() => getAdminDocument(id), [id]);
  const catalog = useApiResource(() => getCatalog(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm('Supprimer définitivement ce document ?')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDocument(id);
      router.push('/admin/documents');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'La suppression a échoué.');
      setBusy(false);
    }
  }

  if (document.loading || (editing && catalog.loading)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du document" />
      </div>
    );
  }

  if (document.error || !document.data || (editing && (catalog.error || !catalog.data))) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          {document.error ?? catalog.error ?? 'Document introuvable.'}
        </Alert>
        <Link href="/admin/documents" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux documents
        </Link>
      </div>
    );
  }

  const item = document.data;

  if (editing && catalog.data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/documents" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux documents
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Modifier le document</h1>
          <p className="mt-1 text-sm text-navy-500">Mettez à jour les informations du document publié.</p>
        </div>

        <AdminEntityForm
          catalog={catalog.data}
          initial={{
            title: item.title,
            description: item.description ?? '',
            subject: item.subject,
            typeId: item.typeId,
            levelId: item.levelId,
            academicYear: item.academicYear ?? null,
            visibility: item.visibility,
          }}
          submitLabel="Enregistrer"
          cancelHref={`/admin/documents/${id}`}
          onSubmit={(input) => updateAdminDocument(id, input).then(() => undefined)}
        />
      </div>
    );
  }

  const metadata = [
    { label: 'Matière', value: item.subject },
    { label: 'Niveau', value: item.levelName ?? '—' },
    { label: 'Type', value: item.typeName },
    { label: 'Année', value: formatAcademicYear(item.academicYear) },
    { label: 'Taille', value: formatFileSize(item.sizeBytes) },
    { label: 'Téléchargements', value: String(item.downloadCount) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/documents" className="text-sm font-medium text-navy-600 hover:text-navy-900">
        ← Retour aux documents
      </Link>

      <PageHeader
        title={item.title}
        description={`Publié ${item.publishedAt ? `le ${formatDate(item.publishedAt)}` : '—'} par ${item.uploaderName ?? 'l’administration'}`}
        actions={
          <>
            <Badge variant="gold">{item.typeName}</Badge>
            <Badge variant={VISIBILITY_VARIANT[item.visibility]}>
              {VISIBILITY_LABEL[item.visibility]}
            </Badge>
            <Link
              href={`/admin/documents/${item.id}?edit=1`}
              className="inline-flex h-10 items-center rounded-lg bg-navy-700 px-4 text-sm font-medium text-cream transition-colors hover:bg-navy-800"
            >
              Modifier
            </Link>
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              loading={busy}
              onClick={remove}
            >
              Supprimer
            </Button>
          </>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardContent className="space-y-5 py-6">
          {item.description && <p className="text-sm leading-relaxed text-navy-700">{item.description}</p>}
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {metadata.map((entry) => (
              <div key={entry.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                  {entry.label}
                </dt>
                <dd className="mt-1 text-sm text-navy-800">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Aperçu</h2>
        <DocumentPreview url={documentFileUrl(item.id)} filename={item.originalFilename} />
      </div>
    </div>
  );
}
