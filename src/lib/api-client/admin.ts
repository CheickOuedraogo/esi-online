// Fonctions d'appel a l'API d'administration (stats, utilisateurs, documents,
// propositions, demandes de reinitialisation).

import type {
  AdminContentInput,
  AdminStats,
  AdminUser,
  AdminUserListQuery,
  CreateUserInput,
  ResetPasswordInput,
  ResetRequest,
  ReviewProposalInput,
  UpdateUserInput,
  UpdateUserStatusInput,
} from '@/contracts/admin';
import type { Paginated } from '@/contracts/common';
import type { DocumentItem, DocumentListQuery } from '@/contracts/documents';
import type { CreateProposalInput, Proposal, ProposalFilters } from '@/contracts/proposals';
import { apiFetch, apiUpload, buildQuery } from './client';

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/api/admin/stats');
}

export function listAdminUsers(
  params: Partial<AdminUserListQuery> = {},
): Promise<Paginated<AdminUser>> {
  return apiFetch<Paginated<AdminUser>>(`/api/admin/users${buildQuery(params)}`);
}

export function createUser(input: CreateUserInput): Promise<AdminUser> {
  return apiFetch<AdminUser>('/api/admin/users', { method: 'POST', body: input });
}

export function getAdminUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}`);
}

export function updateUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: input });
}

export function updateUserStatus(id: string, input: UpdateUserStatusInput): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}/status`, { method: 'PATCH', body: input });
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/users/${id}`, { method: 'DELETE' });
}

export function listAdminDocuments(
  params: Partial<Omit<DocumentListQuery, 'sort'>> & { sort?: DocumentListQuery['sort'] } = {},
): Promise<Paginated<DocumentItem>> {
  return apiFetch<Paginated<DocumentItem>>(`/api/admin/documents${buildQuery(params)}`);
}

export function createDocument(input: AdminContentInput, file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', input.title);
  if (input.description) formData.append('description', input.description);
  formData.append('subject', input.subject);
  formData.append('typeId', input.typeId);
  if (input.levelId) formData.append('levelId', input.levelId);
  if (input.academicYear != null) formData.append('academicYear', String(input.academicYear));
  formData.append('visibility', input.visibility);
  return apiUpload<DocumentItem>('/api/admin/documents', formData);
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

export function listAdminProposals(
  params: Partial<ProposalFilters> = {},
): Promise<Paginated<Proposal>> {
  return apiFetch<Paginated<Proposal>>(`/api/admin/proposals${buildQuery(params)}`);
}

export function createAdminProposal(input: CreateProposalInput): Promise<Proposal> {
  return apiFetch<Proposal>('/api/admin/proposals', { method: 'POST', body: input });
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

export function completeResetRequest(id: string, input: ResetPasswordInput): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/reset-requests/${id}`, {
    method: 'PATCH',
    body: input,
  });
}
