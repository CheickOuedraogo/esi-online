'use client';

// Demandes de reinitialisation : l'admin definit un nouveau mot de passe dans une pop-up.

import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  PasswordInput,
  Spinner,
} from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import type { ResetRequest } from '@/contracts/admin';
import { resetPasswordInputSchema } from '@/contracts/admin';
import { ApiClientError } from '@/lib/api-client/client';
import { completeResetRequest, listResetRequests } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { formatDate } from '@/lib/labels';

export function AdminResetRequestsView() {
  const requests = useApiResource(() => listResetRequests(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ResetRequest | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();

  function open(request: ResetRequest) {
    setSelected(request);
    setPassword('');
    setPasswordError(undefined);
    setError(null);
  }

  function close() {
    setSelected(null);
    setPassword('');
    setPasswordError(undefined);
  }

  async function submit() {
    if (!selected) return;
    const parsed = resetPasswordInputSchema.safeParse({ password });
    if (!parsed.success) {
      setPasswordError(parsed.error.flatten().fieldErrors.password?.[0]);
      return;
    }
    setBusyId(selected.id);
    setError(null);
    try {
      await completeResetRequest(selected.id, parsed.data);
      requests.reload();
      setNotice(`Mot de passe de ${selected.userEmail} mis à jour.`);
      close();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Le traitement a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réinitialisations"
        description="Définissez un nouveau mot de passe pour les demandes de mot de passe oublié."
      />

      <Alert variant="info">
        Les e-mails ne sont pas envoyés automatiquement. Définissez un mot de passe puis communiquez-le
        à l’utilisateur.
      </Alert>

      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {requests.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des demandes" />
        </div>
      ) : requests.error ? (
        <Alert variant="error">{requests.error}</Alert>
      ) : !requests.data || requests.data.length === 0 ? (
        <EmptyState title="Aucune demande" description="Aucune demande de réinitialisation en attente." />
      ) : (
        <Card>
          <ul className="divide-y divide-navy-50">
            {requests.data.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="truncate font-medium text-navy-900">{request.userFullName}</p>
                  <p className="truncate text-xs text-navy-400">{request.userEmail}</p>
                </div>
                <span className="text-xs text-navy-400">{formatDate(request.createdAt)}</span>
                <Badge variant={request.status === 'pending' ? 'amber' : 'green'}>
                  {request.status === 'pending' ? 'En attente' : 'Traitée'}
                </Badge>
                {request.status === 'pending' && (
                  <Button size="sm" onClick={() => open(request)}>
                    Traiter
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={selected !== null} onClose={close} title="Nouveau mot de passe">
        {selected && (
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-navy-600">
              Définir un nouveau mot de passe pour{' '}
              <span className="font-medium text-navy-900">{selected.userFullName}</span> ({selected.userEmail}).
            </p>
            <FormField
              id="reset-password"
              label="Mot de passe"
              required
              error={passwordError}
              hint="8 caractères minimum."
            >
              <PasswordInput
                id="reset-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                hasError={Boolean(passwordError)}
              />
            </FormField>
            <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
              <Button variant="secondary" size="sm" onClick={close}>
                Annuler
              </Button>
              <Button size="sm" loading={busyId === selected.id} onClick={submit}>
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
