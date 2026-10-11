'use client';

// Gestion des documents publies : recherche, consultation et suppression.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, CardContent, Input, PageHeader, Spinner } from '@/components/ui';
import { ApiClientError } from '@/lib/api-client/client';
import { deleteDocument, listAdminDocuments } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  VISIBILITY_LABEL,
  VISIBILITY_VARIANT,
  formatDate,
  formatFileSize,
} from '@/lib/labels';
import { Pagination } from '@/features/library';

export function AdminDocumentsView() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const documents = useApiResource(
    () => listAdminDocuments({ q: q || undefined, page, pageSize: 10, sort: 'recent' }),
    [q, page],
  );

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await deleteDocument(id);
      documents.reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'La suppression a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  const result = documents.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Consultez et gérez les documents publiés dans la bibliothèque."
      />

      <Card>
        <CardContent className="py-5">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un document…"
            aria-label="Recherche document"
          />
        </CardContent>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {documents.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des documents" />
        </div>
      ) : documents.error ? (
        <Alert variant="error">{documents.error}</Alert>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                    <th className="px-4 py-3 font-semibold">Titre</th>
                    <th className="px-4 py-3 font-semibold">Matière</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Visibilité</th>
                    <th className="px-4 py-3 font-semibold">Téléch.</th>
                    <th className="px-4 py-3 font-semibold">Publié le</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-navy-500">
                        Aucun document trouvé.
                      </td>
                    </tr>
                  )}
                  {result?.items.map((document) => (
                    <tr key={document.id} className="border-b border-navy-50 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/documents/${document.id}`}
                          className="font-medium text-navy-900 hover:text-navy-600"
                        >
                          {document.title}
                        </Link>
                        <span className="block text-xs text-navy-400">
                          {formatFileSize(document.sizeBytes)} · {document.academicYear ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy-600">{document.subjectName}</td>
                      <td className="px-4 py-3 text-navy-600">{document.typeName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VISIBILITY_VARIANT[document.visibility]}>
                          {VISIBILITY_LABEL[document.visibility]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-navy-600">{document.downloadCount}</td>
                      <td className="px-4 py-3 text-navy-500">
                        {document.publishedAt ? formatDate(document.publishedAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/documents/${document.id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-navy-200 bg-white px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
                          >
                            Visualiser
                          </Link>
                          <Link
                            href={`/admin/documents/${document.id}/edit`}
                            className="inline-flex h-8 items-center rounded-lg border border-navy-200 bg-white px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
                          >
                            Modifier
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            disabled={busyId === document.id}
                            onClick={() => remove(document.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {result && (
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
