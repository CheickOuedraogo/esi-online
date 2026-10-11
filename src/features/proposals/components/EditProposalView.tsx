'use client';

// Edition d'une proposition existante (chargement puis formulaire pre-rempli).

import Link from 'next/link';
import { Alert, Spinner } from '@/components/ui';
import { getProposal } from '@/lib/api-client/proposals';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { ProposalForm } from './ProposalForm';

export function EditProposalView({ id }: { id: string }) {
  const resource = useApiResource(() => getProposal(id), [id]);

  if (resource.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement de la proposition" />
      </div>
    );
  }

  if (resource.error || !resource.data) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{resource.error ?? 'Proposition introuvable.'}</Alert>
        <Link href="/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour à mes propositions
        </Link>
      </div>
    );
  }

  if (resource.data.status === 'approved') {
    return (
      <div className="space-y-4">
        <Alert variant="info">
          Cette proposition a été approuvée et publiée : elle ne peut plus être modifiée.
        </Alert>
        <Link href="/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour à mes propositions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          Modifier la proposition
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          Modifiez les informations ou remplacez le fichier, puis resoumettez.
        </p>
      </div>
      <ProposalForm proposal={resource.data} />
    </div>
  );
}
