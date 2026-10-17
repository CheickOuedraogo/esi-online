// Fonctions d'appel a l'API catalogue (niveaux, types de documents).

import type {
  CatalogResponse,
  CreateDocumentTypeInput,
  CreateLevelInput,
  DocumentType,
  Level,
} from '@/contracts/catalog';
import { apiFetch } from './client';

export function getCatalog(): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>('/api/catalog');
}

// ── Niveaux ─────────────────────────────────────────────────────────────────

export function listLevels(): Promise<Level[]> {
  return apiFetch<Level[]>('/api/admin/levels');
}

export function createLevel(input: CreateLevelInput): Promise<Level> {
  return apiFetch<Level>('/api/admin/levels', { method: 'POST', body: input });
}

export function updateLevel(id: string, input: CreateLevelInput): Promise<Level> {
  return apiFetch<Level>(`/api/admin/levels/${id}`, { method: 'PATCH', body: input });
}

export function deleteLevel(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/levels/${id}`, { method: 'DELETE' });
}

// ── Types de documents ──────────────────────────────────────────────────────

export function listDocumentTypes(): Promise<DocumentType[]> {
  return apiFetch<DocumentType[]>('/api/admin/document-types');
}

export function createDocumentType(input: CreateDocumentTypeInput): Promise<DocumentType> {
  return apiFetch<DocumentType>('/api/admin/document-types', { method: 'POST', body: input });
}

export function updateDocumentType(
  id: string,
  input: CreateDocumentTypeInput,
): Promise<DocumentType> {
  return apiFetch<DocumentType>(`/api/admin/document-types/${id}`, { method: 'PATCH', body: input });
}

export function deleteDocumentType(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/document-types/${id}`, { method: 'DELETE' });
}
