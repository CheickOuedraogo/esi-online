// Filtres de la bibliotheque (niveau, filiere, matiere, type, annee, tri).

import { Select } from '@/components/ui';
import type { Sort } from '@/contracts/common';
import type { CatalogResponse } from '@/contracts/catalog';

export interface LibraryFilters {
  q: string;
  levelId: string;
  programId: string;
  subjectId: string;
  typeId: string;
  year: string;
  sort: Sort;
  page: number;
}

export const EMPTY_FILTERS: LibraryFilters = {
  q: '',
  levelId: '',
  programId: '',
  subjectId: '',
  typeId: '',
  year: '',
  sort: 'recent',
  page: 1,
};

export const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024'] as const;

const SORTS: Array<{ value: Sort; label: 'Plus récents' | 'Plus téléchargés' | 'Titre (A→Z)' }> = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'popular', label: 'Plus téléchargés' },
  { value: 'title', label: 'Titre (A→Z)' },
];

export interface DocumentFiltersProps {
  catalog: CatalogResponse;
  value: LibraryFilters;
  onChange: (patch: Partial<LibraryFilters>) => void;
  onReset: () => void;
}

export function DocumentFilters({ catalog, value, onChange, onReset }: DocumentFiltersProps) {
  const subjects = catalog.subjects.filter((subject) => {
    if (value.levelId && subject.levelId !== value.levelId) return false;
    if (value.programId && subject.programId !== value.programId) return false;
    return true;
  });

  const hasFilters =
    Boolean(value.levelId || value.programId || value.subjectId || value.typeId || value.year);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Select
        aria-label="Niveau"
        value={value.levelId}
        onChange={(event) => onChange({ levelId: event.target.value, subjectId: '', page: 1 })}
      >
        <option value="">Tous les niveaux</option>
        {catalog.levels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filière"
        value={value.programId}
        onChange={(event) => onChange({ programId: event.target.value, subjectId: '', page: 1 })}
      >
        <option value="">Toutes les filières</option>
        {catalog.programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Matière"
        value={value.subjectId}
        onChange={(event) => onChange({ subjectId: event.target.value, page: 1 })}
      >
        <option value="">Toutes les matières</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Type de document"
        value={value.typeId}
        onChange={(event) => onChange({ typeId: event.target.value, page: 1 })}
      >
        <option value="">Tous les types</option>
        {catalog.documentTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Année académique"
        value={value.year}
        onChange={(event) => onChange({ year: event.target.value, page: 1 })}
      >
        <option value="">Toutes les années</option>
        {ACADEMIC_YEARS.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Select>

      <div className="flex gap-3">
        <Select
          aria-label="Tri"
          value={value.sort}
          onChange={(event) => onChange({ sort: event.target.value as Sort, page: 1 })}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="whitespace-nowrap rounded-lg border border-navy-200 px-3 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
