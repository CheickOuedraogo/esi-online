'use client';

// Consultation du catalogue (niveaux, matieres, types de documents).

import { Alert, Badge, Card, CardContent, PageHeader, Spinner } from '@/components/ui';
import { getCatalog } from '@/lib/api-client/catalog';
import { useApiResource } from '@/lib/hooks/useApiResource';

export function AdminCatalogView() {
  const catalog = useApiResource(() => getCatalog(), []);

  if (catalog.loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7 text-navy-400" label="Chargement du catalogue" />
      </div>
    );
  }

  if (catalog.error || !catalog.data) {
    return <Alert variant="error">{catalog.error ?? 'Impossible de charger le catalogue.'}</Alert>;
  }

  const { levels, subjects, documentTypes } = catalog.data;

  const sections = [
    { title: 'Niveaux', items: levels.map((level) => level.name) },
    { title: 'Types de documents', items: documentTypes.map((type) => type.name) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        description="Référentiel des niveaux, matières et types de documents."
      />

      <Alert variant="info">
        La modification du catalogue se fera depuis le back-office une fois l’API branchée. Cette page
        est en lecture seule pour le moment.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="py-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">
                {section.title}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <Badge variant="navy">{item}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Matières</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-3 py-2 font-semibold">Matière</th>
                  <th className="px-3 py-2 font-semibold">Niveau</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-3 py-2 font-medium text-navy-800">{subject.name}</td>
                    <td className="px-3 py-2 text-navy-600">
                      {levels.find((level) => level.id === subject.levelId)?.name ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
