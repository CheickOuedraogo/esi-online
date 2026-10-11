// Fonctions d'appel a l'API d'administration (stats, utilisateurs, documents,
// propositions, demandes de reinitialisation).

import type {
  AdminContentInput,
  AdminStats,
  AdminUser,
  AdminUserListQuery,
  ResetRequest,
  ReviewProposalInput,
  UpdateUserStatusInput,
} from '@/contracts/admin';
import type { Paginated } from '@/contracts/common';
import type { DocumentItem, DocumentListQuery } from '@/contracts/documents';
import type { Proposal } from '@/contracts/proposals';
import { apiFetch, buildQuery } from './client';

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/api/admin/stats');
}

export function listAdminUsers(params: Partial<AdminUserListQuery> = {}): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>(`/api/admin/users${buildQuery(params)}`);
}

export function updateUserStatus(id: string, input: UpdateUserStatusInput): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}/status`, { method: 'PATCH', body: input });
}

export function resetUserPassword(id: string): Promise<{ id: string; temporaryPassword: string }> {
  return apiFetch<{ id: string; temporaryPassword: string }>(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/users/${id}`, { method: 'DELETE' });
}

export function listAdminDocuments(
  params: Partial<Omit<DocumentListQuery, 'sort'>> & { sort?: DocumentListQuery['sort'] } = {},
): Promise<Paginated<DocumentItem>> {
  return apiFetch<Paginated<DocumentItem>>(`/api/admin/documents${buildQuery(params)}`);
}

export function deleteDocument(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/documents/${id}`, { method: 'DELETE' });
}

export function getAdminDocument(id: string): Promise<DocumentItem> {
  return apiFetch<DocumentItem>(`/api/admin/documents/${id}`);
}

export function updateAdminDocument(id: string, input: AdminContentInput): Promise<DocumentItem> {
  return apiFetch<DocumentItem>(`/api/admin/documents/${id}`, { method: 'PATCH', body: input });
}

export function listAdminProposals(): Promise<Proposal[]> {
  return apiFetch<Proposal[]>('/api/admin/proposals');
}

export function getAdminProposal(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/api/admin/proposals/${id}`);
}

export function updateAdminProposal(id: string, input: AdminContentInput): Promise<Proposal> {
  return apiFetch<Proposal>(`/api/admin/proposals/${id}`, { method: 'PATCH', body: input });
}

export function deleteAdminProposal(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/proposals/${id}`, { method: 'DELETE' });
}

export function adminProposalFileUrl(id: string): string {
  return `/api/admin/proposals/${id}/file`;
}

export function reviewProposal(id: string, input: ReviewProposalInput): Promise<unknown> {
  return apiFetch<unknown>(`/api/admin/proposals/${id}`, { method: 'PATCH', body: input });
}

export function listResetRequests(): Promise<ResetRequest[]> {
  return apiFetch<ResetRequest[]>('/api/admin/reset-requests');
}

export function completeResetRequest(id: string): Promise<{ id: string; temporaryPassword: string }> {
  return apiFetch<{ id: string; temporaryPassword: string }>(`/api/admin/reset-requests/${id}`, {
    method: 'PATCH',
  });
}
