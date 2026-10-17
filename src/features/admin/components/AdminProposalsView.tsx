'use client';

// Liste des propositions étudiantes en attente de modération. L'approbation,
// le rejet et la consultation se font sur la fiche dédiée (/admin/proposals/[id]).

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner, buttonClassName } from '@/components/ui';
import { listAdminProposals } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { Pagination } from '@/features/library';
import {
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_VARIANT,
  formatCount,
  formatDate,
} from '@/lib/labels';

export function AdminProposalsView() {
  const [page, setPage] = useState(1);
  const proposals = useApiResource(() => listAdminProposals({ page }), [page]);

  const pendingCount = proposals.data?.items.filter((proposal) => proposal.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propositions"
        description="Approuvez ou rejetez les documents proposés par les étudiants."
      />

      {pendingCount > 0 && (
        <Alert variant="info">{formatCount(pendingCount, 'proposition')} en attente de modération.</Alert>
      )}

      {proposals.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des propositions" />
        </div>
      ) : proposals.error ? (
        <Alert variant="error">{proposals.error}</Alert>
      ) : !proposals.data || proposals.data.items.length === 0 ? (
        <EmptyState
          title="Aucune proposition"
          description="Les documents proposés par les étudiants apparaîtront ici."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-navy-50">
            {proposals.data.items.map((proposal) => (
              <li
                key={proposal.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-navy-50/40 sm:px-5"
              >
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="truncate font-medium text-navy-900">{proposal.title}</p>
                  <p className="mt-0.5 truncate text-xs text-navy-500">
                    {proposal.typeName} · {proposal.uploaderName ?? '—'} · {formatDate(proposal.createdAt)}
                  </p>
                </div>
                <Badge variant={DOCUMENT_STATUS_VARIANT[proposal.status]}>
                  {DOCUMENT_STATUS_LABEL[proposal.status]}
                </Badge>
                <Link
                  href={`/admin/proposals/${proposal.id}`}
                  className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                >
                  Visualiser
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {proposals.data && (
        <Pagination
          page={proposals.data.page}
          pageSize={proposals.data.pageSize}
          total={proposals.data.total}
          onChange={setPage}
          itemLabel="proposition"
        />
      )}
    </div>
  );
}
