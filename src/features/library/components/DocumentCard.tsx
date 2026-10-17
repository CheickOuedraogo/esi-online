// Carte d'un document dans la bibliotheque (etudiante ou publique).

import Link from 'next/link';
import { Badge } from '@/components/ui';
import { FavoriteButton } from '@/features/favorites';
import { cn } from '@/lib/utils';
import type { DocumentItem } from '@/contracts/documents';
import {
  VISIBILITY_LABEL,
  VISIBILITY_VARIANT,
  formatAcademicYear,
  formatCount,
  formatFileSize,
} from '@/lib/labels';

export interface DocumentCardProps {
  document: DocumentItem;
  /** Lien de la fiche (par defaut l'espace etudiant). */
  href?: string;
  /** Affiche l'etoile d'ajout aux favoris (espace etudiant uniquement). */
  favorite?: boolean;
}

export function DocumentCard({ document, href, favorite = false }: DocumentCardProps) {
  const target = href ?? `/library/${document.id}`;

  return (
    <div className="group relative h-full rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/5 transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md">
      <Link
        href={target}
        aria-label={`${document.title} — ${document.typeName}`}
        className="flex h-full flex-col p-5 focus-visible:outline-none"
      >
        <div className={cn('flex flex-wrap items-center gap-2', favorite && 'pr-10')}>
          <Badge variant="gold">{document.typeName}</Badge>
          <Badge variant={VISIBILITY_VARIANT[document.visibility]}>
            {VISIBILITY_LABEL[document.visibility]}
          </Badge>
        </div>

        <h3 className="mt-3 line-clamp-2 text-base font-semibold text-navy-900 group-hover:text-navy-700">
          {document.title}
        </h3>
        {document.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-navy-500">{document.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-500">
          <span>{document.subject}</span>
          {document.levelName && (
            <>
              <span aria-hidden="true">·</span>
              <span>{document.levelName}</span>
            </>
          )}
          {document.academicYear != null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatAcademicYear(document.academicYear)}</span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-navy-50 pt-3 text-xs text-navy-500">
          <span>{formatCount(document.downloadCount, 'téléchargement')}</span>
          <span>{formatFileSize(document.sizeBytes)}</span>
        </div>
      </Link>

      {favorite && (
        <FavoriteButton documentId={document.id} className="absolute right-4 top-4" />
      )}
    </div>
  );
}
