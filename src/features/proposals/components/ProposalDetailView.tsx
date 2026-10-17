'use client';

// Detail d'une proposition etudiant : visualisation du fichier si encore disponible.

import Link from 'next/link';
import { Alert, Badge, Card, CardContent, PageHeader, Spinner } from '@/components/ui';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { getProposal, proposalFileUrl } from '@/lib/api-client/proposals';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_VARIANT, formatAcademicYear, formatDate, formatFileSize } from '@/lib/labels';

export function ProposalDetailView({ id }: { id: string }) {
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

  const proposal = resource.data;
  const canEdit = proposal.status !== 'approved';
  const metadata = [
    { label: 'Matière', value: proposal.subject },
    { label: 'Niveau', value: proposal.levelName ?? '—' },
    { label: 'Type', value: proposal.typeName },
    { label: 'Année', value: formatAcademicYear(proposal.academicYear) },
    { label: 'Fichier', value: proposal.originalFilename },
    { label: 'Taille', value: formatFileSize(proposal.sizeBytes) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
        ← Retour à mes propositions
      </Link>

      <PageHeader
        title={proposal.title}
        description={`Proposé le ${formatDate(proposal.createdAt)}`}
        actions={
          <>
            <Badge variant={DOCUMENT_STATUS_VARIANT[proposal.status]}>
              {DOCUMENT_STATUS_LABEL[proposal.status]}
            </Badge>
            {canEdit && (
              <Link
                href={`/proposals/${proposal.id}/edit`}
                className="inline-flex h-10 items-center rounded-lg bg-navy-700 px-4 text-sm font-medium text-cream transition-colors hover:bg-navy-800"
              >
                Modifier et resoumettre
              </Link>
            )}
          </>
        }
      />

      {proposal.status === 'rejected' && proposal.rejectionReason && (
        <Alert variant="error">Motif du rejet : {proposal.rejectionReason}</Alert>
      )}

      <Card>
        <CardContent className="py-6">
          {proposal.description && (
            <p className="text-sm leading-relaxed text-navy-700">{proposal.description}</p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-navy-50 pt-5 sm:grid-cols-3">
            {metadata.map((entry) => (
              <div key={entry.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                  {entry.label}
                </dt>
                <dd className="mt-1 break-words text-sm text-navy-800">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Aperçu du fichier</h2>
        {proposal.contentAvailable ? (
          <DocumentPreview url={proposalFileUrl(proposal.id)} filename={proposal.originalFilename} />
        ) : (
          <Alert variant="info">
            Le fichier a été supprimé après 3 jours pour économiser l’espace de stockage. La fiche de
            la proposition reste consultable. Vous pouvez la modifier et renvoyer un nouveau fichier.
          </Alert>
        )}
      </div>
    </div>
  );
}
