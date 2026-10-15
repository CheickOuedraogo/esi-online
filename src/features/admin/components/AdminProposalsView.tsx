'use client';

// Moderation des propositions etudiantes : consultation dans une pop-up, approbation ou rejet.

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  EyeIcon,
  IconButton,
  Modal,
  PageHeader,
  Select,
  Spinner,
} from '@/components/ui';
import type { Proposal } from '@/contracts/proposals';
import { ApiClientError } from '@/lib/api-client/client';
import { listAdminProposals, reviewProposal } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_VARIANT,
  VISIBILITY_LABEL,
  formatDate,
  formatFileSize,
} from '@/lib/labels';

export function AdminProposalsView() {
  const proposals = useApiResource(() => listAdminProposals(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'students' | 'public'>('students');
  const [selected, setSelected] = useState<Proposal | null>(null);

  function open(proposal: Proposal) {
    setSelected(proposal);
    setVisibility('students');
    setError(null);
  }

  async function approve(proposal: Proposal) {
    setBusyId(proposal.id);
    setNotice(null);
    setError(null);
    try {
      await reviewProposal(proposal.id, { action: 'approve', visibility });
      proposals.reload();
      setNotice(`« ${proposal.title} » a été approuvée et publiée.`);
      setSelected(null);
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
      setSelected(null);
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
        <Card>
          <ul className="divide-y divide-navy-50">
            {proposals.data.map((proposal) => (
              <li
                key={proposal.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="truncate font-medium text-navy-900">{proposal.title}</p>
                  <p className="mt-0.5 truncate text-xs text-navy-400">{proposal.typeName}</p>
                </div>
                <Badge variant={DOCUMENT_STATUS_VARIANT[proposal.status]}>
                  {DOCUMENT_STATUS_LABEL[proposal.status]}
                </Badge>
                <IconButton
                  label={`Voir les détails de ${proposal.title}`}
                  disabled={busyId === proposal.id}
                  onClick={() => open(proposal)}
                >
                  <EyeIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Détails de la proposition">
        {selected && (
          <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <h3 className="text-base font-semibold text-navy-900">{selected.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={DOCUMENT_STATUS_VARIANT[selected.status]}>
                  {DOCUMENT_STATUS_LABEL[selected.status]}
                </Badge>
                <Badge variant="gold">{selected.typeName}</Badge>
                <Badge variant="navy">{VISIBILITY_LABEL[selected.visibility]}</Badge>
              </div>
            </div>

            {selected.description && (
              <p className="text-sm leading-relaxed text-navy-700">{selected.description}</p>
            )}

            <dl className="grid gap-x-6 gap-y-3 border-t border-navy-100 pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Matière</dt>
                <dd className="text-sm text-navy-900">{selected.subjectName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Niveau</dt>
                <dd className="text-sm text-navy-900">{selected.levelName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Année</dt>
                <dd className="text-sm text-navy-900">{selected.academicYear ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Proposé par</dt>
                <dd className="text-sm text-navy-900">{selected.uploaderName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Taille</dt>
                <dd className="text-sm text-navy-900">{formatFileSize(selected.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Déposé le</dt>
                <dd className="text-sm text-navy-900">{formatDate(selected.createdAt)}</dd>
              </div>
            </dl>

            {selected.status === 'rejected' && selected.rejectionReason && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Motif du rejet : {selected.rejectionReason}
              </p>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 pt-4">
              <Link
                href={`/admin/proposals/${selected.id}`}
                className="text-sm font-medium text-navy-600 hover:text-navy-900"
              >
                Ouvrir la fiche complète
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                {selected.status === 'pending' ? (
                  <>
                    <Select
                      aria-label="Visibilité à la publication"
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value as 'students' | 'public')}
                      className="h-9 w-36"
                    >
                      <option value="students">Étudiants</option>
                      <option value="public">Public</option>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      disabled={busyId === selected.id}
                      onClick={() => reject(selected)}
                    >
                      Rejeter
                    </Button>
                    <Button size="sm" disabled={busyId === selected.id} onClick={() => approve(selected)}>
                      Approuver
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
