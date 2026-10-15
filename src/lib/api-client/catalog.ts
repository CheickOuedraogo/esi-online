// Fonctions d'appel a l'API catalogue (niveaux, filieres, matieres, types).

import type {
  CatalogResponse,
  CreateDocumentTypeInput,
  CreateLevelInput,
  CreateSubjectInput,
  DocumentType,
  Level,
  Subject,
} from '@/contracts/catalog';
import { apiFetch } from './client';

export function getCatalog(): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>('/api/catalog');
}

export function createLevel(input: CreateLevelInput): Promise<Level> {
  return apiFetch<Level>('/api/admin/levels', { method: 'POST', body: input });
}

export function createDocumentType(input: CreateDocumentTypeInput): Promise<DocumentType> {
  return apiFetch<DocumentType>('/api/admin/document-types', { method: 'POST', body: input });
}

export function createSubject(input: CreateSubjectInput): Promise<Subject> {
  return apiFetch<Subject>('/api/admin/subjects', { method: 'POST', body: input });
}
