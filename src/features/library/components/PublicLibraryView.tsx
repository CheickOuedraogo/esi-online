'use client';

// Bibliothèque publique (accessible sans compte) : recherche, filtres et liste
// des documents publics approuvés.

import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, EmptyState, PageHeader, Spinner } from '@/components/ui';
import { getCatalog } from '@/lib/api-client/catalog';
import { listPublicDocuments } from '@/lib/api-client/documents';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { DocumentCard } from './DocumentCard';
import { DocumentFilters, EMPTY_FILTERS, type LibraryFilters } from './DocumentFilters';
import { Pagination } from './Pagination';
import { SearchBar } from './SearchBar';

export function PublicLibraryView() {
  const catalog = useApiResource(() => getCatalog(), []);
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((current) => ({ ...current, q: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const documents = useApiResource(
    () =>
      listPublicDocuments({
        q: filters.q || undefined,
        levelId: filters.levelId || undefined,
        typeId: filters.typeId || undefined,
        year: filters.year ? Number(filters.year) : undefined,
        sort: filters.sort,
        page: filters.page,
        pageSize: 12,
      }),
    [
      filters.q,
      filters.levelId,
      filters.typeId,
      filters.year,
      filters.sort,
      filters.page,
    ],
  );

  function update(patch: Partial<LibraryFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function reset() {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
  }

  const result = documents.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <PageHeader
        title="Bibliothèque publique"
        description="Les documents accessibles librement, sans compte."
      />

      <Card>
        <CardContent className="space-y-4 py-5">
          <SearchBar value={searchInput} onChange={setSearchInput} />
          {catalog.data && (
            <DocumentFilters catalog={catalog.data} value={filters} onChange={update} onReset={reset} />
          )}
        </CardContent>
      </Card>

      {documents.error && <Alert variant="error">{documents.error}</Alert>}

      {documents.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des documents" />
        </div>
      ) : result && result.items.length === 0 ? (
        <EmptyState
          title="Aucun document trouvé"
          description="Aucun document public ne correspond à votre recherche."
        />
      ) : result ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((document) => (
              <DocumentCard key={document.id} document={document} href={`/documents/${document.id}`} />
            ))}
          </div>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            onChange={(page) => update({ page })}
          />
        </>
      ) : null}
    </div>
  );
}
