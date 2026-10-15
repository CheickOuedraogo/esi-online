// Carte d'un document dans la bibliotheque.

import Link from 'next/link';
import { Badge } from '@/components/ui';
import type { DocumentItem } from '@/contracts/documents';
import { VISIBILITY_LABEL, VISIBILITY_VARIANT, formatAcademicYear, formatFileSize } from '@/lib/labels';

export interface DocumentCardProps {
  document: DocumentItem;
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Link
      href={`/library/${document.id}`}
      className="group flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-5 shadow-sm shadow-navy-900/5 transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
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

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-400">
        <span>{document.subjectName}</span>
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

      <div className="mt-auto flex items-center justify-between border-t border-navy-50 pt-3 text-xs text-navy-400">
        <span>{document.downloadCount} téléchargement{document.downloadCount > 1 ? 's' : ''}</span>
        <span>{formatFileSize(document.sizeBytes)}</span>
      </div>
    </Link>
  );
}
