'use client';

// Gestion des utilisateurs : consultation des details, validation, rejet et desactivation.

import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
} from '@/components/ui';
import type { AdminUser } from '@/contracts/admin';
import type { UserStatus } from '@/contracts/auth';
import { ApiClientError } from '@/lib/api-client/client';
import { listAdminUsers, updateUserStatus } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { Pagination } from '@/features/library';
import { ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_VARIANT, formatDate } from '@/lib/labels';

function splitName(fullName: string): { lastName: string; firstName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { lastName: parts[0], firstName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function AdminUsersView() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | UserStatus>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const users = useApiResource(
    () => listAdminUsers({ q: q || undefined, status: status || undefined, page }),
    [q, status, page],
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  async function run(user: AdminUser, next: UserStatus) {
    setBusyId(user.id);
    setNotice(null);
    setError(null);
    try {
      await updateUserStatus(user.id, { status: next });
      setSelected((current) => (current && current.id === user.id ? { ...current, status: next } : current));
      users.reload();
      setNotice(`Statut de ${user.fullName} mis à jour : ${USER_STATUS_LABEL[next]}.`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'L’action a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs" description="Validez les inscriptions et consultez les comptes." />

      <Card>
        <CardContent className="grid gap-3 py-5 sm:grid-cols-[1fr_220px]">
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rechercher par nom ou e-mail…"
            aria-label="Recherche utilisateur"
          />
          <Select
            aria-label="Filtrer par statut"
            value={status}
            onChange={(event) => setStatus(event.target.value as '' | UserStatus)}
          >
            <option value="">Tous les statuts</option>
            {(Object.keys(USER_STATUS_LABEL) as UserStatus[]).map((key) => (
              <option key={key} value={key}>
                {USER_STATUS_LABEL[key]}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {users.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des utilisateurs" />
        </div>
      ) : users.error ? (
        <Alert variant="error">{users.error}</Alert>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Prénom</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.data?.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-navy-500">
                      Aucun utilisateur ne correspond à la recherche.
                    </td>
                  </tr>
                )}
                {users.data?.items.map((user) => {
                  const { lastName, firstName } = splitName(user.fullName);
                  return (
                    <tr key={user.id} className="border-b border-navy-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-navy-900">{lastName}</td>
                      <td className="px-4 py-3 text-navy-700">{firstName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={USER_STATUS_VARIANT[user.status]}>
                          {USER_STATUS_LABEL[user.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === user.id}
                          onClick={() => setSelected(user)}
                        >
                          Visualiser
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {users.data && (
        <Pagination
          page={users.data.page}
          pageSize={users.data.pageSize}
          total={users.data.total}
          onChange={setPage}
          itemLabel="utilisateur"
        />
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Détails de l’utilisateur">
        {selected && (
          <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={USER_STATUS_VARIANT[selected.status]}>
                {USER_STATUS_LABEL[selected.status]}
              </Badge>
              <Badge variant="navy">{ROLE_LABEL[selected.role]}</Badge>
            </div>

            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Nom</dt>
                <dd className="text-sm text-navy-900">{splitName(selected.fullName).lastName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Prénom</dt>
                <dd className="text-sm text-navy-900">{splitName(selected.fullName).firstName || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">E-mail</dt>
                <dd className="break-all text-sm text-navy-900">{selected.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Niveau</dt>
                <dd className="text-sm text-navy-900">{selected.levelName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-navy-400">Inscrit le</dt>
                <dd className="text-sm text-navy-900">{formatDate(selected.createdAt)}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap justify-end gap-2 border-t border-navy-100 pt-4">
              {selected.status === 'validated' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  disabled={busyId === selected.id}
                  onClick={() => run(selected, 'suspended')}
                >
                  Désactiver le compte
                </Button>
              ) : (
                <>
                  {selected.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === selected.id}
                      onClick={() => run(selected, 'rejected')}
                    >
                      Rejeter
                    </Button>
                  )}
                  <Button size="sm" disabled={busyId === selected.id} onClick={() => run(selected, 'validated')}>
                    Valider
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
