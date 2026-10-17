'use client';

// Bouton etoile pour ajouter ou retirer un document des favoris locaux.

import { cn } from '@/lib/utils';
import { useFavorites } from './FavoritesProvider';

export interface FavoriteButtonProps {
  documentId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ documentId, className, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(documentId);
  const label = active ? 'Retirer des favoris' : 'Ajouter aux favoris';

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(documentId);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full border bg-white transition-colors',
        'focus-visible:outline-none',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        active
          ? 'border-gold-300 bg-gold-50 text-gold-500 hover:bg-gold-100'
          : 'border-navy-200 text-navy-300 hover:border-navy-300 hover:text-navy-500',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
      >
        <path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.87l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z" />
      </svg>
    </button>
  );
}
