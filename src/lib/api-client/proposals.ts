// Fonctions d'appel a l'API des propositions etudiantes.

import type { CreateProposalInput, Proposal, UpdateProposalInput } from '@/contracts/proposals';
import { apiFetch } from './client';

export function listMyProposals(): Promise<Proposal[]> {
  return apiFetch<Proposal[]>('/api/me/proposals');
}

export function getProposal(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/api/proposals/${id}`);
}

export function createProposal(input: CreateProposalInput): Promise<Proposal> {
  return apiFetch<Proposal>('/api/proposals', { method: 'POST', body: input });
}

export function updateProposal(id: string, input: UpdateProposalInput): Promise<Proposal> {
  return apiFetch<Proposal>(`/api/proposals/${id}`, { method: 'PATCH', body: input });
}

export function deleteProposal(id: string): Promise<void> {
  return apiFetch<void>(`/api/proposals/${id}`, { method: 'DELETE' });
}

export function proposalFileUrl(id: string): string {
  return `/api/proposals/${id}/file`;
}
