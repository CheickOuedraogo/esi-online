'use client';

// Vue detail d'un document avec bouton de telechargement.

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, CardContent, PageHeader, Spinner } from '@/components/ui';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { documentFileUrl, downloadDocument, getDocument } from '@/lib/api-client/documents';
import { useApiResource } from '@/lib/hooks/useApiResource';
import {
  VISIBILITY_LABEL,
  VISIBILITY_VARIANT,
  formatDate,
  formatFileSize,
} from '@/lib/labels';

export interface DocumentDetailViewProps {
  id: string;
}

export function DocumentDetailView({ id }: DocumentDetailViewProps) {
  const resource = useApiResource(() => getDocument(id), [id]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { blob, filename } = await downloadDocument(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename ?? resource.data?.originalFilename ?? 'document.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('Le téléchargement a échoué. Veuillez réessayer.');
    } finally {
      setDownloading(false);
    }
  }

  if (resource.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du document" />
      </div>
    );
  }

  if (resource.error || !resource.data) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{resource.error ?? 'Document introuvable.'}</Alert>
        <Link href="/library" className="text-sm font-medium text-navy-600 hover:text-navy-900">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const item = resource.data;
  const metadata = [
    { label: 'Matière', value: item.subjectName },
    { label: 'Niveau', value: item.levelName ?? '—' },
    { label: 'Filière', value: item.programName ?? '—' },
    { label: 'Type', value: item.typeName },
    { label: 'Année', value: item.academicYear ?? '—' },
    { label: 'Taille', value: formatFileSize(item.sizeBytes) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/library" className="text-sm font-medium text-navy-600 hover:text-navy-900">
        ← Retour à la bibliothèque
      </Link>

      <PageHeader
        title={item.title}
        description={`Publié ${item.publishedAt ? `le ${formatDate(item.publishedAt)}` : ''} par ${item.uploaderName ?? 'l’administration'}`}
        actions={
          <>
            <Badge variant="gold">{item.typeName}</Badge>
            <Badge variant={VISIBILITY_VARIANT[item.visibility]}>
              {VISIBILITY_LABEL[item.visibility]}
            </Badge>
          </>
        }
      />

      {downloadError && <Alert variant="error">{downloadError}</Alert>}

      <Card>
        <CardContent className="space-y-6 py-6">
          {item.description && <p className="text-sm leading-relaxed text-navy-700">{item.description}</p>}

          <dl className="grid grid-cols-2 gap-4 border-t border-navy-50 pt-5 sm:grid-cols-3">
            {metadata.map((entry) => (
              <div key={entry.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                  {entry.label}
                </dt>
                <dd className="mt-1 text-sm text-navy-800">{entry.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3 border-t border-navy-50 pt-5">
            <Button onClick={handleDownload} loading={downloading}>
              {downloading ? 'Téléchargement…' : 'Télécharger le fichier'}
            </Button>
            <span className="text-xs text-navy-400">
              {item.downloadCount} téléchargement{item.downloadCount > 1 ? 's' : ''} ·{' '}
              {item.originalFilename}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Aperçu</h2>
        <DocumentPreview url={documentFileUrl(item.id)} filename={item.originalFilename} />
      </div>
    </div>
  );
}
