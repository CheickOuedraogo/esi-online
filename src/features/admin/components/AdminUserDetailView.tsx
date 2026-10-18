'use client';

// Fiche d'un utilisateur (vue admin) : consultation, modification, changement de
// statut (validation/refus/suspension) et suppression. Le mode édition (`editing`)
// affiche le formulaire directement sur la fiche, comme pour les documents.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  buttonClassName,
  Card,
  CardContent,
  Label,
  Modal,
  PageHeader,
  Spinner,
  Textarea,
} from '@/components/ui';
import type { UserStatus } from '@/contracts/auth';
import { ApiClientError } from '@/lib/api-client/client';
import { deleteUser, getAdminUser, updateUser, updateUserStatus } from '@/lib/api-client/admin';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  ROLE_LABEL,
  USER_STATUS_LABEL,
  USER_STATUS_VARIANT,
  formatDate,
} from '@/lib/labels';
import { AdminUserEditForm } from './AdminUserEditForm';

interface Decision {
  next: Extract<UserStatus, 'rejected' | 'suspended'>;
}

export function AdminUserDetailView({ id, editing = false }: { id: string; editing?: boolean }) {
  const router = useRouter();
  const user = useApiResource(() => getAdminUser(id), [id]);
  const catalog = useApiResource(() => getCatalog(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    user.reload();
  }

  async function changeStatus(next: UserStatus, reasonText?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await updateUserStatus(id, { status: next, reason: reasonText?.trim() || undefined });
      refresh();
      setNotice(`Statut mis à jour : ${USER_STATUS_LABEL[next]}.`);
      return true;
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'L’action a échoué.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function askDecision(next: Extract<UserStatus, 'rejected' | 'suspended'>) {
    setReason('');
    setError(null);
    setDecision({ next });
  }

  async function confirmDecision() {
    if (!decision) return;
    const ok = await changeStatus(decision.next, reason);
    if (ok) {
      setDecision(null);
      setReason('');
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteUser(id);
      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'La suppression a échoué.');
      setBusy(false);
      setDeleting(false);
    }
  }

  if (user.loading || (editing && catalog.loading)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement de l’utilisateur" />
      </div>
    );
  }

  if (user.error || !user.data || (editing && (catalog.error || !catalog.data))) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{user.error ?? catalog.error ?? 'Utilisateur introuvable.'}</Alert>
        <Link href="/admin/users" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux utilisateurs
        </Link>
      </div>
    );
  }

  const item = user.data;

  if (editing && catalog.data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour aux utilisateurs
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Modifier l’utilisateur</h1>
          <p className="mt-1 text-sm text-navy-500">Mettez à jour les informations du compte.</p>
        </div>

        <AdminUserEditForm
          levels={catalog.data.levels}
          initial={{
            fullName: item.fullName,
            email: item.email,
            role: item.role,
            levelId: item.levelId,
          }}
          submitLabel="Enregistrer"
          cancelHref={`/admin/users/${id}`}
          onSubmit={(input) => updateUser(id, input).then(() => undefined)}
        />
      </div>
    );
  }

  const metadata = [
    { label: 'E-mail', value: item.email },
    { label: 'Rôle', value: ROLE_LABEL[item.role] },
    { label: 'Niveau', value: item.levelName ?? '—' },
    { label: 'Inscrit le', value: formatDate(item.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm font-medium text-navy-600 hover:text-navy-900">
        ← Retour aux utilisateurs
      </Link>

      <PageHeader
        title={item.fullName}
        description="Informations du compte et gestion du statut."
        actions={
          <>
            <Badge variant={USER_STATUS_VARIANT[item.status]}>{USER_STATUS_LABEL[item.status]}</Badge>
            <Link
              href={`/admin/users/${item.id}?edit=1`}
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
            >
              Modifier
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              disabled={busy}
              onClick={() => setDeleting(true)}
            >
              Supprimer
            </Button>
          </>
        }
      />

      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardContent className="space-y-5 py-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {metadata.map((entry) => (
              <div key={entry.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                  {entry.label}
                </dt>
                <dd className="mt-1 break-words text-sm text-navy-800">{entry.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-2 border-t border-navy-50 pt-5">
            {item.status === 'validated' ? (
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                disabled={busy}
                onClick={() => askDecision('suspended')}
              >
                Désactiver le compte
              </Button>
            ) : (
              <>
                {item.status === 'pending' && (
                  <Button variant="ghost" disabled={busy} onClick={() => askDecision('rejected')}>
                    Rejeter
                  </Button>
                )}
                <Button disabled={busy} onClick={() => changeStatus('validated')}>
                  Valider
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision?.next === 'rejected' ? 'Rejeter l’inscription' : 'Désactiver le compte'}
      >
        {decision && (
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-navy-700">
              {decision.next === 'rejected' ? (
                <>
                  Vous êtes sur le point de rejeter l’inscription de{' '}
                  <strong className="text-navy-900">{item.fullName}</strong>. Cette personne ne pourra
                  pas se connecter.
                </>
              ) : (
                <>
                  Vous êtes sur le point de désactiver le compte de{' '}
                  <strong className="text-navy-900">{item.fullName}</strong>. Il ne pourra plus se
                  connecter tant qu’il n’aura pas été réactivé.
                </>
              )}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="decision-reason">
                Motif{decision.next === 'rejected' ? '' : ' (facultatif)'}
              </Label>
              <Textarea
                id="decision-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                required={decision.next === 'rejected'}
                placeholder={
                  decision.next === 'rejected'
                    ? 'Expliquez brièvement la raison du rejet…'
                    : 'Ajoutez un motif si nécessaire…'
                }
              />
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
              <Button variant="secondary" onClick={() => setDecision(null)} disabled={busy}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={confirmDecision}
                loading={busy}
                disabled={decision.next === 'rejected' && reason.trim().length === 0}
              >
                {decision.next === 'rejected' ? 'Rejeter' : 'Désactiver'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Supprimer l'utilisateur"
      >
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-navy-700">
            Êtes-vous sûr(e) de vouloir supprimer définitivement le compte de{' '}
            <strong className="text-navy-900">{item.fullName}</strong> ({item.email}) ?
            Cette action est irréversible.
          </p>

          <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
            <Button variant="secondary" onClick={() => setDeleting(false)} disabled={busy}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={busy}
            >
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
