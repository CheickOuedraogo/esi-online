'use client';

// Gestion des utilisateurs : liste, filtres et création. La consultation, la
// modification, le changement de statut et la suppression se font sur la fiche
// dédiée (/admin/users/[id]).

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  buttonClassName,
} from '@/components/ui';
import type { AdminUser } from '@/contracts/admin';
import type { UserStatus } from '@/contracts/auth';
import { getCatalog } from '@/lib/api-client/catalog';
import { listAdminUsers } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { Pagination } from '@/features/library';
import { USER_STATUS_LABEL, USER_STATUS_VARIANT } from '@/lib/labels';
import { AdminUserCreateForm } from './AdminUserCreateForm';

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
  const catalog = useApiResource(() => getCatalog(), []);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleCreated(user: AdminUser) {
    setCreating(false);
    users.reload();
    setNotice(`Compte de ${user.fullName} créé.`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Validez les inscriptions et consultez les comptes."
        actions={
          <Button onClick={() => setCreating(true)}>Nouvel utilisateur</Button>
        }
      />

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
              <caption className="sr-only">Liste des utilisateurs</caption>
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60 text-left text-xs uppercase tracking-wide text-navy-500">
                  <th scope="col" className="px-4 py-3 font-semibold">Nom complet</th>
                  <th scope="col" className="px-4 py-3 font-semibold">E-mail</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Statut</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Action</th>
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
                {users.data?.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/40"
                  >
                    <td className="px-4 py-3 font-medium text-navy-900">{user.fullName}</td>
                    <td className="px-4 py-3 text-navy-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={USER_STATUS_VARIANT[user.status]}>
                        {USER_STATUS_LABEL[user.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                      >
                        Visualiser
                      </Link>
                    </td>
                  </tr>
                ))}
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvel utilisateur">
        {catalog.data ? (
          <AdminUserCreateForm
            levels={catalog.data.levels}
            onCreated={handleCreated}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <div className="flex justify-center px-6 py-10">
            <Spinner className="h-6 w-6 text-navy-400" label="Chargement du catalogue" />
          </div>
        )}
      </Modal>
    </div>
  );
}
