'use client';

// Gestion des utilisateurs : validation, suspension, reinitialisation et suppression.

import { useState } from 'react';
import { Alert, Badge, Button, Card, CardContent, Input, PageHeader, Select, Spinner } from '@/components/ui';
import type { AdminUser } from '@/contracts/admin';
import type { UserStatus } from '@/contracts/auth';
import { ApiClientError } from '@/lib/api-client/client';
import { deleteUser, listAdminUsers, resetUserPassword, updateUserStatus } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_VARIANT, formatDate } from '@/lib/labels';

export function AdminUsersView() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | UserStatus>('');
  const users = useApiResource(
    () => listAdminUsers({ q: q || undefined, status: status || undefined }),
    [q, status],
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<string | null>) {
    setBusyId(id);
    setNotice(null);
    setError(null);
    try {
      const message = await action();
      users.reload();
      if (message) setNotice(message);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'L’action a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  function changeStatus(user: AdminUser, next: UserStatus) {
    return run(user.id, async () => {
      await updateUserStatus(user.id, { status: next });
      return `Statut de ${user.fullName} mis à jour : ${USER_STATUS_LABEL[next]}.`;
    });
  }

  function resetPassword(user: AdminUser) {
    return run(user.id, async () => {
      const result = await resetUserPassword(user.id);
      return `Mot de passe temporaire pour ${user.email} : ${result.temporaryPassword}`;
    });
  }

  function remove(user: AdminUser) {
    return run(user.id, async () => {
      await deleteUser(user.id);
      return `Compte de ${user.fullName} supprimé.`;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs" description="Validez les inscriptions et gérez les comptes." />

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
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Filière / Niveau</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Inscrit le</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-navy-500">
                      Aucun utilisateur ne correspond à la recherche.
                    </td>
                  </tr>
                )}
                {users.data?.map((user) => (
                  <tr key={user.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-900">{user.fullName}</p>
                      <p className="text-xs text-navy-400">{user.email}</p>
                      <p className="text-xs text-navy-400">{ROLE_LABEL[user.role]}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-600">
                      {user.programName ?? '—'}
                      <span className="block text-xs text-navy-400">{user.levelName ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={USER_STATUS_VARIANT[user.status]}>
                        {USER_STATUS_LABEL[user.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-navy-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {(user.status === 'pending' || user.status === 'rejected' || user.status === 'suspended') && (
                          <Button size="sm" variant="secondary" disabled={busyId === user.id} onClick={() => changeStatus(user, 'validated')}>
                            Valider
                          </Button>
                        )}
                        {user.status === 'pending' && (
                          <Button size="sm" variant="ghost" disabled={busyId === user.id} onClick={() => changeStatus(user, 'rejected')}>
                            Rejeter
                          </Button>
                        )}
                        {user.status === 'validated' && user.role !== 'admin' && (
                          <Button size="sm" variant="ghost" disabled={busyId === user.id} onClick={() => changeStatus(user, 'suspended')}>
                            Suspendre
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={busyId === user.id} onClick={() => resetPassword(user)}>
                          Réinitialiser
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          disabled={busyId === user.id}
                          onClick={() => remove(user)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
