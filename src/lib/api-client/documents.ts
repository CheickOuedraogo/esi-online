// Fonctions d'appel a l'API documents (listes publique/etudiante, detail, telechargement).

import type { Paginated } from '@/contracts/common';
import type { DocumentItem, DocumentListQuery } from '@/contracts/documents';
import { apiDownload, apiFetch, buildQuery, type DownloadResult } from './client';

export type DocumentQueryParams = Partial<Omit<DocumentListQuery, 'sort'>> & {
  sort?: DocumentListQuery['sort'];
};

export function listDocuments(params: DocumentQueryParams = {}): Promise<Paginated<DocumentItem>> {
  return apiFetch<Paginated<DocumentItem>>(`/api/documents${buildQuery(params)}`);
}

export function listPublicDocuments(params: DocumentQueryParams = {}): Promise<Paginated<DocumentItem>> {
  return apiFetch<Paginated<DocumentItem>>(`/api/public/documents${buildQuery(params)}`);
}

export function getDocument(id: string): Promise<DocumentItem> {
  return apiFetch<DocumentItem>(`/api/documents/${id}`);
}

export function getPublicDocument(id: string): Promise<DocumentItem> {
  return apiFetch<DocumentItem>(`/api/public/documents/${id}`);
}

export function downloadDocument(id: string): Promise<DownloadResult> {
  return apiDownload(`/api/documents/${id}/download`);
}

export function documentFileUrl(id: string): string {
  return `/api/documents/${id}/file`;
}

export function downloadPublicDocument(id: string): Promise<DownloadResult> {
  return apiDownload(`/api/public/documents/${id}/download`);
}

export function publicDocumentFileUrl(id: string): string {
  return `/api/public/documents/${id}/file`;
}
