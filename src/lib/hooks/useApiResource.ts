'use client';

// Hook de chargement d'une ressource API : etat (donnees / erreur / chargement)
// et fonction de rechargement. Recharge a chaque changement de `deps`.

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api-client/client';
import type { ApiErrorCode } from '@/contracts/errors';

export interface ApiResource<T> {
  data: T | null;
  error: string | null;
  errorCode: ApiErrorCode | null;
  loading: boolean;
  reload: () => void;
}

export function useApiResource<T>(loader: () => Promise<T>, deps: unknown[] = []): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ApiErrorCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setErrorCode(null);

    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiClientError) {
          setError(err.message);
          setErrorCode(err.code);
        } else {
          setError('Une erreur inattendue est survenue.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [...deps, reloadKey]);

  return { data, error, errorCode, loading, reload };
}
