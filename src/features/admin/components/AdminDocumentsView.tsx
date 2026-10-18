'use client';

// Gestion des documents publies : recherche, consultation et modification.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  buttonClassName,
} from '@/components/ui';
import type { Sort } from '@/contracts/common';
import type { DocumentStatus } from '@/contracts/documents';
import { listAdminDocuments } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { Pagination, SORT_OPTIONS } from '@/features/library';
import {
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_VARIANT,
  VISIBILITY_LABEL,
  VISIBILITY_VARIANT,
  formatCount,
} from '@/lib/labels';
import { AdminDocumentCreateForm } from './AdminDocumentCreateForm';

export function AdminDocumentsView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState<'' | 'public' | 'students'>('');
  const [status, setStatus] = useState<'' | DocumentStatus>('');
  const [sort, setSort] = useState<Sort>('recent');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const documents = useApiResource(
    () =>
      listAdminDocuments({
        q: q || undefined,
        visibility: visibility || undefined,
        status: status || undefined,
        page,
        pageSize: 10,
        sort,
      }),
    [q, visibility, status, page, sort],
  );

  const result = documents.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Consultez et gérez les documents publiés dans la bibliothèque."
        actions={
          <Button onClick={() => setCreating(true)}>Nouveau document</Button>
        }
      />

      <Card>
        <CardContent className="grid gap-3 py-5 sm:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px]">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un document…"
            aria-label="Recherche document"
          />
          <Select
            aria-label="Filtrer par visibilité"
            value={visibility}
            onChange={(event) => {
              setVisibility(event.target.value as '' | 'public' | 'students');
              setPage(1);
            }}
          >
            <option value="">Toutes les visibilités</option>
            <option value="public">Public</option>
            <option value="students">Étudiants</option>
          </Select>
          <Select
            aria-label="Filtrer par statut"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | DocumentStatus);
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
          </Select>
          <Select
            aria-label="Trier les documents"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as Sort);
              setPage(1);
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
              <table className="w-full min-w-[680px] text-sm">
                <caption className="sr-only">Liste des documents</caption>
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/60 text-left text-xs uppercase tracking-wide text-navy-500">
                    <th scope="col" className="px-4 py-3 font-semibold">Titre</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Statut</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Visibilité</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Téléchargements</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-navy-500">
                        Aucun document trouvé.
                      </td>
                    </tr>
                  )}
                  {result?.items.map((document) => (
                    <tr key={document.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-navy-900">{document.title}</p>
                        <p className="text-xs text-navy-500">{document.subject}</p>
                      </td>
                      <td className="px-4 py-3 text-navy-600">{document.typeName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={DOCUMENT_STATUS_VARIANT[document.status]}>
                          {DOCUMENT_STATUS_LABEL[document.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={VISIBILITY_VARIANT[document.visibility]}>
                          {VISIBILITY_LABEL[document.visibility]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-navy-500">
                        {formatCount(document.downloadCount, 'téléchargement')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/documents/${document.id}`}
                          className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                        >
                          Visualiser
                        </Link>
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

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouveau document"
      >
        {creating && (
          <AdminDocumentCreateForm
            onCreated={(id) => router.push(`/admin/documents/${id}`)}
            onCancel={() => setCreating(false)}
          />
        )}
      </Modal>
    </div>
  );
}
