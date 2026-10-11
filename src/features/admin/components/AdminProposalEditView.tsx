'use client';

// Modification des informations d'une proposition par l'administration.

import Link from 'next/link';
import { Alert, Spinner } from '@/components/ui';
import { getAdminProposal, updateAdminProposal } from '@/lib/api-client/admin';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { AdminEntityForm } from './AdminEntityForm';

export function AdminProposalEditView({ id }: { id: string }) {
  const proposal = useApiResource(() => getAdminProposal(id), [id]);
  const catalog = useApiResource(() => getCatalog(), []);

  if (proposal.loading || catalog.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement de la proposition" />
      </div>
    );
  }

  if (proposal.error || !proposal.data || catalog.error || !catalog.data) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{proposal.error ?? catalog.error ?? 'Proposition introuvable.'}</Alert>
        <Link href="/admin/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux propositions
        </Link>
      </div>
    );
  }

  const item = proposal.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Modifier la proposition</h1>
        <p className="mt-1 text-sm text-navy-500">Ajustez les informations avant validation.</p>
      </div>
      <AdminEntityForm
        catalog={catalog.data}
        initial={{
          title: item.title,
          description: item.description ?? '',
          subjectId: item.subjectId,
          typeId: item.typeId,
          academicYear: item.academicYear ?? '',
          visibility: item.visibility,
        }}
        submitLabel="Enregistrer"
        cancelHref={`/admin/proposals/${id}`}
        onSubmit={(input) => updateAdminProposal(id, input).then(() => undefined)}
      />
    </div>
  );
}
