'use client';

// Liste des propositions de l'etudiant connecte.

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, CardContent, EmptyState, PageHeader, Spinner } from '@/components/ui';
import { deleteProposal, listMyProposals } from '@/lib/api-client/proposals';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_VARIANT,
  formatAcademicYear,
  formatDate,
} from '@/lib/labels';

export function ProposalsView() {
  const proposals = useApiResource(() => listMyProposals(), []);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await deleteProposal(id);
      proposals.reload();
    } catch {
      setActionError('La suppression a échoué. Veuillez réessayer.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes propositions"
        description="Partagez vos cours, TD et annales : l’équipe les valide avant publication."
        actions={
          <Link
            href="/proposals/new"
              className="inline-flex h-10 whitespace-nowrap items-center rounded-lg bg-navy-700 px-4 text-sm font-medium text-cream transition-colors hover:bg-navy-800"
          >
            Proposer un document
          </Link>
        }
      />

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {proposals.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des propositions" />
        </div>
      ) : proposals.error ? (
        <Alert variant="error">{proposals.error}</Alert>
      ) : !proposals.data || proposals.data.length === 0 ? (
        <EmptyState
          title="Aucune proposition"
          description="Vous n’avez pas encore proposé de document. Partagez votre premier cours ou TD !"
          action={
            <Link
              href="/proposals/new"
            className="inline-flex h-10 whitespace-nowrap items-center rounded-lg bg-navy-700 px-4 text-sm font-medium text-cream transition-colors hover:bg-navy-800"
            >
              Proposer un document
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {proposals.data.map((proposal) => (
            <Card key={proposal.id}>
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={DOCUMENT_STATUS_VARIANT[proposal.status]}>
                      {DOCUMENT_STATUS_LABEL[proposal.status]}
                    </Badge>
                    <Badge variant="gold">{proposal.typeName}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-navy-900">{proposal.title}</h3>
                  <p className="text-xs text-navy-400">
                    {proposal.subjectName} · {formatAcademicYear(proposal.academicYear)} · proposé le{' '}
                    {formatDate(proposal.createdAt)}
                  </p>
                  {!proposal.contentAvailable && proposal.status !== 'approved' && (
                    <p className="text-xs text-navy-400">
                      Fichier supprimé après 3 jours (stockage) — modifiez pour en renvoyer un.
                    </p>
                  )}
                  {proposal.status === 'rejected' && proposal.rejectionReason && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Motif : {proposal.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/proposals/${proposal.id}`}
                    className="inline-flex h-8 items-center rounded-lg border border-navy-200 bg-white px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
                  >
                    Visualiser
                  </Link>
                  {proposal.status !== 'approved' && (
                    <>
                      <Link
                        href={`/proposals/${proposal.id}/edit`}
                        className="inline-flex h-8 items-center rounded-lg border border-navy-200 bg-white px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
                      >
                        Modifier
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(proposal.id)}
                      >
                        Supprimer
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
