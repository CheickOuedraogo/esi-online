// Petit badge colore pour afficher un statut ou un libelle court.

import { cn } from '@/lib/utils';

export type BadgeVariant = 'navy' | 'gold' | 'green' | 'red' | 'amber' | 'gray';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  navy: 'border-navy-200 bg-navy-50 text-navy-700',
  gold: 'border-gold-300 bg-gold-50 text-gold-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  gray: 'border-navy-100 bg-navy-50 text-navy-500',
};

export function Badge({ className, variant = 'navy', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
