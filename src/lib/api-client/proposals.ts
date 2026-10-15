// Fonctions d'appel a l'API des propositions etudiantes.

import type { CreateProposalInput, Proposal, UpdateProposalInput } from '@/contracts/proposals';
import { apiFetch, apiUpload } from './client';

export function listMyProposals(): Promise<Proposal[]> {
  return apiFetch<Proposal[]>('/api/me/proposals');
}

export function getProposal(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/api/proposals/${id}`);
}

function buildProposalForm(input: Partial<UpdateProposalInput>, file?: File): FormData {
  const formData = new FormData();
  if (input.title !== undefined) formData.append('title', input.title);
  if (input.description !== undefined) formData.append('description', input.description);
  if (input.subjectId !== undefined) formData.append('subjectId', input.subjectId);
  if (input.typeId !== undefined) formData.append('typeId', input.typeId);
  if (input.academicYear !== undefined && input.academicYear !== null) {
    formData.append('academicYear', String(input.academicYear));
  }
  if (file) formData.append('file', file);
  return formData;
}

export function createProposal(input: CreateProposalInput, file: File): Promise<Proposal> {
  return apiUpload<Proposal>('/api/proposals', buildProposalForm(input, file));
}

export function updateProposal(
  id: string,
  input: UpdateProposalInput,
  file?: File,
): Promise<Proposal> {
  return apiUpload<Proposal>(`/api/proposals/${id}`, buildProposalForm(input, file), {
    method: 'PATCH',
  });
}

export function deleteProposal(id: string): Promise<void> {
  return apiFetch<void>(`/api/proposals/${id}`, { method: 'DELETE' });
}

export function proposalFileUrl(id: string): string {
  return `/api/proposals/${id}/file`;
}
