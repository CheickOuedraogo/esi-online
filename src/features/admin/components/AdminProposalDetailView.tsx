'use client';

// Fiche d'une proposition (vue admin) : consultation, aperçu du fichier,
// modification des informations (hors fichier), approbation et rejet.
// Le mode édition (`editing`) affiche le formulaire directement sur la fiche.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Label,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { ApiClientError } from '@/lib/api-client/client';
import {
  adminProposalFileUrl,
  deleteAdminProposal,
  getAdminProposal,
  reviewProposal,
  updateAdminProposal,
} from '@/lib/api-client/admin';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_VARIANT,
  formatAcademicYear,
  formatDate,
  formatFileSize,
} from '@/lib/labels';
import { AdminEntityForm } from './AdminEntityForm';

export function AdminProposalDetailView({ id, editing = false }: { id: string; editing?: boolean }) {
  const router = useRouter();
  const proposal = useApiResource(() => getAdminProposal(id), [id]);
  const catalog = useApiResource(() => getCatalog(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'students' | 'public'>('students');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

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

  function askReject() {
    setReason('');
    setRejectError(null);
    setRejecting(true);
  }

  async function confirmReject() {
    setBusy(true);
    setRejectError(null);
    try {
      await reviewProposal(id, { action: 'reject', reason: reason.trim() || undefined });
      setRejecting(false);
      proposal.reload();
    } catch (err) {
      setRejectError(err instanceof ApiClientError ? err.message : 'Le rejet a échoué.');
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

  if (proposal.loading || (editing && catalog.loading)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement de la proposition" />
      </div>
    );
  }

  if (proposal.error || !proposal.data || (editing && (catalog.error || !catalog.data))) {
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

  if (editing && catalog.data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/proposals" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux propositions
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Modifier la proposition</h1>
          <p className="mt-1 text-sm text-navy-500">
            Ajustez les informations avant validation. Le fichier proposé n’est pas modifiable.
          </p>
        </div>

        <AdminEntityForm
          catalog={catalog.data}
          initial={{
            title: item.title,
            description: item.description ?? '',
            subject: item.subject,
            typeId: item.typeId,
            levelId: item.levelId,
            academicYear: item.academicYear ?? null,
            visibility: item.visibility,
          }}
          submitLabel="Enregistrer"
          cancelHref={`/admin/proposals/${id}`}
          onSubmit={(input) => updateAdminProposal(id, input).then(() => undefined)}
        />
      </div>
    );
  }

  const metadata = [
    { label: 'Matière', value: item.subject },
    { label: 'Niveau', value: item.levelName ?? '—' },
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
              href={`/admin/proposals/${item.id}?edit=1`}
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
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">
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
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" disabled={busy} onClick={askReject}>
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

      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Rejeter la proposition">
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-navy-700">
            Vous êtes sur le point de rejeter{' '}
            <strong className="text-navy-900">« {item.title} »</strong>. Le motif est communiqué à
            l’étudiant.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="proposal-reason">Motif du rejet</Label>
            <Textarea
              id="proposal-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              required
              placeholder="Expliquez pourquoi cette proposition est refusée…"
            />
          </div>

          {rejectError && <Alert variant="error">{rejectError}</Alert>}

          <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
            <Button variant="secondary" onClick={() => setRejecting(false)} disabled={busy}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={confirmReject}
              loading={busy}
              disabled={reason.trim().length === 0}
            >
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
