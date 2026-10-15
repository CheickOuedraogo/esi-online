'use client';

// Tableau de bord administrateur : statistiques et documents populaires.

import Link from 'next/link';
import { Alert, Card, CardContent, PageHeader, Spinner } from '@/components/ui';
import { getAdminStats } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';

const STAT_LABELS: Array<{
  key: 'pendingUsersCount' | 'pendingProposalsCount' | 'pendingResetRequestsCount';
  label: string;
  href: string;
  accent?: boolean;
}> = [
  { key: 'pendingUsersCount', label: 'Comptes en attente', href: '/admin/users', accent: true },
  { key: 'pendingProposalsCount', label: 'Propositions à modérer', href: '/admin/proposals', accent: true },
  { key: 'pendingResetRequestsCount', label: 'Réinitialisations à traiter', href: '/admin/reset-requests', accent: true },
];

export function AdminDashboardView() {
  const stats = useApiResource(() => getAdminStats(), []);

  if (stats.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du tableau de bord" />
      </div>
    );
  }

  if (stats.error || !stats.data) {
    return <Alert variant="error">{stats.error ?? 'Impossible de charger les statistiques.'}</Alert>;
  }

  const data = stats.data;
  const metrics = [
    { label: 'Documents publiés', value: data.totalDocumentsCount, href: '/admin/documents' },
    { label: 'Utilisateurs', value: data.totalUsersCount, href: '/admin/users' },
    { label: 'Téléchargements', value: data.totalDownloadsCount, href: '/admin/documents' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d’ensemble de l’activité de la bibliothèque."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_LABELS.map((stat) => (
          <Link key={stat.key} href={stat.href}>
            <Card className="transition-colors hover:border-navy-200">
              <CardContent className="py-5">
                <p className="text-sm font-medium text-navy-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gold-600">{data[stat.key]}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="py-5">
              <p className="text-sm font-medium text-navy-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-navy-900">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-6">
          <h2 className="text-base font-semibold text-navy-900">Documents les plus téléchargés</h2>
          {data.topDownloadedDocuments.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">Aucune donnée disponible.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {data.topDownloadedDocuments.map((document, index) => (
                <li
                  key={document.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-navy-50 px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-semibold text-navy-600">
                      {index + 1}
                    </span>
                    <Link
                      href={`/library/${document.id}`}
                      className="truncate text-sm font-medium text-navy-800 hover:text-navy-600"
                    >
                      {document.title}
                    </Link>
                  </span>
                  <span className="shrink-0 text-sm text-navy-400">
                    {document.downloadCount} téléchargements
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
