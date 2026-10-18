'use client';

// Vue principale de la bibliotheque etudiante : recherche, filtres, favoris locaux
// et liste de documents.

import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, EmptyState, PageHeader, Spinner } from '@/components/ui';
import { getCatalog } from '@/lib/api-client/catalog';
import { getDocument, listDocuments } from '@/lib/api-client/documents';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { useFavorites } from '@/features/favorites';
import { cn } from '@/lib/utils';
import { DocumentCard } from './DocumentCard';
import { DocumentFilters, EMPTY_FILTERS, type LibraryFilters } from './DocumentFilters';
import { Pagination } from './Pagination';
import { SearchBar } from './SearchBar';

export function LibraryView() {
  const catalog = useApiResource(() => getCatalog(), []);
  const favorites = useFavorites();
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((current) => ({ ...current, q: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const documents = useApiResource(
    () =>
      listDocuments({
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

  // Favoris : charge chaque document par identifiant (liste locale, pas de pagination).
  const favoriteKey = favorites.ids.join(',');
  const favoriteDocs = useApiResource(
    () =>
      favoritesOnly
        ? Promise.allSettled(favorites.ids.map((favoriteId) => getDocument(favoriteId))).then((results) =>
            results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
          )
        : Promise.resolve([]),
    [favoritesOnly, favoriteKey],
  );

  function update(patch: Partial<LibraryFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function reset() {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
  }

  const result = documents.data;
  const query = filters.q.trim().toLowerCase();
  const favoriteItems = (favoriteDocs.data ?? []).filter(
    (document) =>
      !query ||
      [document.title, document.subject, document.typeName].some((value) =>
        value.toLowerCase().includes(query),
      ),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bibliothèque"
        description="Recherchez et téléchargez les documents validés de l’ESI."
      />

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchBar value={searchInput} onChange={setSearchInput} />
            </div>
            <button
              type="button"
              onClick={() => setFavoritesOnly((current) => !current)}
              aria-pressed={favoritesOnly}
              title="Favoris enregistrés sur ce navigateur"
              className={cn(
                'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-medium transition-colors',
                favoritesOnly
                  ? 'border-gold-300 bg-gold-50 text-gold-700'
                  : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50',
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill={favoritesOnly ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.87l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z" />
              </svg>
              Favoris{favorites.count > 0 ? ` (${favorites.count})` : ''}
            </button>
          </div>

          {!favoritesOnly && catalog.data && (
            <DocumentFilters catalog={catalog.data} value={filters} onChange={update} onReset={reset} />
          )}
        </CardContent>
      </Card>

      {favoritesOnly ? (
        favoriteDocs.loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7 text-navy-400" label="Chargement des favoris" />
          </div>
        ) : favoriteItems.length === 0 ? (
          <EmptyState
            title="Aucun favori"
            description={
              favorites.count === 0
                ? 'Ajoutez des documents en favoris grâce à l’étoile sur chaque carte (enregistrés localement sur cet appareil).'
                : 'Aucun favori ne correspond à votre recherche.'
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteItems.map((document) => (
              <DocumentCard key={document.id} document={document} favorite />
            ))}
          </div>
        )
      ) : (
        <>
          {documents.error && <Alert variant="error">{documents.error}</Alert>}

          {documents.loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-7 w-7 text-navy-400" label="Chargement des documents" />
            </div>
          ) : result && result.items.length === 0 ? (
            <EmptyState
              title="Aucun document trouvé"
              description="Essayez de modifier votre recherche ou de réinitialiser les filtres."
            />
          ) : result ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((document) => (
                  <DocumentCard key={document.id} document={document} favorite />
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
        </>
      )}
    </div>
  );
}
