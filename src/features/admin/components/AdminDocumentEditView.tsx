'use client';

// Modification d'un document par l'administration.

import Link from 'next/link';
import { Alert, Spinner } from '@/components/ui';
import { getAdminDocument, updateAdminDocument } from '@/lib/api-client/admin';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { AdminEntityForm } from './AdminEntityForm';

export function AdminDocumentEditView({ id }: { id: string }) {
  const document = useApiResource(() => getAdminDocument(id), [id]);
  const catalog = useApiResource(() => getCatalog(), []);

  if (document.loading || catalog.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du document" />
      </div>
    );
  }

  if (document.error || !document.data || catalog.error || !catalog.data) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{document.error ?? catalog.error ?? 'Document introuvable.'}</Alert>
        <Link href="/admin/documents" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux documents
        </Link>
      </div>
    );
  }

  const item = document.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Modifier le document</h1>
        <p className="mt-1 text-sm text-navy-500">Mettez à jour les informations du document publié.</p>
      </div>
      <AdminEntityForm
        catalog={catalog.data}
        initial={{
          title: item.title,
          description: item.description ?? '',
          subjectId: item.subjectId,
          typeId: item.typeId,
          academicYear: item.academicYear ?? '',
          visibility: item.visibility,
        }}
        submitLabel="Enregistrer"
        cancelHref={`/admin/documents/${id}`}
        onSubmit={(input) => updateAdminDocument(id, input).then(() => undefined)}
      />
    </div>
  );
}
