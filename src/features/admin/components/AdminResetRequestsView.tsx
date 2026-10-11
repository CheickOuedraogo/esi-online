'use client';

// Demandes de reinitialisation de mot de passe : traitement manuel par l'admin.

import { useState } from 'react';
import { Alert, Badge, Button, Card, CardContent, EmptyState, PageHeader, Spinner } from '@/components/ui';
import { completeResetRequest, listResetRequests } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { formatDate } from '@/lib/labels';

export function AdminResetRequestsView() {
  const requests = useApiResource(() => listResetRequests(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function complete(id: string, email: string) {
    setBusyId(id);
    setNotice(null);
    try {
      const result = await completeResetRequest(id);
      requests.reload();
      setNotice(`Mot de passe temporaire pour ${email} : ${result.temporaryPassword}`);
    } catch {
      setNotice('Le traitement a échoué. Veuillez réessayer.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réinitialisations"
        description="Traitez les demandes de mot de passe oublié (envoi manuel de l’e-mail)."
      />

      <Alert variant="info">
        Les e-mails ne sont pas envoyés automatiquement. Traitez la demande puis communiquez le mot de
        passe temporaire à l’utilisateur.
      </Alert>

      {notice && <Alert variant="success">{notice}</Alert>}

      {requests.loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-navy-400" label="Chargement des demandes" />
        </div>
      ) : requests.error ? (
        <Alert variant="error">{requests.error}</Alert>
      ) : !requests.data || requests.data.length === 0 ? (
        <EmptyState title="Aucune demande" description="Aucune demande de réinitialisation en attente." />
      ) : (
        <div className="space-y-3">
          {requests.data.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{request.fullName}</p>
                  <p className="text-xs text-navy-400">{request.email}</p>
                  <p className="mt-1 text-xs text-navy-400">
                    Demande du {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={request.status === 'pending' ? 'amber' : 'green'}>
                    {request.status === 'pending' ? 'En attente' : 'Traitée'}
                  </Badge>
                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      disabled={busyId === request.id}
                      onClick={() => complete(request.id, request.email)}
                    >
                      Traiter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
