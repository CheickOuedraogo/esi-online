// Client fetch type : URL de base, gestion des erreurs et deserialisation des reponses conformes aux contrats.

import { isApiErrorResponse, type ApiError, type ApiErrorCode } from '@/contracts/errors';

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, ...init } = options;

  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload: unknown = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    if (isApiErrorResponse(payload)) {
      throw new ApiClientError(payload.error, response.status);
    }
    throw new ApiClientError(
      { code: 'INTERNAL_ERROR', message: 'Une erreur inattendue est survenue.' },
      response.status,
    );
  }

  return payload as T;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface DownloadResult {
  blob: Blob;
  filename: string | null;
}

// Envoi multipart/form-data (upload de fichier). Le Content-Type est fixé par
// le navigateur pour inclure la frontière (boundary).
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: 'POST' | 'PATCH' | 'PUT' } = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    body: formData,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload: unknown = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    if (isApiErrorResponse(payload)) {
      throw new ApiClientError(payload.error, response.status);
    }
    throw new ApiClientError(
      { code: 'INTERNAL_ERROR', message: 'Une erreur inattendue est survenue.' },
      response.status,
    );
  }

  return payload as T;
}

export async function apiDownload(path: string): Promise<DownloadResult> {
  const response = await fetch(path, { credentials: 'same-origin', headers: { Accept: '*/*' } });

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
    const payload: unknown = isJson ? await response.json().catch(() => undefined) : undefined;
    if (isApiErrorResponse(payload)) {
      throw new ApiClientError(payload.error, response.status);
    }
    throw new ApiClientError(
      { code: 'INTERNAL_ERROR', message: 'Le téléchargement a échoué.' },
      response.status,
    );
  }

  const disposition = response.headers.get('content-disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/);
  return { blob: await response.blob(), filename: match?.[1] ?? null };
}
