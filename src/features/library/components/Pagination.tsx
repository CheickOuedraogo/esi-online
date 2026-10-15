// Pagination de la bibliotheque.

import { Button } from '@/components/ui';
import { formatCount } from '@/lib/labels';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  itemLabel = 'document',
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-between gap-3 ${className ?? ''}`.trim()}
    >
      <p className="text-sm text-navy-500" aria-live="polite">
        Page {page} sur {totalPages} · {formatCount(total, itemLabel)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Précédent
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </nav>
  );
}
