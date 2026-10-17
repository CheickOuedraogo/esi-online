'use client';

// Favoris de documents, stockes uniquement dans le navigateur (localStorage).
// Un contexte partage l'etat entre toutes les cartes et fiches pour que les
// ajouts/retraits se refletent immediatement partout.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'esi-library:favorites:v1';

export interface FavoritesContextValue {
  ids: string[];
  count: number;
  ready: boolean;
  isFavorite: (documentId: string) => boolean;
  toggle: (documentId: string) => void;
  remove: (documentId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStored(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Stockage indisponible (mode prive, quota) : on ignore silencieusement.
    }
  }, [ids, ready]);

  // Synchronisation entre onglets ouverts.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setIds(readStored());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((documentId: string) => {
    setIds((current) =>
      current.includes(documentId)
        ? current.filter((value) => value !== documentId)
        : [documentId, ...current],
    );
  }, []);

  const remove = useCallback((documentId: string) => {
    setIds((current) => current.filter((value) => value !== documentId));
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      ready,
      isFavorite: (documentId: string) => ids.includes(documentId),
      toggle,
      remove,
    }),
    [ids, ready, toggle, remove],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites doit être utilisé à l’intérieur d’un FavoritesProvider.');
  }
  return context;
}
