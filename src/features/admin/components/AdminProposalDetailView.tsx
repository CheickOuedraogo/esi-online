'use client';

// Consultation d'une proposition par l'administration : apercu, modification,
// validation/rejet et suppression.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, CardContent, PageHeader, Select, Spinner } from '@/components/ui';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { ApiClientError } from '@/lib/api-client/client';
import {
  adminProposalFileUrl,
  deleteAdminProposal,
  getAdminProposal,
  reviewProposal,
} from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_VARIANT, formatAcademicYear, formatDate, formatFileSize } from '@/lib/labels';

export function AdminProposalDetailView({ id }: { id: string }) {
  const router = useRouter();
  const proposal = useApiResource(() => getAdminProposal(id), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'students' | 'public'>('students');

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await reviewProposal(id, { action: 'approve', visibility });
      router.push('/admin/proposals');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'L’approbation a échoué.');
      setBusy(false);
    }
  }

  async function reject() {
    const reason = window.prompt('Motif du rejet (facultatif) :') ?? undefined;
    setBusy(true);
    setError(null);
    try {
      await reviewProposal(id, { action: 'reject', reason: reason?.trim() || undefined });
      proposal.reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Le rejet a échoué.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Supprimer définitivement cette proposition ?')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAdminProposal(id);
      router.push('/admin/proposals');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'La suppression a échoué.');
      setBusy(false);
    }
  }

  if (proposal.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement de la proposition" />
      </div>
    );
  }

  if (proposal.error || !proposal.data) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{proposal.error ?? 'Proposition introuvable.'}</Alert>
        <Link href="/admin/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux propositions
        </Link>
      </div>
    );
  }

  const item = proposal.data;
  const metadata = [
    { label: 'Matière', value: item.subjectName },
    { label: 'Type', value: item.typeName },
    { label: 'Année', value: formatAcademicYear(item.academicYear) },
    { label: 'Proposé par', value: item.uploaderName ?? '—' },
    { label: 'Taille', value: formatFileSize(item.sizeBytes) },
    { label: 'Déposé le', value: formatDate(item.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
        ← Retour aux propositions
      </Link>

      <PageHeader
        title={item.title}
        actions={
          <>
            <Badge variant={DOCUMENT_STATUS_VARIANT[item.status]}>
              {DOCUMENT_STATUS_LABEL[item.status]}
            </Badge>
            <Link
              href={`/admin/proposals/${item.id}/edit`}
              className="inline-flex h-10 items-center rounded-lg bg-navy-700 px-4 text-sm font-medium text-cream transition-colors hover:bg-navy-800"
            >
              Modifier
            </Link>
            <Button variant="ghost" className="text-red-600 hover:bg-red-50" loading={busy} onClick={remove}>
              Supprimer
            </Button>
          </>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}
      {item.status === 'rejected' && item.rejectionReason && (
        <Alert variant="error">Motif du rejet : {item.rejectionReason}</Alert>
      )}

      <Card>
        <CardContent className="space-y-5 py-6">
          {item.description && <p className="text-sm leading-relaxed text-navy-700">{item.description}</p>}
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {metadata.map((entry) => (
              <div key={entry.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                  {entry.label}
                </dt>
                <dd className="mt-1 text-sm text-navy-800">{entry.value}</dd>
              </div>
            ))}
          </dl>

          {item.status === 'pending' && (
            <div className="flex flex-wrap items-center gap-3 border-t border-navy-50 pt-5">
              <Select
                aria-label="Visibilité à la publication"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'students' | 'public')}
                className="h-10 w-40"
              >
                <option value="students">Étudiants</option>
                <option value="public">Public</option>
              </Select>
              <Button loading={busy} onClick={approve}>
                Approuver et publier
              </Button>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" disabled={busy} onClick={reject}>
                Rejeter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Aperçu du fichier</h2>
        {item.contentAvailable ? (
          <DocumentPreview url={adminProposalFileUrl(item.id)} filename={item.originalFilename} />
        ) : (
          <Alert variant="info">
            Le fichier a été supprimé après 3 jours pour économiser l’espace de stockage. La fiche de la
            proposition reste consultable.
          </Alert>
        )}
      </div>
    </div>
  );
}
