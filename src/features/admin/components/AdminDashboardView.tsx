'use client';

// Tableau de bord administrateur : statistiques et gestion du catalogue.

import Link from 'next/link';
import { Alert, Card, CardContent, PageHeader, Spinner } from '@/components/ui';
import { getAdminStats } from '@/lib/api-client/admin';
import { useApiResource } from '@/lib/hooks/useApiResource';
import { AdminCatalogSection } from './AdminCatalogSection';

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

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-500">
          Actions prioritaires en attente
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STAT_LABELS.map((stat) => (
            <Link key={stat.key} href={stat.href} className="group">
              <Card className="h-full border-l-4 border-l-gold-400 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent>
                  <p className="text-sm font-medium text-navy-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-gold-600">{data[stat.key]}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-500">
          Statistiques globales
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent>
                <p className="text-sm font-medium text-navy-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-navy-900">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-500">Catalogue</h2>
        <p className="text-sm text-navy-500">Gérez les niveaux et les types de documents.</p>
        <AdminCatalogSection />
      </div>
    </div>
  );
}
