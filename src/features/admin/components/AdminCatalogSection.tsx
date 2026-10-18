'use client';

// Gestion du catalogue (niveaux, types de documents) intégrée au tableau de bord :
// création, modification et suppression depuis le back-office.
// L'ESI est une école unique : pas de filière, la matière d'un document est un texte libre.

import { useState } from 'react';
import { Alert, Badge, Button, Card, CardContent, Modal, Spinner, useToast } from '@/components/ui';
import { ApiClientError } from '@/lib/api-client/client';
import {
  createDocumentType,
  createLevel,
  deleteDocumentType,
  deleteLevel,
  getCatalog,
  updateDocumentType,
  updateLevel,
} from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { AdminCatalogForm, type CatalogFormValues, type CatalogKind } from './AdminCatalogForm';

interface CatalogDialog {
  kind: CatalogKind;
  mode: 'create' | 'edit';
  id?: string;
  initialName?: string;
}

interface CatalogEntityRef {
  id: string;
  name: string;
}

interface DeleteTarget {
  kind: CatalogKind;
  id: string;
  name: string;
}

const KIND_LABEL: Record<CatalogKind, string> = {
  level: 'Niveau',
  documentType: 'Type de document',
};

interface CatalogEntityCardProps {
  title: string;
  kind: CatalogKind;
  items: Array<{ id: string; name: string }>;
  onAdd: (kind: CatalogKind) => void;
  onEdit: (kind: CatalogKind, entity: CatalogEntityRef) => void;
  onDelete: (kind: CatalogKind, entity: CatalogEntityRef) => void;
}

function CatalogEntityCard({
  title,
  kind,
  items,
  onAdd,
  onEdit,
  onDelete,
}: CatalogEntityCardProps) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-500">{title}</h3>
          <Button size="sm" variant="secondary" onClick={() => onAdd(kind)}>
            Ajouter
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-navy-500">Aucun élément.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-navy-50"
              >
                <Badge variant="navy">{item.name}</Badge>
                <span className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(kind, item)}>
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(kind, item)}
                  >
                    Supprimer
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminCatalogSection() {
  const catalog = useApiResource(() => getCatalog(), []);
  const { toast } = useToast();

  const [dialog, setDialog] = useState<CatalogDialog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate(kind: CatalogKind) {
    setFormError(null);
    setDialog({ kind, mode: 'create' });
  }

  function openEdit(kind: CatalogKind, entity: CatalogEntityRef) {
    setFormError(null);
    setDialog({
      kind,
      mode: 'edit',
      id: entity.id,
      initialName: entity.name,
    });
  }

  function askDelete(kind: CatalogKind, entity: CatalogEntityRef) {
    setDeleteError(null);
    setDeleteTarget({ kind, id: entity.id, name: entity.name });
  }

  async function handleSubmit(values: CatalogFormValues) {
    if (!dialog) return;
    setPending(true);
    setFormError(null);

    const { kind, mode, id } = dialog;
    try {
      if (kind === 'level') {
        if (mode === 'create') await createLevel({ name: values.name });
        else await updateLevel(id!, { name: values.name });
      } else {
        if (mode === 'create') await createDocumentType({ name: values.name });
        else await updateDocumentType(id!, { name: values.name });
      }
      toast(mode === 'create' ? 'Ajout enregistré.' : 'Modifications enregistrées.');
      setDialog(null);
      catalog.reload();
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.',
      );
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    setDeleteError(null);

    const { kind, id } = deleteTarget;
    try {
      if (kind === 'level') await deleteLevel(id);
      else await deleteDocumentType(id);
      toast('Suppression effectuée.');
      setDeleteTarget(null);
      catalog.reload();
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : 'La suppression a échoué.');
    } finally {
      setPending(false);
    }
  }

  if (catalog.loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du catalogue" />
      </div>
    );
  }

  if (catalog.error || !catalog.data) {
    return <Alert variant="error">{catalog.error ?? 'Impossible de charger le catalogue.'}</Alert>;
  }

  const { levels, documentTypes } = catalog.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CatalogEntityCard
          title="Niveaux"
          kind="level"
          items={levels}
          onAdd={openCreate}
          onEdit={openEdit}
          onDelete={askDelete}
        />
        <CatalogEntityCard
          title="Types de documents"
          kind="documentType"
          items={documentTypes}
          onAdd={openCreate}
          onEdit={openEdit}
          onDelete={askDelete}
        />
      </div>

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={
          dialog
            ? `${dialog.mode === 'create' ? 'Ajouter' : 'Modifier'} — ${KIND_LABEL[dialog.kind]}`
            : undefined
        }
      >
        {dialog && (
          <AdminCatalogForm
            kind={dialog.kind}
            initial={{ name: dialog.initialName ?? '' }}
            error={formError}
            pending={pending}
            submitLabel={dialog.mode === 'create' ? 'Ajouter' : 'Enregistrer'}
            onSubmit={handleSubmit}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
      >
        {deleteTarget && (
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-navy-700">
              Supprimer « <strong className="text-navy-900">{deleteTarget.name}</strong> » ? Cette
              action est définitive.
            </p>

            {deleteError && <Alert variant="error">{deleteError}</Alert>}

            <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={pending}>
                Annuler
              </Button>
              <Button variant="danger" onClick={confirmDelete} loading={pending}>
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
