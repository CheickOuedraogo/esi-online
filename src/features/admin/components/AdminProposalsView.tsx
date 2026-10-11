'use client';

// Moderation des propositions etudiantes : approbation ou rejet.

import { useState } from 'react';
import { Alert, Badge, Button, Card, CardContent, EmptyState, PageHeader, Select, Spinner } from '@/components/ui';
import type { Proposal } from '@/contracts/proposals';
import { ApiClientError } from '@/lib/api-client/client';
import { listAdminProposals, reviewProposal } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_VARIANT, formatDate } from '@/lib/labels';

export function AdminProposalsView() {
  const proposals = useApiResource(() => listAdminProposals(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'students' | 'public'>('students');

  async function approve(proposal: Proposal) {
    setBusyId(proposal.id);
    setNotice(null);
    setError(null);
    try {
      await reviewProposal(proposal.id, { action: 'approve', visibility });
      proposals.reload();
      setNotice(`« ${proposal.title} » a été approuvée et publiée.`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'L’approbation a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(proposal: Proposal) {
    const reason = window.prompt('Motif du rejet (facultatif) :') ?? undefined;
    setBusyId(proposal.id);
    setNotice(null);
    setError(null);
    try {
      await reviewProposal(proposal.id, { action: 'reject', reason: reason?.trim() || undefined });
      proposals.reload();
      setNotice(`« ${proposal.title} » a été rejetée.`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Le rejet a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = proposals.data?.filter((proposal) => proposal.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propositions"
        description="Approuvez ou rejetez les documents proposés par les étudiants."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-500">Publier comme</span>
            <Select
              aria-label="Visibilité à la publication"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'students' | 'public')}
              className="h-10 w-40"
            >
              <option value="students">Étudiants</option>
              <option value="public">Public</option>
            </Select>
          </div>
        }
      />

      {pendingCount > 0 && (
        <Alert variant="info">
          {pendingCount} proposition{pendingCount > 1 ? 's' : ''} en attente de modération.
        </Alert>
      )}
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {proposals.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des propositions" />
        </div>
      ) : proposals.error ? (
        <Alert variant="error">{proposals.error}</Alert>
      ) : !proposals.data || proposals.data.length === 0 ? (
        <EmptyState
          title="Aucune proposition"
          description="Les documents proposés par les étudiants apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {proposals.data.map((proposal) => (
            <Card key={proposal.id}>
              <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={DOCUMENT_STATUS_VARIANT[proposal.status]}>
                      {DOCUMENT_STATUS_LABEL[proposal.status]}
                    </Badge>
                    <Badge variant="gold">{proposal.typeName}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-navy-900">{proposal.title}</h3>
                  {proposal.description && (
                    <p className="text-sm text-navy-600">{proposal.description}</p>
                  )}
                  <p className="text-xs text-navy-400">
                    {proposal.subjectName} · {proposal.academicYear ?? '—'} · par{' '}
                    {proposal.uploaderName ?? '—'} le {formatDate(proposal.createdAt)}
                  </p>
                  {proposal.status === 'rejected' && proposal.rejectionReason && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Motif : {proposal.rejectionReason}
                    </p>
                  )}
                </div>

                {proposal.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === proposal.id}
                      onClick={() => approve(proposal)}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      disabled={busyId === proposal.id}
                      onClick={() => reject(proposal)}
                    >
                      Rejeter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
