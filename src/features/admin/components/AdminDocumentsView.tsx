'use client';

// Gestion des documents publies : recherche, consultation et modification.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EyeIcon,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Spinner,
} from '@/components/ui';
import type { DocumentItem } from '@/contracts/documents';
import { listAdminDocuments } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  VISIBILITY_LABEL,
  VISIBILITY_VARIANT,
  formatAcademicYear,
  formatDate,
  formatFileSize,
} from '@/lib/labels';
import { Pagination } from '@/features/library';

export function AdminDocumentsView() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DocumentItem | null>(null);

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
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                    <th className="px-4 py-3 font-semibold">Titre</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-navy-500">
                        Aucun document trouvé.
                      </td>
                    </tr>
                  )}
                  {result?.items.map((document) => (
                    <tr key={document.id} className="border-b border-navy-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-navy-900">{document.title}</td>
                      <td className="px-4 py-3 text-navy-600">{document.typeName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <IconButton
                            label={`Voir les détails de ${document.title}`}
                            onClick={() => setSelected(document)}
                          >
                            <EyeIcon />
                          </IconButton>
                          <Link
                            href={`/admin/documents/${document.id}/edit`}
                            className="inline-flex h-8 items-center rounded-lg border border-navy-200 bg-white px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
                          >
                            Modifier
                          </Link>
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

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Détails du document">
        {selected && (
          <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <h3 className="text-base font-semibold text-navy-900">{selected.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="gold">{selected.typeName}</Badge>
                <Badge variant={VISIBILITY_VARIANT[selected.visibility]}>
                  {VISIBILITY_LABEL[selected.visibility]}
                </Badge>
              </div>
            </div>

            {selected.description && (
              <p className="text-sm leading-relaxed text-navy-700">{selected.description}</p>
            )}

            <dl className="grid gap-x-6 gap-y-3 border-t border-navy-100 pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Matière</dt>
                <dd className="text-sm text-navy-900">{selected.subjectName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Niveau</dt>
                <dd className="text-sm text-navy-900">{selected.levelName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Année</dt>
                <dd className="text-sm text-navy-900">{formatAcademicYear(selected.academicYear)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Taille</dt>
                <dd className="text-sm text-navy-900">{formatFileSize(selected.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Téléchargements</dt>
                <dd className="text-sm text-navy-900">{selected.downloadCount}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Publié le</dt>
                <dd className="text-sm text-navy-900">
                  {selected.publishedAt ? formatDate(selected.publishedAt) : '—'}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap justify-end gap-2 border-t border-navy-100 pt-4">
              <Link
                href={`/admin/documents/${selected.id}`}
                className="inline-flex h-8 items-center rounded-lg border border-navy-200 bg-white px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
              >
                Ouvrir la fiche
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
